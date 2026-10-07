package com.ems.pragathisweets.service.admin;

import com.ems.pragathisweets.entity.Order;
import com.ems.pragathisweets.entity.OrderItem;
import com.ems.pragathisweets.entity.OrderStatus;
import com.ems.pragathisweets.entity.Payment;
import com.ems.pragathisweets.entity.PaymentMethod;
import com.ems.pragathisweets.entity.PaymentStatus;
import com.ems.pragathisweets.entity.OrderExcelSyncLog;
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
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.io.*;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.locks.ReentrantLock;
import java.util.stream.Collectors;

/**
 * Excel Reporting Service (AGVIA_ORDERS.xlsx)
 * 
 * STRICT ARCHITECTURAL CONSTRAINTS:
 * 1. MySQL is the SOLE primary source of truth.
 * 2. This service is ONLY an export/reporting layer.
 * 3. File I/O or Excel generation failures MUST NEVER roll back or affect MySQL orders.
 * 4. The report is fully regeneratable from MySQL at any given time.
 * 
 * Tab Structure (Exactly 4 sheets):
 * 1. ORDERS
 * 2. ORDER ITEMS
 * 3. CUSTOMERS
 * 4. SUMMARY
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

    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
    private static final DateTimeFormatter LOG_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private final ReentrantLock fileLock = new ReentrantLock();

    // Brand luxury palette: Deep Burgundy (#5A1020) and Light Ivory/Slate Zebra (#F7FAFC)
    private static final byte[] COLOR_BURGUNDY = new byte[]{(byte) 90, (byte) 16, (byte) 32};
    private static final byte[] COLOR_ZEBRA = new byte[]{(byte) 247, (byte) 250, (byte) 252};
    private static final byte[] COLOR_TOTAL_BG = new byte[]{(byte) 238, (byte) 242, (byte) 246};

    public Path getExcelFilePath() {
        return Paths.get(excelOutputDir, excelFileName);
    }

    /**
     * Synchronizes a single order into AGVIA_ORDERS.xlsx.
     * Wrapped in absolute failure isolation.
     */
    public void syncOrder(Long orderId) {
        fileLock.lock();
        try {
            Order order = orderRepository.findByIdWithDetails(orderId).orElse(null);
            if (order == null) {
                log.warn("[ExcelReportingService] Order id {} not found in MySQL. Skipping Excel sync.", orderId);
                return;
            }

            regenerateExcelReportInternal();
            saveSyncLog(order.getId(), order.getOrderNumber(), "ORDER_SYNC", "SUCCESS", null);
            log.info("[ExcelReportingService] Successfully synced order #{} into {}", order.getOrderNumber(), excelFileName);
        } catch (Throwable t) {
            log.error("[ExcelReportingService] Failed to sync order id {} to Excel: {}", orderId, t.getMessage(), t);
            try {
                saveSyncLog(orderId, "UNKNOWN", "SYNC_ERROR", "FAILED", truncateError(t.getMessage()));
            } catch (Exception ignored) {}
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

    /**
     * Generates a filtered Excel report as a byte array for download.
     */
    public byte[] generateFilteredExcelReport(LocalDate startDate, LocalDate endDate, OrderStatus status) throws IOException {
        List<Order> allOrders = orderRepository.findAllWithDetails();

        List<Order> filtered = allOrders.stream().filter(o -> {
            if (status != null && o.getStatus() != status) {
                return false;
            }
            if (startDate != null && o.getCreatedAt() != null && o.getCreatedAt().toLocalDate().isBefore(startDate)) {
                return false;
            }
            if (endDate != null && o.getCreatedAt() != null && o.getCreatedAt().toLocalDate().isAfter(endDate)) {
                return false;
            }
            return true;
        }).collect(Collectors.toList());

        List<Payment> payments = paymentRepository.findAll();
        Map<Long, Payment> paymentMap = new HashMap<>();
        for (Payment p : payments) {
            if (p.getOrder() != null && p.getOrder().getId() != null) {
                paymentMap.put(p.getOrder().getId(), p);
            }
        }

        try (XSSFWorkbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            buildFullWorkbook(workbook, filtered, paymentMap);
            workbook.write(out);
            return out.toByteArray();
        }
    }

    /**
     * Builds the complete 4-sheet workbook with exact columns specified:
     * 1. ORDERS
     * 2. ORDER ITEMS
     * 3. CUSTOMERS
     * 4. SUMMARY
     */
    private void buildFullWorkbook(XSSFWorkbook workbook, List<Order> orders, Map<Long, Payment> paymentMap) {
        DataFormat dataFormat = workbook.createDataFormat();

        CellStyle headerStyle = createHeaderStyle(workbook);
        CellStyle normalStyle = createNormalStyle(workbook);
        CellStyle zebraStyle = createZebraStyle(workbook);
        CellStyle currencyStyle = createCurrencyStyle(workbook, dataFormat);
        CellStyle currencyZebraStyle = createCurrencyZebraStyle(workbook, dataFormat);
        CellStyle totalStyle = createTotalStyle(workbook);
        CellStyle totalCurrencyStyle = createTotalCurrencyStyle(workbook, dataFormat);

        // =====================================================================
        // SHEET 1: ORDERS
        // Columns: Order ID, Date, Customer Name, Customer Email, Customer Phone,
        // Shipping Address, Payment Method, Payment Status, Order Status,
        // Total Amount, Discount, Final Amount, Notes
        // =====================================================================
        Sheet sheetOrders = workbook.createSheet("ORDERS");
        sheetOrders.setDisplayGridlines(true);
        sheetOrders.createFreezePane(0, 1);

        String[] orderHeaders = {
            "Order ID", "Date", "Customer Name", "Customer Email", "Customer Phone",
            "Shipping Address", "Payment Method", "Payment Status", "Order Status",
            "Total Amount", "Discount", "Final Amount", "Notes"
        };
        Row headerOrdersRow = sheetOrders.createRow(0);
        headerOrdersRow.setHeightInPoints(26);
        for (int i = 0; i < orderHeaders.length; i++) {
            Cell c = headerOrdersRow.createCell(i);
            c.setCellValue(orderHeaders[i]);
            c.setCellStyle(headerStyle);
        }

        int orderRowIdx = 1;
        for (Order o : orders) {
            Row r = sheetOrders.createRow(orderRowIdx);
            boolean isZebra = (orderRowIdx % 2 == 1);
            CellStyle base = isZebra ? zebraStyle : normalStyle;
            CellStyle curr = isZebra ? currencyZebraStyle : currencyStyle;

            String patronName = (o.getUser() != null && o.getUser().getFullName() != null)
                    ? o.getUser().getFullName() : "Guest Patron";
            String patronEmail = (o.getUser() != null && o.getUser().getEmail() != null)
                    ? o.getUser().getEmail() : "N/A";
            String phone = (o.getContactPhone() != null && !o.getContactPhone().isBlank())
                    ? o.getContactPhone() : (o.getUser() != null ? o.getUser().getPhone() : "N/A");
            String dateStr = (o.getCreatedAt() != null) ? o.getCreatedAt().format(DATE_TIME_FORMATTER) : "N/A";

            createCell(r, 0, o.getOrderNumber(), base);
            createCell(r, 1, dateStr, base);
            createCell(r, 2, patronName, base);
            createCell(r, 3, patronEmail, base);
            createCell(r, 4, phone, base);
            createCell(r, 5, o.getShippingAddress() != null ? o.getShippingAddress() : "N/A", base);
            createCell(r, 6, o.getPaymentMethod() != null ? o.getPaymentMethod().name() : "N/A", base);
            createCell(r, 7, o.getPaymentStatus() != null ? o.getPaymentStatus().name() : "PENDING", base);
            createCell(r, 8, o.getStatus() != null ? o.getStatus().name() : "PENDING", base);
            createCurrencyCell(r, 9, o.getTotalAmount(), curr);
            createCurrencyCell(r, 10, o.getDiscountAmount() != null ? o.getDiscountAmount() : BigDecimal.ZERO, curr);
            createCurrencyCell(r, 11, o.getFinalAmount(), curr);
            createCell(r, 12, o.getNotes() != null ? o.getNotes() : "", base);

            orderRowIdx++;
        }

        // Total Row for ORDERS sheet
        if (!orders.isEmpty()) {
            Row totalRow = sheetOrders.createRow(orderRowIdx);
            createCell(totalRow, 0, "TOTAL", totalStyle);
            for (int col = 1; col <= 8; col++) {
                createCell(totalRow, col, "", totalStyle);
            }
            Cell cTotalAmount = totalRow.createCell(9);
            cTotalAmount.setCellFormula("SUM(J2:J" + orderRowIdx + ")");
            cTotalAmount.setCellStyle(totalCurrencyStyle);

            Cell cDiscount = totalRow.createCell(10);
            cDiscount.setCellFormula("SUM(K2:K" + orderRowIdx + ")");
            cDiscount.setCellStyle(totalCurrencyStyle);

            Cell cFinalAmount = totalRow.createCell(11);
            cFinalAmount.setCellFormula("SUM(L2:L" + orderRowIdx + ")");
            cFinalAmount.setCellStyle(totalCurrencyStyle);

            createCell(totalRow, 12, "", totalStyle);
        }

        // =====================================================================
        // SHEET 2: ORDER ITEMS
        // Columns: Order ID, Product ID, Product Name, Variant ID, Color, SKU, Category, Quantity, Unit Price, Subtotal, Primary Image URL
        // =====================================================================
        Sheet sheetItems = workbook.createSheet("ORDER ITEMS");
        sheetItems.setDisplayGridlines(true);
        sheetItems.createFreezePane(0, 1);

        String[] itemHeaders = {
            "Order ID", "Product ID", "Product Name", "Variant ID", "Color", "SKU", "Category", "Quantity", "Unit Price", "Subtotal", "Primary Image URL"
        };
        Row headerItemsRow = sheetItems.createRow(0);
        headerItemsRow.setHeightInPoints(26);
        for (int i = 0; i < itemHeaders.length; i++) {
            Cell c = headerItemsRow.createCell(i);
            c.setCellValue(itemHeaders[i]);
            c.setCellStyle(headerStyle);
        }

        int itemRowIdx = 1;
        for (Order o : orders) {
            if (o.getItems() != null) {
                for (OrderItem it : o.getItems()) {
                    Row r = sheetItems.createRow(itemRowIdx);
                    boolean isZebra = (itemRowIdx % 2 == 1);
                    CellStyle base = isZebra ? zebraStyle : normalStyle;
                    CellStyle curr = isZebra ? currencyZebraStyle : currencyStyle;

                    String prodIdStr = (it.getProduct() != null && it.getProduct().getId() != null)
                            ? String.valueOf(it.getProduct().getId()) : "N/A";
                    String variantIdStr = (it.getVariantId() != null)
                            ? String.valueOf(it.getVariantId()) : "N/A";
                    String color = (it.getColorName() != null && !it.getColorName().isBlank())
                            ? it.getColorName() : "Standard";
                    String sku = (it.getSku() != null && !it.getSku().isBlank())
                            ? it.getSku() : ((it.getProduct() != null && it.getProduct().getSku() != null) ? it.getProduct().getSku() : "N/A");
                    String category = (it.getProduct() != null && it.getProduct().getCategory() != null)
                            ? it.getProduct().getCategory().getName() : "General";
                    String imgUrl = (it.getImageUrl() != null && !it.getImageUrl().isBlank())
                            ? it.getImageUrl() : ((it.getProduct() != null && it.getProduct().getImageUrl() != null) ? it.getProduct().getImageUrl() : "N/A");

                    createCell(r, 0, o.getOrderNumber(), base);
                    createCell(r, 1, prodIdStr, base);
                    createCell(r, 2, it.getProductName(), base);
                    createCell(r, 3, variantIdStr, base);
                    createCell(r, 4, color, base);
                    createCell(r, 5, sku, base);
                    createCell(r, 6, category, base);
                    createNumberCell(r, 7, it.getQuantity() != null ? it.getQuantity() : 1, base);
                    createCurrencyCell(r, 8, it.getPrice(), curr);
                    createCurrencyCell(r, 9, it.getSubtotal(), curr);
                    createCell(r, 10, imgUrl, base);

                    itemRowIdx++;
                }
            }
        }

        // Total Row for ORDER ITEMS
        if (itemRowIdx > 1) {
            Row totalItemRow = sheetItems.createRow(itemRowIdx);
            createCell(totalItemRow, 0, "TOTAL", totalStyle);
            for (int c = 1; c <= 6; c++) {
                createCell(totalItemRow, c, "", totalStyle);
            }
            Cell cQty = totalItemRow.createCell(7);
            cQty.setCellFormula("SUM(H2:H" + itemRowIdx + ")");
            cQty.setCellStyle(totalStyle);

            createCell(totalItemRow, 8, "", totalStyle);

            Cell cSubtotal = totalItemRow.createCell(9);
            cSubtotal.setCellFormula("SUM(J2:J" + itemRowIdx + ")");
            cSubtotal.setCellStyle(totalCurrencyStyle);

            createCell(totalItemRow, 10, "", totalStyle);
        }

        // =====================================================================
        // SHEET 3: CUSTOMERS
        // Columns: Customer Name, Email, Phone, Total Orders Placed, Total Amount Spent, Last Order Date
        // =====================================================================
        Sheet sheetCustomers = workbook.createSheet("CUSTOMERS");
        sheetCustomers.setDisplayGridlines(true);
        sheetCustomers.createFreezePane(0, 1);

        String[] customerHeaders = {
            "Customer Name", "Email", "Phone", "Total Orders Placed", "Total Amount Spent", "Last Order Date"
        };
        Row headerCustomerRow = sheetCustomers.createRow(0);
        headerCustomerRow.setHeightInPoints(26);
        for (int i = 0; i < customerHeaders.length; i++) {
            Cell c = headerCustomerRow.createCell(i);
            c.setCellValue(customerHeaders[i]);
            c.setCellStyle(headerStyle);
        }

        // Aggregate customer metrics from orders
        class CustomerStat {
            String name = "Guest Patron";
            String email = "N/A";
            String phone = "N/A";
            int orderCount = 0;
            BigDecimal totalSpent = BigDecimal.ZERO;
            LocalDateTime lastOrderDate;
        }

        Map<String, CustomerStat> customerMap = new LinkedHashMap<>();
        for (Order o : orders) {
            String emailKey = (o.getUser() != null && o.getUser().getEmail() != null)
                    ? o.getUser().getEmail().trim().toLowerCase()
                    : "guest_" + (o.getContactPhone() != null ? o.getContactPhone() : o.getOrderNumber());

            CustomerStat stat = customerMap.computeIfAbsent(emailKey, k -> new CustomerStat());
            if (o.getUser() != null && o.getUser().getFullName() != null) {
                stat.name = o.getUser().getFullName();
            }
            if (o.getUser() != null && o.getUser().getEmail() != null) {
                stat.email = o.getUser().getEmail();
            }
            if (o.getContactPhone() != null && !o.getContactPhone().isBlank()) {
                stat.phone = o.getContactPhone();
            } else if (o.getUser() != null && o.getUser().getPhone() != null) {
                stat.phone = o.getUser().getPhone();
            }

            stat.orderCount++;
            if (o.getStatus() != OrderStatus.CANCELLED) {
                stat.totalSpent = stat.totalSpent.add(o.getFinalAmount() != null ? o.getFinalAmount() : BigDecimal.ZERO);
            }
            if (o.getCreatedAt() != null) {
                if (stat.lastOrderDate == null || o.getCreatedAt().isAfter(stat.lastOrderDate)) {
                    stat.lastOrderDate = o.getCreatedAt();
                }
            }
        }

        int custRowIdx = 1;
        for (CustomerStat stat : customerMap.values()) {
            Row r = sheetCustomers.createRow(custRowIdx);
            boolean isZebra = (custRowIdx % 2 == 1);
            CellStyle base = isZebra ? zebraStyle : normalStyle;
            CellStyle curr = isZebra ? currencyZebraStyle : currencyStyle;

            String lastDateStr = stat.lastOrderDate != null ? stat.lastOrderDate.format(DATE_TIME_FORMATTER) : "N/A";

            createCell(r, 0, stat.name, base);
            createCell(r, 1, stat.email, base);
            createCell(r, 2, stat.phone, base);
            createNumberCell(r, 3, stat.orderCount, base);
            createCurrencyCell(r, 4, stat.totalSpent, curr);
            createCell(r, 5, lastDateStr, base);

            custRowIdx++;
        }

        // Total row for CUSTOMERS
        if (custRowIdx > 1) {
            Row totalCustRow = sheetCustomers.createRow(custRowIdx);
            createCell(totalCustRow, 0, "TOTAL", totalStyle);
            createCell(totalCustRow, 1, "", totalStyle);
            createCell(totalCustRow, 2, "", totalStyle);

            Cell cTotalOrders = totalCustRow.createCell(3);
            cTotalOrders.setCellFormula("SUM(D2:D" + custRowIdx + ")");
            cTotalOrders.setCellStyle(totalStyle);

            Cell cTotalSpent = totalCustRow.createCell(4);
            cTotalSpent.setCellFormula("SUM(E2:E" + custRowIdx + ")");
            cTotalSpent.setCellStyle(totalCurrencyStyle);

            createCell(totalCustRow, 5, "", totalStyle);
        }

        // =====================================================================
        // SHEET 4: SUMMARY
        // Key metrics: Total Revenue, Total Orders, Paid Orders, Pending Orders,
        // COD Orders, Online Orders, Average Order Value
        // =====================================================================
        Sheet sheetSummary = workbook.createSheet("SUMMARY");
        sheetSummary.setDisplayGridlines(true);
        sheetSummary.createFreezePane(0, 1);

        String[] summaryHeaders = {"Key Operational Metric", "Value"};
        Row headerSummaryRow = sheetSummary.createRow(0);
        headerSummaryRow.setHeightInPoints(26);
        for (int i = 0; i < summaryHeaders.length; i++) {
            Cell c = headerSummaryRow.createCell(i);
            c.setCellValue(summaryHeaders[i]);
            c.setCellStyle(headerStyle);
        }

        BigDecimal totalRevenue = BigDecimal.ZERO;
        long totalOrdersCount = orders.size();
        long paidOrdersCount = 0;
        long pendingOrdersCount = 0;
        long codOrdersCount = 0;
        long onlineOrdersCount = 0;

        for (Order o : orders) {
            if (o.getStatus() != OrderStatus.CANCELLED) {
                totalRevenue = totalRevenue.add(o.getFinalAmount() != null ? o.getFinalAmount() : BigDecimal.ZERO);
            }
            if (o.getPaymentStatus() == PaymentStatus.SUCCESS || o.getPaymentStatus() == PaymentStatus.COLLECTED) {
                paidOrdersCount++;
            }
            if (o.getStatus() == OrderStatus.PENDING || o.getPaymentStatus() == PaymentStatus.PENDING) {
                pendingOrdersCount++;
            }
            if (o.getPaymentMethod() == PaymentMethod.COD) {
                codOrdersCount++;
            } else if (o.getPaymentMethod() == PaymentMethod.RAZORPAY) {
                onlineOrdersCount++;
            }
        }

        BigDecimal aov = (totalOrdersCount > 0)
                ? totalRevenue.divide(BigDecimal.valueOf(totalOrdersCount), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        Object[][] summaryData = {
            {"Total Revenue", totalRevenue, true},
            {"Total Orders", totalOrdersCount, false},
            {"Paid Orders", paidOrdersCount, false},
            {"Pending Orders", pendingOrdersCount, false},
            {"COD Orders", codOrdersCount, false},
            {"Online Orders", onlineOrdersCount, false},
            {"Average Order Value (AOV)", aov, true}
        };

        for (int i = 0; i < summaryData.length; i++) {
            Row r = sheetSummary.createRow(i + 1);
            boolean isZebra = ((i + 1) % 2 == 1);
            CellStyle base = isZebra ? zebraStyle : normalStyle;
            CellStyle curr = isZebra ? currencyZebraStyle : currencyStyle;

            String label = (String) summaryData[i][0];
            Object val = summaryData[i][1];
            boolean isCurrency = (Boolean) summaryData[i][2];

            createCell(r, 0, label, base);
            if (isCurrency) {
                createCurrencyCell(r, 1, (BigDecimal) val, curr);
            } else {
                createNumberCell(r, 1, ((Number) val).doubleValue(), base);
            }
        }

        // Auto-fit column widths across all sheets
        autoFitColumns(sheetOrders, orderHeaders.length);
        autoFitColumns(sheetItems, itemHeaders.length);
        autoFitColumns(sheetCustomers, customerHeaders.length);
        autoFitColumns(sheetSummary, summaryHeaders.length);
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
                if (width < 3400) {
                    sheet.setColumnWidth(i, 3400);
                } else if (width > 16000) {
                    sheet.setColumnWidth(i, 16000);
                }
            }
        } catch (Throwable t) {
            log.warn("[ExcelReportingService] autoSizeColumn unavailable, using defaults: {}", t.getMessage());
            for (int i = 0; i < numCols; i++) {
                sheet.setColumnWidth(i, 4800);
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
        status.put("lastModified", lastModified != null ? lastModified.format(LOG_FORMATTER) : "N/A");
        status.put("totalOrdersInMySQL", totalOrders);
        status.put("lastSyncAction", lastLog.map(OrderExcelSyncLog::getAction).orElse("NONE"));
        status.put("lastSyncStatus", lastLog.map(OrderExcelSyncLog::getStatus).orElse("NONE"));
        status.put("lastSyncedAt", lastLog.map(l -> l.getSyncedAt() != null ? l.getSyncedAt().format(LOG_FORMATTER) : "N/A").orElse("N/A"));
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

    private CellStyle createTotalStyle(XSSFWorkbook wb) {
        XSSFCellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 10);
        style.setFont(font);
        style.setFillForegroundColor(new XSSFColor(COLOR_TOTAL_BG, new DefaultIndexedColorMap()));
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        setBorders(style);
        return style;
    }

    private CellStyle createTotalCurrencyStyle(XSSFWorkbook wb, DataFormat df) {
        XSSFCellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 10);
        style.setFont(font);
        style.setDataFormat(df.getFormat("₹#,##0.00"));
        style.setFillForegroundColor(new XSSFColor(COLOR_TOTAL_BG, new DefaultIndexedColorMap()));
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
