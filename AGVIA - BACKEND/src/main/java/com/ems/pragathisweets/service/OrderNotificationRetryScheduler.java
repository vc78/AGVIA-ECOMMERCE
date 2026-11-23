package com.ems.pragathisweets.service;

import com.ems.pragathisweets.dto.OrderResponse;
import com.ems.pragathisweets.entity.Order;
import com.ems.pragathisweets.entity.OrderNotificationLog;
import com.ems.pragathisweets.repository.OrderNotificationLogRepository;
import com.ems.pragathisweets.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Background retry engine for transient order email dispatch failures.
 * Employs bounded retries (max 3 attempts) to prevent spamming and resource exhaustion.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class OrderNotificationRetryScheduler {

    private final OrderNotificationLogRepository notificationLogRepository;
    private final OrderRepository orderRepository;
    private final OrderService orderService;
    private final OrderNotificationService orderNotificationService;

    @Value("${app.mail.retry.max-attempts:3}")
    private int maxAttempts;

    @Value("${app.mail.retry.enabled:true}")
    private boolean retryEnabled;

    /**
     * Executes every 5 minutes with a 1-minute initial delay.
     * Note: Non-overlapping fixedDelay execution. Intentionally non-transactional at method level
     * to avoid holding a database connection across external email network calls or batch iterations.
     */
    @Scheduled(initialDelay = 60000, fixedDelayString = "${app.mail.retry.fixed-delay-ms:300000}")
    public void retryFailedNotifications() {
        if (!retryEnabled) {
            return;
        }

        List<OrderNotificationLog> failedLogs;
        try {
            failedLogs = notificationLogRepository.findByStatusAndAttemptCountLessThan("FAILED", maxAttempts);
        } catch (Exception ex) {
            log.error("[OrderNotificationRetry] Failed to query notification logs: {}", ex.getMessage());
            return;
        }

        if (failedLogs.isEmpty()) {
            return;
        }

        log.info("[OrderNotificationRetry] Found {} failed notification(s) eligible for bounded retry", failedLogs.size());

        for (OrderNotificationLog logEntry : failedLogs) {
            try {
                // Minimum backoff: skip entries that failed less than 2 minutes ago
                if (logEntry.getUpdatedAt() != null && logEntry.getUpdatedAt().isAfter(java.time.LocalDateTime.now().minusMinutes(2))) {
                    log.debug("[OrderNotificationRetry] Skipping log id {} – cooldown in effect (last attempted at {})",
                            logEntry.getId(), logEntry.getUpdatedAt());
                    continue;
                }

                Order order = orderRepository.findById(logEntry.getOrderId()).orElse(null);
                if (order == null) {
                    log.warn("[OrderNotificationRetry] Order {} no longer exists – abandoning retry for log id {}",
                            logEntry.getOrderId(), logEntry.getId());
                    logEntry.setStatus("ABANDONED");
                    notificationLogRepository.save(logEntry);
                    continue;
                }

                OrderResponse orderResponse = orderService.toResponse(order);
                String customerName = order.getUser() != null ? order.getUser().getFullName() : "Valued Customer";
                String customerEmail = order.getUser() != null ? order.getUser().getEmail() : null;
                String phone = (order.getContactPhone() != null && !order.getContactPhone().isBlank())
                        ? order.getContactPhone()
                        : (order.getUser() != null ? order.getUser().getPhone() : null);

                log.info("[OrderNotificationRetry] Retrying dispatch for order {}, event {}, attempt {}/{}",
                        order.getOrderNumber(), logEntry.getEventType(), logEntry.getAttemptCount() + 1, maxAttempts);

                if ("ORDER_CONFIRMED_CUSTOMER".equals(logEntry.getEventType()) || "ADMIN_NEW_ORDER".equals(logEntry.getEventType())) {
                    orderNotificationService.sendOrderConfirmedNotifications(orderResponse, customerEmail, customerName, phone);
                } else if (logEntry.getEventType().startsWith("ORDER_")) {
                    String status = logEntry.getEventType().substring("ORDER_".length());
                    orderNotificationService.sendOrderStatusNotification(orderResponse, status, customerEmail, customerName, phone, order.getNotes());
                }

            } catch (Exception ex) {
                log.error("[OrderNotificationRetry] Error retrying notification log id {}: {}", logEntry.getId(), ex.getMessage());
            }
        }
    }
}
