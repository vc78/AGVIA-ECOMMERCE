package com.ems.pragathisweets.service.admin;

import com.ems.pragathisweets.entity.Order;
import com.ems.pragathisweets.entity.OrderItem;
import com.ems.pragathisweets.entity.OrderExcelSyncLog;
import com.ems.pragathisweets.entity.Payment;
import com.ems.pragathisweets.repository.OrderExcelSyncLogRepository;
import com.ems.pragathisweets.repository.OrderRepository;
import com.ems.pragathisweets.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.DefaultIndexedColorMap;
import org.apache.poi.xssf.usermodel.XSSFCellStyle;
import org.apache.poi.xssf.usermodel.XSSFColor;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.*;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.locks.ReentrantLock;

import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;

/**
 * Excel Reporting Service (AGVIA_ORDERS.xlsx)
 * 
 * STRICT ARCHITECTURAL CONSTRAINTS:
 * 1. MySQL is the SOLE primary source of truth.
 * 2. This service is ONLY an export/reporting layer.
 * 3. File I/O or Excel generation failures MUST NEVER roll back or affect MySQL orders.
 * 4. The report is fully regeneratable from MySQL at any given time.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class ExcelReportingService {

    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final OrderExcelSyncLogRepository syncLogRepository;

    @Value("${app.reports.excel.filename:AGVIA_ORDERS.xlsx}")
    private String excelFileName;

    @Value("${app.reports.excel.dir:./reports}")
    private String excelOutputDir;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private final ReentrantLock fileLock = new ReentrantLock();

    // Brand luxury palette: Deep Burgundy (#5A1020) and Gold (#C9A45C)
    private static final byte[] COLOR_BURGUNDY = new byte[]{(byte) 90, (byte) 16, (byte) 32};
    private static final byte[] COLOR_GOLD = new byte[]{(byte) 201, (byte) 164, (byte) 92};
    private static final byte[] COLOR_ZEBRA = new byte[]{(byte) 253, (byte) 251, (byte) 247};

    /**
     * Resolves the target Excel file path.
     */
    public Path getExcelFilePath() {
        return Paths.get(excelOutputDir, excelFileName);
    }

    /**
     * Synchronizes a single confirmed order into AGVIA_ORDERS.xlsx.
     * Wrapped in absolute failure isolation: errors are logged and recorded in audit table,
     * never thrown to the caller.
     */
    public void syncOrder(Long orderId) {
        fileLock.lock();
        try {
            Order order = orderRepository.findByIdWithDetails(orderId).orElse(null);
            if (order == null) {
                log.warn("[ExcelReportingService] Order id {} not found in MySQL. Skipping Excel sync.", orderId);
                return;
            }

            Path targetPath = getExcelFilePath();
            if (!Files.exists(targetPath) || Files.size(targetPath) == 0) {
                // If report file does not exist yet, build full report from MySQL
                log.info("[ExcelReportingService] {} does not exist. Initializing fresh from MySQL database...", excelFileName);
                regenerateExcelReportInternal();
                return;
            }

            // File exists: append or update in existing workbook
            appendOrUpdateOrderInWorkbook(order);

            // Record successful sync log in MySQL
            saveSyncLog(order.getId(), order.getOrderNumber(), "APPEND_UPDATE", "SUCCESS", null);
            log.info("[ExcelReportingService] Successfully synced order #{} to {}", order.getOrderNumber(), excelFileName);

        } catch (Throwable t) {
            log.error("[ExcelReportingService] Failed to sync order id {} to Excel: {}", orderId, t.getMessage(), t);
            try {
                saveSyncLog(orderId, "UNKNOWN", "SYNC_ERROR", "FAILED", truncateError(t.getMessage()));
            } catch (Exception ignored) {
                // Never allow audit log write failure to disrupt
            }
        } finally {
            fileLock.unlock();
        }
    }

    /**
     * Fully regenerates AGVIA_ORDERS.xlsx from the authoritative MySQL database.
     */
    public void regenerateExcelReport() {
        fileLock.lock();
        try {
            regenerateExcelReportInternal();
            saveSyncLog(0L, "ALL_ORDERS", "REGENERATE", "SUCCESS", null);
            log.info("[ExcelReportingService] Successfully regenerated {} from MySQL.", excelFileName);
        } catch (Throwable t) {
            log.error("[ExcelReportingService] Error regenerating {}: {}", excelFileName, t.getMessage(), t);
            saveSyncLog(0L, "ALL_ORDERS", "REGENERATE", "FAILED", truncateError(t.getMessage()));
            throw new RuntimeException("Excel regeneration failed: " + t.getMessage(), t);
        } finally {
            fileLock.unlock();
        }
    }

    private void regenerateExcelReportInternal() throws IOException {
        List<Order> orders = orderRepository.findAllWithDetails();
        List<Payment> payments = paymentRepository.findAll();

        Map<Long, Payment> paymentMap = new HashMap<>();
        for (Payment p : payments) {
            if (p.getOrder() != null && p.getOrder().getId() != null) {
                paymentMap.put(p.getOrder().getId(), p);
            }
        }

        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            buildFullWorkbook(workbook, orders, paymentMap);

            Path dirPath = Paths.get(excelOutputDir);
            if (!Files.exists(dirPath)) {
                Files.createDirectories(dirPath);
            }

            Path tempFile = Paths.get(excelOutputDir, excelFileName + ".tmp");
            try (OutputStream fos = Files.newOutputStream(tempFile)) {
                workbook.write(fos);
            }

            Path finalPath = getExcelFilePath();
            Files.move(tempFile, finalPath, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
        }
    }

    private void appendOrUpdateOrderInWorkbook(Order order) throws IOException {
        Path targetPath = getExcelFilePath();
        Payment payment = paymentRepository.findByOrderId(order.getId()).orElse(null);

        try (InputStream fis = Files.newInputStream(targetPath);
             XSSFWorkbook workbook = new XSSFWorkbook(fis)) {

            Sheet ordersSheet = workbook.getSheet("Orders Master");
            Sheet itemsSheet = workbook.getSheet("Order Line Items");
            Sheet paymentsSheet = workbook.getSheet("Payments Ledger");

            if (ordersSheet == null || itemsSheet == null || paymentsSheet == null) {
                // If sheets are corrupted or missing, trigger clean regeneration
                regenerateExcelReportInternal();
                return;
            }

            CreationHelper helper = workbook.getCreationHelper();
            DataFormat dataFormat = workbook.createDataFormat();

            // Find existing row in Orders Master by orderNumber (column 0)
            int existingOrderRowIndex = -1;
            for (int r = 2; r <= ordersSheet.getLastRowNum(); r++) {
                Row row = ordersSheet.getRow(r);
                if (row != null && row.getCell(0) != null) {
                    if (order.getOrderNumber().equalsIgnoreCase(row.getCell(0).getStringCellValue())) {
                        existingOrderRowIndex = r;
                        break;
                    }
                }
            }

            CellStyle normalStyle = createNormalStyle(workbook);
            CellStyle currencyStyle = createCurrencyStyle(workbook, dataFormat);

            int targetRow = (existingOrderRowIndex != -1) ? existingOrderRowIndex : ordersSheet.getLastRowNum() + 1;
            Row row = ordersSheet.getRow(targetRow);
            if (row == null) row = ordersSheet.createRow(targetRow);

            populateOrderRow(row, order, normalStyle, currencyStyle);

            // If new order, also append items and payment
            if (existingOrderRowIndex == -1) {
                if (order.getItems() != null) {
                    for (OrderItem item : order.getItems()) {
                        int itemRowIndex = itemsSheet.getLastRowNum() + 1;
                        Row itemRow = itemsSheet.createRow(itemRowIndex);
                        populateItemRow(itemRow, order, item, normalStyle, currencyStyle);
                    }
                }

                if (payment != null) {
                    int payRowIndex = paymentsSheet.getLastRowNum() + 1;
                    Row payRow = paymentsSheet.createRow(payRowIndex);
                    populatePaymentRow(payRow, order, payment, normalStyle, currencyStyle);
                }
            }

            // Save atomically
            Path tempFile = Paths.get(excelOutputDir, excelFileName + ".tmp");
            try (OutputStream fos = Files.newOutputStream(tempFile)) {
                workbook.write(fos);
            }
            Files.move(tempFile, targetPath, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
        }
    }

    /**
     * Builds complete 3-sheet luxury workbook.
     */
    private void buildFullWorkbook(XSSFWorkbook workbook, List<Order> orders, Map<Long, Payment> paymentMap) {
        DataFormat dataFormat = workbook.createDataFormat();

        // Styles
        CellStyle titleStyle = createTitleStyle(workbook);
        CellStyle headerStyle = createHeaderStyle(workbook);
        CellStyle normalStyle = createNormalStyle(workbook);
        CellStyle zebraStyle = createZebraStyle(workbook);
        CellStyle currencyStyle = createCurrencyStyle(workbook, dataFormat);
        CellStyle currencyZebraStyle = createCurrencyZebraStyle(workbook, dataFormat);

        // ── Sheet 1: Orders Master ───────────────────────────────────────────
        Sheet sheetOrders = workbook.createSheet("Orders Master");
        sheetOrders.setDisplayGridlines(true);

        // Title Banner
        Row titleRow = sheetOrders.createRow(0);
        Cell titleCell = titleRow.createCell(0);
        titleCell.setCellValue("AGVIA ATELIER — OFFICIAL ORDER REGISTRY (PRIMARY SOURCE: MYSQL)");
        titleCell.setCellStyle(titleStyle);

        // Header Row
        String[] orderHeaders = {
            "Order ID", "Placement Date", "Patron Name", "Patron Email", "Contact Phone",
            "Items Count", "Subtotal (₹)", "Discount (₹)", "Final Total (₹)", "Coupon Code",
            "Payment Method", "Payment Status", "Order Status", "Shipping Address", "Order Notes"
        };
        Row headerRow = sheetOrders.createRow(1);
        headerRow.setHeightInPoints(24);
        for (int i = 0; i < orderHeaders.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(orderHeaders[i]);
            cell.setCellStyle(headerStyle);
        }

        int rowIdx = 2;
        for (Order order : orders) {
            Row r = sheetOrders.createRow(rowIdx);
            boolean isZebra = (rowIdx % 2 == 1);
            CellStyle base = isZebra ? zebraStyle : normalStyle;
            CellStyle curr = isZebra ? currencyZebraStyle : currencyStyle;
            populateOrderRow(r, order, base, curr);
            rowIdx++;
        }

        // ── Sheet 2: Order Line Items ────────────────────────────────────────
        Sheet sheetItems = workbook.createSheet("Order Line Items");
        sheetItems.setDisplayGridlines(true);

        Row titleItems = sheetItems.createRow(0);
        Cell titleItemsCell = titleItems.createCell(0);
        titleItemsCell.setCellValue("AGVIA ATELIER — ORDER LINE ITEMS DETAIL");
        titleItemsCell.setCellStyle(titleStyle);

        String[] itemHeaders = {
            "Order ID", "Placement Date", "Product / Silhouette", "SKU Identifier",
            "Unit Price (₹)", "Quantity", "Line Total (₹)"
        };
        Row headerItemsRow = sheetItems.createRow(1);
        headerItemsRow.setHeightInPoints(24);
        for (int i = 0; i < itemHeaders.length; i++) {
            Cell cell = headerItemsRow.createCell(i);
            cell.setCellValue(itemHeaders[i]);
            cell.setCellStyle(headerStyle);
        }

        int itemRowIdx = 2;
        for (Order order : orders) {
            if (order.getItems() != null) {
                for (OrderItem item : order.getItems()) {
                    Row r = sheetItems.createRow(itemRowIdx);
                    boolean isZebra = (itemRowIdx % 2 == 1);
                    CellStyle base = isZebra ? zebraStyle : normalStyle;
                    CellStyle curr = isZebra ? currencyZebraStyle : currencyStyle;
                    populateItemRow(r, order, item, base, curr);
                    itemRowIdx++;
                }
            }
        }

        // ── Sheet 3: Payments Ledger ─────────────────────────────────────────
        Sheet sheetPayments = workbook.createSheet("Payments Ledger");
        sheetPayments.setDisplayGridlines(true);

        Row titlePay = sheetPayments.createRow(0);
        Cell titlePayCell = titlePay.createCell(0);
        titlePayCell.setCellValue("AGVIA ATELIER — GATEWAY & TRANSACTION AUDIT LEDGER");
        titlePayCell.setCellStyle(titleStyle);

        String[] payHeaders = {
            "Order ID", "Payment Method", "Gateway Order ID", "Gateway Payment ID",
            "Payment Status", "Amount Paid (₹)", "Currency", "Failure Reason", "Transaction Timestamp"
        };
        Row headerPayRow = sheetPayments.createRow(1);
        headerPayRow.setHeightInPoints(24);
        for (int i = 0; i < payHeaders.length; i++) {
            Cell cell = headerPayRow.createCell(i);
            cell.setCellValue(payHeaders[i]);
            cell.setCellStyle(headerStyle);
        }

        int payRowIdx = 2;
        for (Order order : orders) {
            Payment p = paymentMap.get(order.getId());
            if (p != null) {
                Row r = sheetPayments.createRow(payRowIdx);
                boolean isZebra = (payRowIdx % 2 == 1);
                CellStyle base = isZebra ? zebraStyle : normalStyle;
                CellStyle curr = isZebra ? currencyZebraStyle : currencyStyle;
                populatePaymentRow(r, order, p, base, curr);
                payRowIdx++;
            }
        }

        // Auto-fit columns with safety bounds
        autoFitColumns(sheetOrders, orderHeaders.length);
        autoFitColumns(sheetItems, itemHeaders.length);
        autoFitColumns(sheetPayments, payHeaders.length);
    }

    private void populateOrderRow(Row r, Order order, CellStyle base, CellStyle curr) {
        String patronName = (order.getUser() != null && order.getUser().getFullName() != null)
                ? order.getUser().getFullName() : "Valued Patron";
        String patronEmail = (order.getUser() != null && order.getUser().getEmail() != null)
                ? order.getUser().getEmail() : "N/A";
        String phone = (order.getContactPhone() != null && !order.getContactPhone().isBlank())
                ? order.getContactPhone() : (order.getUser() != null ? order.getUser().getPhone() : "N/A");
        String dateStr = (order.getCreatedAt() != null) ? order.getCreatedAt().format(DATE_FORMATTER) : "N/A";
        int itemsCount = (order.getItems() != null) ? order.getItems().size() : 0;

        createCell(r, 0, order.getOrderNumber(), base);
        createCell(r, 1, dateStr, base);
        createCell(r, 2, patronName, base);
        createCell(r, 3, patronEmail, base);
        createCell(r, 4, phone, base);
        createNumberCell(r, 5, itemsCount, base);
        createCurrencyCell(r, 6, order.getTotalAmount(), curr);
        createCurrencyCell(r, 7, order.getDiscountAmount() != null ? order.getDiscountAmount() : BigDecimal.ZERO, curr);
        createCurrencyCell(r, 8, order.getFinalAmount(), curr);
        createCell(r, 9, order.getCouponCode() != null ? order.getCouponCode() : "NONE", base);
        createCell(r, 10, order.getPaymentMethod() != null ? order.getPaymentMethod().name() : "N/A", base);
        createCell(r, 11, order.getPaymentStatus() != null ? order.getPaymentStatus().name() : "PENDING", base);
        createCell(r, 12, order.getStatus() != null ? order.getStatus().name() : "PENDING", base);
        createCell(r, 13, order.getShippingAddress() != null ? order.getShippingAddress() : "N/A", base);
        createCell(r, 14, order.getNotes() != null ? order.getNotes() : "", base);
    }

    private void populateItemRow(Row r, Order order, OrderItem item, CellStyle base, CellStyle curr) {
        String dateStr = (order.getCreatedAt() != null) ? order.getCreatedAt().format(DATE_FORMATTER) : "N/A";
        String sku = (item.getProduct() != null && item.getProduct().getSku() != null) ? item.getProduct().getSku() : "N/A";

        createCell(r, 0, order.getOrderNumber(), base);
        createCell(r, 1, dateStr, base);
        createCell(r, 2, item.getProductName(), base);
        createCell(r, 3, sku, base);
        createCurrencyCell(r, 4, item.getPrice(), curr);
        createNumberCell(r, 5, item.getQuantity() != null ? item.getQuantity() : 1, base);
        createCurrencyCell(r, 6, item.getSubtotal(), curr);
    }

    private void populatePaymentRow(Row r, Order order, Payment p, CellStyle base, CellStyle curr) {
        String dateStr = (p.getCreatedAt() != null) ? p.getCreatedAt().format(DATE_FORMATTER) : "N/A";

        createCell(r, 0, order.getOrderNumber(), base);
        createCell(r, 1, order.getPaymentMethod() != null ? order.getPaymentMethod().name() : "N/A", base);
        createCell(r, 2, p.getRazorpayOrderId() != null ? p.getRazorpayOrderId() : "N/A", base);
        createCell(r, 3, p.getRazorpayPaymentId() != null ? p.getRazorpayPaymentId() : "N/A", base);
        createCell(r, 4, p.getStatus() != null ? p.getStatus().name() : "N/A", base);
        createCurrencyCell(r, 5, p.getAmount() != null ? p.getAmount() : BigDecimal.ZERO, curr);
        createCell(r, 6, p.getCurrency() != null ? p.getCurrency() : "INR", base);
        createCell(r, 7, p.getFailureReason() != null ? p.getFailureReason() : "", base);
        createCell(r, 8, dateStr, base);
    }

    private void createCell(Row r, int col, String val, CellStyle style) {
        Cell cell = r.createCell(col);
        cell.setCellValue(val != null ? val : "");
        cell.setCellStyle(style);
    }

    private void createNumberCell(Row r, int col, double val, CellStyle style) {
        Cell cell = r.createCell(col);
        cell.setCellValue(val);
        cell.setCellStyle(style);
    }

    private void createCurrencyCell(Row r, int col, BigDecimal val, CellStyle style) {
        Cell cell = r.createCell(col);
        cell.setCellValue(val != null ? val.doubleValue() : 0.0);
        cell.setCellStyle(style);
    }

    private void autoFitColumns(Sheet sheet, int numCols) {
        try {
            for (int i = 0; i < numCols; i++) {
                sheet.autoSizeColumn(i);
                int width = sheet.getColumnWidth(i);
                // Minimum 12 chars (3200 units), max 60 chars (15000 units)
                if (width < 3200) {
                    sheet.setColumnWidth(i, 3200);
                } else if (width > 15000) {
                    sheet.setColumnWidth(i, 15000);
                }
            }
        } catch (Throwable t) {
            log.warn("[ExcelReportingService] autoSizeColumn unavailable in environment, applying default widths: {}", t.getMessage());
            for (int i = 0; i < numCols; i++) {
                sheet.setColumnWidth(i, 4500);
            }
        }
    }

    public File getOrGenerateExcelReport() {
        fileLock.lock();
        try {
            Path filePath = getExcelFilePath();
            if (!Files.exists(filePath) || Files.size(filePath) == 0) {
                regenerateExcelReportInternal();
            }
            return filePath.toFile();
        } catch (IOException e) {
            log.error("[ExcelReportingService] Error accessing or generating report: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to load Excel report: " + e.getMessage(), e);
        } finally {
            fileLock.unlock();
        }
    }

    public Map<String, Object> getExcelSyncStatus() {
        Path filePath = getExcelFilePath();
        boolean exists = Files.exists(filePath);
        long fileSize = 0;
        LocalDateTime lastModified = null;

        if (exists) {
            try {
                fileSize = Files.size(filePath);
                lastModified = LocalDateTime.ofInstant(
                        Files.getLastModifiedTime(filePath).toInstant(),
                        TimeZone.getDefault().toZoneId()
                );
            } catch (IOException ignored) {}
        }

        long totalOrders = orderRepository.count();
        var lastLog = syncLogRepository.findTopByOrderBySyncedAtDesc();

        Map<String, Object> status = new LinkedHashMap<>();
        status.put("fileName", excelFileName);
        status.put("exists", exists);
        status.put("fileSizeBytes", fileSize);
        status.put("formattedSize", formatFileSize(fileSize));
        status.put("lastModified", lastModified != null ? lastModified.format(DATE_FORMATTER) : "N/A");
        status.put("totalOrdersInMySQL", totalOrders);
        status.put("lastSyncAction", lastLog.map(OrderExcelSyncLog::getAction).orElse("NONE"));
        status.put("lastSyncStatus", lastLog.map(OrderExcelSyncLog::getStatus).orElse("NONE"));
        status.put("lastSyncedAt", lastLog.map(l -> l.getSyncedAt() != null ? l.getSyncedAt().format(DATE_FORMATTER) : "N/A").orElse("N/A"));
        status.put("isPrimarySourceOfTruth", "MySQL");

        return status;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void saveSyncLog(Long orderId, String orderNumber, String action, String status, String errorMessage) {
        try {
            OrderExcelSyncLog logEntry = OrderExcelSyncLog.builder()
                    .orderId(orderId != null ? orderId : 0L)
                    .orderNumber(orderNumber != null ? orderNumber : "N/A")
                    .action(action)
                    .status(status)
                    .errorMessage(errorMessage)
                    .syncedAt(LocalDateTime.now())
                    .build();
            syncLogRepository.save(logEntry);
        } catch (Exception ex) {
            log.error("[ExcelReportingService] Could not persist sync audit log: {}", ex.getMessage());
        }
    }

    private String truncateError(String err) {
        if (err == null) return null;
        return err.length() > 990 ? err.substring(0, 990) : err;
    }

    private String formatFileSize(long bytes) {
        if (bytes <= 0) return "0 B";
        if (bytes < 1024) return bytes + " B";
        int exp = (int) (Math.log(bytes) / Math.log(1024));
        char pre = "KMGTPE".charAt(exp - 1);
        return String.format("%.1f %sB", bytes / Math.pow(1024, exp), pre);
    }

    // ── Style Factory Helpers ────────────────────────────────────────────────
    private CellStyle createTitleStyle(XSSFWorkbook wb) {
        XSSFCellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 12);
        font.setColor(IndexedColors.WHITE.getIndex());
        style.setFont(font);
        style.setFillForegroundColor(new XSSFColor(COLOR_BURGUNDY, new DefaultIndexedColorMap()));
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setAlignment(HorizontalAlignment.LEFT);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        return style;
    }

    private CellStyle createHeaderStyle(XSSFWorkbook wb) {
        XSSFCellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 10);
        font.setColor(IndexedColors.WHITE.getIndex());
        style.setFont(font);
        style.setFillForegroundColor(new XSSFColor(COLOR_BURGUNDY, new DefaultIndexedColorMap()));
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        setBorders(style);
        return style;
    }

    private CellStyle createNormalStyle(XSSFWorkbook wb) {
        XSSFCellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setFontHeightInPoints((short) 10);
        style.setFont(font);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        setBorders(style);
        return style;
    }

    private CellStyle createZebraStyle(XSSFWorkbook wb) {
        XSSFCellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setFontHeightInPoints((short) 10);
        style.setFont(font);
        style.setFillForegroundColor(new XSSFColor(COLOR_ZEBRA, new DefaultIndexedColorMap()));
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        setBorders(style);
        return style;
    }

    private CellStyle createCurrencyStyle(XSSFWorkbook wb, DataFormat df) {
        XSSFCellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setFontHeightInPoints((short) 10);
        style.setFont(font);
        style.setDataFormat(df.getFormat("₹#,##0.00"));
        style.setAlignment(HorizontalAlignment.RIGHT);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        setBorders(style);
        return style;
    }

    private CellStyle createCurrencyZebraStyle(XSSFWorkbook wb, DataFormat df) {
        XSSFCellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setFontHeightInPoints((short) 10);
        style.setFont(font);
        style.setDataFormat(df.getFormat("₹#,##0.00"));
        style.setFillForegroundColor(new XSSFColor(COLOR_ZEBRA, new DefaultIndexedColorMap()));
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setAlignment(HorizontalAlignment.RIGHT);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        setBorders(style);
        return style;
    }

    private void setBorders(CellStyle style) {
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        style.setTopBorderColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setBottomBorderColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setLeftBorderColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setRightBorderColor(IndexedColors.GREY_25_PERCENT.getIndex());
    }
}
