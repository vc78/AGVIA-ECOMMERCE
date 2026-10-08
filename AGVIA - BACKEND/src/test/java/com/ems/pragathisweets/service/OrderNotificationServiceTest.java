package com.ems.pragathisweets.service;

import com.ems.pragathisweets.dto.OrderEmailData;
import com.ems.pragathisweets.dto.OrderItemResponse;
import com.ems.pragathisweets.dto.OrderResponse;
import com.ems.pragathisweets.entity.OrderNotificationLog;
import com.ems.pragathisweets.repository.OrderNotificationLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderNotificationServiceTest {

    @Mock
    private EmailService emailService;

    @Mock
    private EmailTemplateService templateService;

    @Mock
    private OrderNotificationLogRepository notificationLogRepository;

    @InjectMocks
    private OrderNotificationService notificationService;

    private OrderResponse sampleOrder;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(notificationService, "adminEmail", "orders@pragathisweets.com");
        ReflectionTestUtils.setField(notificationService, "supportEmail", "support@pragathisweets.com");
        ReflectionTestUtils.setField(notificationService, "frontendUrl", "http://localhost:5173");

        OrderItemResponse item = OrderItemResponse.builder()
                .productId(101L)
                .productName("Kaju Katli")
                .quantity(2)
                .price(BigDecimal.valueOf(450))
                .subtotal(BigDecimal.valueOf(900))
                .build();

        sampleOrder = OrderResponse.builder()
                .id(1L)
                .orderNumber("PS20260923001")
                .userId(10L)
                .userName("Venkat Rao")
                .userEmail("customer@example.com")
                .items(List.of(item))
                .totalAmount(BigDecimal.valueOf(900))
                .discountAmount(BigDecimal.valueOf(50))
                .finalAmount(BigDecimal.valueOf(850))
                .couponCode("FESTIVE50")
                .status("CONFIRMED")
                .paymentMethod("COD")
                .paymentStatus("PENDING")
                .shippingAddress("123 Jubilee Hills, Hyderabad - 500033")
                .contactPhone("9849012345")
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("Should successfully send customer and admin order confirmation emails")
    void testSendOrderConfirmation_Success() throws Exception {
        EmailTemplateService.EmailContent customerContent = new EmailTemplateService.EmailContent(
                "Order Confirmed #PS20260923001", "<html>Customer HTML</html>", "Customer Text");
        EmailTemplateService.EmailContent adminContent = new EmailTemplateService.EmailContent(
                "New Order Alert #PS20260923001", "<html>Admin HTML</html>", "Admin Text");

        when(templateService.buildCustomerOrderConfirmation(any())).thenReturn(customerContent);
        when(templateService.buildAdminNewOrderNotification(any())).thenReturn(adminContent);
        when(notificationLogRepository.existsByOrderIdAndEventTypeAndRecipientAndStatus(anyLong(), anyString(), anyString(), eq("SENT")))
                .thenReturn(false);
        when(notificationLogRepository.findFirstByOrderIdAndEventTypeAndRecipient(anyLong(), anyString(), anyString()))
                .thenReturn(Optional.empty());

        notificationService.sendOrderConfirmedNotifications(sampleOrder, "customer@example.com", "Venkat Rao", "9849012345");

        // Verify customer and admin emails were dispatched
        verify(emailService, times(1)).sendMimeMessage(eq("customer@example.com"), eq(customerContent.subject()), eq(customerContent.htmlBody()), eq(customerContent.plainText()));
        verify(emailService, times(1)).sendMimeMessage(eq("orders@pragathisweets.com"), eq(adminContent.subject()), eq(adminContent.htmlBody()), eq(adminContent.plainText()));

        // Verify notification logs saved with status SENT
        ArgumentCaptor<OrderNotificationLog> logCaptor = ArgumentCaptor.forClass(OrderNotificationLog.class);
        verify(notificationLogRepository, atLeast(2)).save(logCaptor.capture());

        List<OrderNotificationLog> savedLogs = logCaptor.getAllValues();
        assertTrue(savedLogs.stream().anyMatch(l -> "SENT".equals(l.getStatus()) && "customer@example.com".equals(l.getRecipient())));
        assertTrue(savedLogs.stream().anyMatch(l -> "SENT".equals(l.getStatus()) && "orders@pragathisweets.com".equals(l.getRecipient())));
    }

    @Test
    @DisplayName("Should enforce idempotency and skip duplicate emails for the same order and event")
    void testDeduplicationProtection() throws Exception {
        EmailTemplateService.EmailContent customerContent = new EmailTemplateService.EmailContent(
                "Order Confirmed", "<html>HTML</html>", "Text");

        // Already SENT
        when(notificationLogRepository.existsByOrderIdAndEventTypeAndRecipientAndStatus(
                1L, "ORDER_CONFIRMED_CUSTOMER", "customer@example.com", "SENT")).thenReturn(true);

        boolean dispatched = notificationService.dispatchEmail(
                1L, "PS20260923001", "ORDER_CONFIRMED_CUSTOMER", "customer@example.com", "CUSTOMER", customerContent);

        assertTrue(dispatched);
        // Verify emailService was NOT called since it is a duplicate
        verify(emailService, never()).sendMimeMessage(anyString(), anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("Should isolate email failures so order remains unaffected and log is marked as FAILED")
    void testFailureIsolation() throws Exception {
        EmailTemplateService.EmailContent customerContent = new EmailTemplateService.EmailContent(
                "Order Confirmed", "<html>HTML</html>", "Text");

        when(notificationLogRepository.existsByOrderIdAndEventTypeAndRecipientAndStatus(anyLong(), anyString(), anyString(), eq("SENT")))
                .thenReturn(false);
        when(notificationLogRepository.findFirstByOrderIdAndEventTypeAndRecipient(anyLong(), anyString(), anyString()))
                .thenReturn(Optional.empty());

        doThrow(new RuntimeException("SMTP connection timed out"))
                .when(emailService).sendMimeMessage(anyString(), anyString(), anyString(), anyString());

        // Call should not throw
        boolean result = notificationService.dispatchEmail(
                1L, "PS20260923001", "ORDER_CONFIRMED_CUSTOMER", "customer@example.com", "CUSTOMER", customerContent);

        assertFalse(result);

        ArgumentCaptor<OrderNotificationLog> logCaptor = ArgumentCaptor.forClass(OrderNotificationLog.class);
        verify(notificationLogRepository, atLeastOnce()).save(logCaptor.capture());

        List<OrderNotificationLog> captured = logCaptor.getAllValues();
        OrderNotificationLog finalLog = captured.get(captured.size() - 1);
        assertEquals("FAILED", finalLog.getStatus());
        assertTrue(finalLog.getErrorMessage().contains("SMTP connection timed out"));
    }

    @Test
    @DisplayName("Should build valid order status templates and dispatch status transition email")
    void testSendOrderStatusNotification() throws Exception {
        EmailTemplateService.EmailContent preparingContent = new EmailTemplateService.EmailContent(
                "Preparing", "<html>Preparing</html>", "Preparing");
        when(templateService.buildOrderPreparingNotification(any())).thenReturn(preparingContent);
        when(notificationLogRepository.existsByOrderIdAndEventTypeAndRecipientAndStatus(anyLong(), anyString(), anyString(), eq("SENT")))
                .thenReturn(false);
        when(notificationLogRepository.findFirstByOrderIdAndEventTypeAndRecipient(anyLong(), anyString(), anyString()))
                .thenReturn(Optional.empty());

        notificationService.sendOrderStatusNotification(sampleOrder, "PREPARING", "customer@example.com", "Venkat Rao", "9849012345", null);

        verify(emailService, times(1)).sendMimeMessage(eq("customer@example.com"), eq("Preparing"), anyString(), anyString());
    }

    @Test
    @DisplayName("EmailTemplateService should escape HTML and prevent injection attacks")
    void testEmailTemplateService_XssSanitization() {
        EmailTemplateService realTemplateService = new EmailTemplateService();

        OrderEmailData dangerousData = OrderEmailData.builder()
                .orderNumber("PS1001")
                .customerName("<script>alert('xss')</script>John Doe")
                .deliveryAddress("123 Street <img src=x onerror=alert(1)>")
                .notes("<style>body{display:none}</style>")
                .subtotal(BigDecimal.valueOf(500))
                .grandTotal(BigDecimal.valueOf(500))
                .items(Collections.emptyList())
                .build();

        EmailTemplateService.EmailContent content = realTemplateService.buildCustomerOrderConfirmation(dangerousData);

        assertFalse(content.htmlBody().contains("<script>"));
        assertTrue(content.htmlBody().contains("&lt;script&gt;"));
        assertFalse(content.htmlBody().contains("<img src=x onerror=alert(1)>"));
        assertTrue(content.htmlBody().contains("&lt;img src=x onerror=alert(1)&gt;"));
    }
}
