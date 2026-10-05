package com.ems.pragathisweets.service;

import com.ems.pragathisweets.entity.*;
import com.ems.pragathisweets.repository.OrderExcelSyncLogRepository;
import com.ems.pragathisweets.repository.OrderRepository;
import com.ems.pragathisweets.repository.PaymentRepository;
import com.ems.pragathisweets.service.admin.ExcelReportingService;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.File;
import java.io.FileInputStream;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ExcelReportingServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private OrderExcelSyncLogRepository syncLogRepository;

    @InjectMocks
    private ExcelReportingService excelReportingService;

    private final String testDir = "./target/test-reports";
    private final String testFileName = "TEST_AGVIA_ORDERS.xlsx";

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(excelReportingService, "excelOutputDir", testDir);
        ReflectionTestUtils.setField(excelReportingService, "excelFileName", testFileName);
    }

    @AfterEach
    void tearDown() throws Exception {
        Path path = Paths.get(testDir, testFileName);
        Files.deleteIfExists(path);
    }

    @Test
    void testRegenerateExcelReportCreatesValidWorkbook() throws Exception {
        User user = User.builder()
                .id(1L)
                .fullName("Lakshmi Devi")
                .email("lakshmi@example.com")
                .phone("+91 98765 43210")
                .build();

        Product product = Product.builder()
                .id(10L)
                .name("Kanchipuram Silk Saree")
                .sku("AGV-SILK-001")
                .price(BigDecimal.valueOf(15000))
                .stockQuantity(5)
                .build();

        Order order = Order.builder()
                .id(100L)
                .orderNumber("AGV-2026-0001")
                .user(user)
                .totalAmount(BigDecimal.valueOf(15000))
                .discountAmount(BigDecimal.valueOf(1500))
                .finalAmount(BigDecimal.valueOf(13500))
                .couponCode("ATELIER10")
                .paymentMethod(PaymentMethod.RAZORPAY)
                .paymentStatus(PaymentStatus.SUCCESS)
                .status(OrderStatus.CONFIRMED)
                .shippingAddress("123 Jubilee Hills, Hyderabad")
                .contactPhone("+91 98765 43210")
                .notes("Handle with care")
                .createdAt(LocalDateTime.now())
                .items(new ArrayList<>())
                .build();

        OrderItem item = OrderItem.builder()
                .id(50L)
                .order(order)
                .product(product)
                .productName(product.getName())
                .quantity(1)
                .price(BigDecimal.valueOf(15000))
                .subtotal(BigDecimal.valueOf(15000))
                .build();
        order.getItems().add(item);

        Payment payment = Payment.builder()
                .id(200L)
                .order(order)
                .razorpayOrderId("order_test_123")
                .razorpayPaymentId("pay_test_456")
                .amount(BigDecimal.valueOf(13500))
                .currency("INR")
                .status(PaymentStatus.SUCCESS)
                .createdAt(LocalDateTime.now())
                .build();

        when(orderRepository.findAllWithDetails()).thenReturn(List.of(order));
        when(paymentRepository.findAll()).thenReturn(List.of(payment));

        // Execute regeneration
        excelReportingService.regenerateExcelReport();

        Path generatedFile = Paths.get(testDir, testFileName);
        assertTrue(Files.exists(generatedFile), "AGVIA_ORDERS.xlsx file should be created on disk");
        assertTrue(Files.size(generatedFile) > 0, "Generated Excel file should not be empty");

        // Validate Excel structure with POI
        try (FileInputStream fis = new FileInputStream(generatedFile.toFile());
             Workbook workbook = new XSSFWorkbook(fis)) {

            assertNotNull(workbook.getSheet("Orders Master"), "Sheet 'Orders Master' must exist");
            assertNotNull(workbook.getSheet("Order Line Items"), "Sheet 'Order Line Items' must exist");
            assertNotNull(workbook.getSheet("Payments Ledger"), "Sheet 'Payments Ledger' must exist");

            var ordersSheet = workbook.getSheet("Orders Master");
            assertEquals("AGV-2026-0001", ordersSheet.getRow(2).getCell(0).getStringCellValue());
            assertEquals("Lakshmi Devi", ordersSheet.getRow(2).getCell(2).getStringCellValue());
            assertEquals(13500.0, ordersSheet.getRow(2).getCell(8).getNumericCellValue(), 0.01);
        }
    }
}
