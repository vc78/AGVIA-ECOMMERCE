package com.ems.pragathisweets.service;

import com.ems.pragathisweets.dto.OrderEmailData;
import com.ems.pragathisweets.dto.OrderItemResponse;
import com.ems.pragathisweets.dto.OrderResponse;
import com.ems.pragathisweets.entity.OrderNotificationLog;
import com.ems.pragathisweets.repository.OrderNotificationLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/**
 * Authoritative production order notification service.
 * Handles deduplication, idempotent dispatch, failure isolation, and customer/admin alerts.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OrderNotificationService {

    private final EmailService emailService;
    private final EmailTemplateService templateService;
    private final OrderNotificationLogRepository notificationLogRepository;

    @Value("${app.mail.admin-email:${PRAGATHI_ADMIN_EMAIL:${app.mail.store-notification-email:${STORE_NOTIFICATION_EMAIL:orders@pragathisweets.com}}}}")
    private String adminEmail;

    @Value("${app.mail.support-email:${PRAGATHI_SUPPORT_EMAIL:support@pragathisweets.com}}")
    private String supportEmail;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd-MMM-yyyy hh:mm a");

    // ─────────────────────────────────────────────────────────────────────────
    // Public Notification Triggers
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Dispatches authoritative order confirmation to the customer and store alert to the admin.
     * Guaranteed to execute asynchronously and never throw to the calling transaction.
     */
    @Async
    public void sendOrderConfirmedNotifications(OrderResponse order, String customerEmail, String customerName, String phone) {
        if (order == null) {
            log.warn("[OrderNotification] Null order provided – skipping confirmation dispatch");
            return;
        }

        log.info("[ORDER_CONFIRMATION_EMAIL_REQUESTED] orderId={}, orderNumber={}, recipient={}",
                order.getId(), order.getOrderNumber(), customerEmail);

        OrderEmailData emailData = buildEmailData(order, customerEmail, customerName);

        // 1. Customer Order Confirmation Email
        if (customerEmail != null && !customerEmail.isBlank()) {
            EmailTemplateService.EmailContent customerContent = templateService.buildCustomerOrderConfirmation(emailData);
            dispatchEmail(order.getId(), order.getOrderNumber(), "ORDER_CONFIRMED_CUSTOMER", customerEmail, "CUSTOMER", customerContent);
        } else {
            log.warn("[OrderNotification] Missing customer email for order {} – customer confirmation skipped", order.getOrderNumber());
        }

        // 2. Admin New Order Alert Email
        if (adminEmail != null && !adminEmail.isBlank() && !adminEmail.equalsIgnoreCase(customerEmail)) {
            EmailTemplateService.EmailContent adminContent = templateService.buildAdminNewOrderNotification(emailData);
            dispatchEmail(order.getId(), order.getOrderNumber(), "ADMIN_NEW_ORDER", adminEmail, "ADMIN", adminContent);
        }
    }

    /**
     * Dispatches customer notifications for order status lifecycle transitions.
     */
    @Async
    public void sendOrderStatusNotification(OrderResponse order, String newStatus, String customerEmail, String customerName, String phone, String notes) {
        if (order == null || customerEmail == null || customerEmail.isBlank()) {
            log.warn("[OrderNotification] Missing order or customer email for status update {} – skipping", newStatus);
            return;
        }

        OrderEmailData emailData = buildEmailData(order, customerEmail, customerName);
        if (notes != null && !notes.isBlank()) {
            emailData.setNotes(notes);
        }

        String eventType = "ORDER_" + newStatus.toUpperCase();
        EmailTemplateService.EmailContent content = null;

        switch (newStatus.toUpperCase()) {
            case "PREPARING" -> content = templateService.buildOrderPreparingNotification(emailData);
            case "READY" -> content = templateService.buildOrderReadyNotification(emailData);
            case "OUT_FOR_DELIVERY" -> content = templateService.buildOutForDeliveryNotification(emailData);
            case "DELIVERED" -> content = templateService.buildOrderDeliveredNotification(emailData);
            case "CANCELLED" -> content = templateService.buildOrderCancelledNotification(emailData, notes);
            case "REFUNDED" -> content = templateService.buildRefundProcessedNotification(emailData);
            default -> {
                log.info("[OrderNotification] Status transition to {} does not require a specialized customer email", newStatus);
            }
        }

        if (content != null) {
            dispatchEmail(order.getId(), order.getOrderNumber(), eventType, customerEmail, "CUSTOMER", content);
        }
    }

    /**
     * Dispatches standalone payment verification confirmation if needed.
     */
    @Async
    public void sendPaymentConfirmedNotification(OrderResponse order, String customerEmail, String customerName) {
        if (order == null || customerEmail == null || customerEmail.isBlank()) return;

        OrderEmailData emailData = buildEmailData(order, customerEmail, customerName);
        EmailTemplateService.EmailContent content = templateService.buildPaymentConfirmation(emailData);
        dispatchEmail(order.getId(), order.getOrderNumber(), "PAYMENT_CONFIRMED", customerEmail, "CUSTOMER", content);
    }

    /**
     * Dispatches standalone refund processed notification.
     */
    @Async
    public void sendRefundNotification(OrderResponse order, String customerEmail, String customerName) {
        if (order == null || customerEmail == null || customerEmail.isBlank()) return;

        OrderEmailData emailData = buildEmailData(order, customerEmail, customerName);
        EmailTemplateService.EmailContent content = templateService.buildRefundProcessedNotification(emailData);
        dispatchEmail(order.getId(), order.getOrderNumber(), "REFUND_COMPLETED", customerEmail, "CUSTOMER", content);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Idempotent Core Dispatch
    // ─────────────────────────────────────────────────────────────────────────

    public boolean dispatchEmail(Long orderId, String orderNumber, String eventType, String recipient, String recipientType, EmailTemplateService.EmailContent content) {
        // 1. Deduplication Check
        boolean alreadySent = notificationLogRepository.existsByOrderIdAndEventTypeAndRecipientAndStatus(
                orderId, eventType, recipient, "SENT");

        if (alreadySent) {
            log.info("[ORDER_NOTIFICATION_DUPLICATE_SKIPPED] orderId={}, eventType={}, recipient={}. Email already dispatched.",
                    orderId, eventType, recipient);
            return true;
        }

        // 2. Fetch or create notification log entry
        OrderNotificationLog logEntry = notificationLogRepository
                .findFirstByOrderIdAndEventTypeAndRecipient(orderId, eventType, recipient)
                .orElseGet(() -> OrderNotificationLog.builder()
                        .orderId(orderId)
                        .orderNumber(orderNumber)
                        .eventType(eventType)
                        .recipient(recipient)
                        .recipientType(recipientType)
                        .channel("EMAIL")
                        .status("PENDING")
                        .attemptCount(0)
                        .build());

        logEntry.setAttemptCount(logEntry.getAttemptCount() + 1);
        notificationLogRepository.save(logEntry);

        // 3. Attempt transmission
        try {
            emailService.sendMimeMessage(recipient, content.subject(), content.htmlBody(), content.plainText());

            logEntry.setStatus("SENT");
            logEntry.setSentAt(LocalDateTime.now());
            logEntry.setErrorMessage(null);
            notificationLogRepository.save(logEntry);

            log.info("[ORDER_NOTIFICATION_SENT] orderId={}, eventType={}, recipient={}", orderId, eventType, recipient);
            return true;

        } catch (Exception ex) {
            String errorMsg = ex.getMessage() != null ? ex.getMessage() : ex.getClass().getSimpleName();
            if (errorMsg.length() > 950) {
                errorMsg = errorMsg.substring(0, 950);
            }

            logEntry.setStatus("FAILED");
            logEntry.setErrorMessage(errorMsg);
            notificationLogRepository.save(logEntry);

            log.error("[ORDER_NOTIFICATION_FAILED] orderId={}, eventType={}, recipient={}, error={}",
                    orderId, eventType, recipient, errorMsg);
            return false;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Query / Inspection Helpers
    // ─────────────────────────────────────────────────────────────────────────

    public List<OrderNotificationLog> getNotificationHistory(Long orderId) {
        return notificationLogRepository.findByOrderIdOrderByCreatedAtDesc(orderId);
    }

    public String getLatestNotificationStatus(Long orderId) {
        List<OrderNotificationLog> logs = notificationLogRepository.findByOrderIdOrderByCreatedAtDesc(orderId);
        if (logs.isEmpty()) {
            return "NOT_DISPATCHED";
        }
        for (OrderNotificationLog l : logs) {
            if ("SENT".equals(l.getStatus())) {
                return "SENT";
            }
        }
        return logs.get(0).getStatus();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Data Mapper
    // ─────────────────────────────────────────────────────────────────────────

    public OrderEmailData buildEmailData(OrderResponse order, String customerEmail, String customerName) {
        List<OrderEmailData.ItemData> items = new ArrayList<>();
        if (order.getItems() != null) {
            for (OrderItemResponse item : order.getItems()) {
                items.add(OrderEmailData.ItemData.builder()
                        .productName(item.getProductName())
                        .quantity(item.getQuantity())
                        .unitPrice(item.getPrice())
                        .total(item.getSubtotal())
                        .build());
            }
        }

        BigDecimal subtotal = order.getTotalAmount() != null ? order.getTotalAmount() : BigDecimal.ZERO;
        BigDecimal discount = order.getDiscountAmount() != null ? order.getDiscountAmount() : BigDecimal.ZERO;
        BigDecimal grandTotal = order.getFinalAmount() != null ? order.getFinalAmount() : BigDecimal.ZERO;

        BigDecimal deliveryFee = grandTotal.subtract(subtotal).add(discount);
        if (deliveryFee.compareTo(BigDecimal.ZERO) < 0) {
            deliveryFee = BigDecimal.ZERO;
        }

        String orderDate = order.getCreatedAt() != null
                ? order.getCreatedAt().format(DATE_FMT)
                : LocalDateTime.now().format(DATE_FMT);

        String name = (customerName != null && !customerName.isBlank())
                ? customerName
                : (order.getUserName() != null ? order.getUserName() : "Valued Customer");

        String tracking = frontendUrl + "/track-order?orderId=" + order.getOrderNumber();

        return OrderEmailData.builder()
                .orderId(order.getId())
                .orderNumber(order.getOrderNumber())
                .customerName(name)
                .customerEmail(customerEmail)
                .customerPhone(order.getContactPhone())
                .orderDate(orderDate)
                .orderStatus(order.getStatus())
                .statusDescription("Status: " + order.getStatus())
                .items(items)
                .subtotal(subtotal)
                .discount(discount)
                .deliveryCharge(deliveryFee)
                .tax(BigDecimal.ZERO)
                .grandTotal(grandTotal)
                .paymentMethod(order.getPaymentMethod())
                .paymentStatus(order.getPaymentStatus())
                .deliveryAddress(order.getShippingAddress())
                .deliveryMethod("Handcrafted Express Delivery (2–4 Business Days)")
                .expectedDelivery("2–4 Business Days")
                .trackingUrl(tracking)
                .notes(order.getNotes())
                .supportEmail(supportEmail)
                .supportPhone("+91 90323 06961")
                .build();
    }
}
