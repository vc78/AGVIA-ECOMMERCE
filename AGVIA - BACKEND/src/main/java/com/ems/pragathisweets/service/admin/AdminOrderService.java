package com.ems.pragathisweets.service.admin;

import com.ems.pragathisweets.dto.OrderResponse;
import com.ems.pragathisweets.dto.admin.OrderStatusRequest;
import com.ems.pragathisweets.entity.Order;
import com.ems.pragathisweets.entity.OrderStatus;
import com.ems.pragathisweets.entity.PaymentMethod;
import com.ems.pragathisweets.entity.PaymentStatus;
import com.ems.pragathisweets.exception.ResourceNotFoundException;
import com.ems.pragathisweets.repository.OrderRepository;
import com.ems.pragathisweets.service.EmailService;
import com.ems.pragathisweets.service.OrderService;
import com.ems.pragathisweets.service.WhatsAppService;
import com.ems.pragathisweets.entity.NotificationType;
import com.ems.pragathisweets.event.AdminNotificationEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminOrderService {

    private final OrderRepository orderRepository;
    private final OrderService orderService;
    private final EmailService emailService;
    private final WhatsAppService whatsAppService;
    private final com.ems.pragathisweets.service.OrderNotificationService orderNotificationService;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional(readOnly = true)
    public Page<OrderResponse> getAll(Pageable pageable) {
        return orderRepository.findAll(pageable).map(orderService::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<OrderResponse> getByStatus(OrderStatus status, Pageable pageable) {
        return orderRepository.findByStatus(status, pageable).map(orderService::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<OrderResponse> searchOrders(
            String search,
            String paymentMethodStr,
            String paymentStatusStr,
            String orderStatusStr,
            String dateRange,
            String customStartDate,
            String customEndDate,
            Pageable pageable) {

        org.springframework.data.jpa.domain.Specification<Order> spec = (root, query, cb) -> {
            java.util.List<jakarta.persistence.criteria.Predicate> predicates = new java.util.ArrayList<>();

            // Search filter across Order ID / orderNumber, Customer name, Mobile, Email
            if (search != null && !search.trim().isEmpty()) {
                String term = "%" + search.trim().toLowerCase() + "%";
                jakarta.persistence.criteria.Join<Order, com.ems.pragathisweets.entity.User> userJoin =
                        root.join("user", jakarta.persistence.criteria.JoinType.LEFT);
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("orderNumber")), term),
                        cb.like(cb.lower(root.get("contactPhone")), term),
                        cb.like(cb.lower(userJoin.get("fullName")), term),
                        cb.like(cb.lower(userJoin.get("email")), term),
                        cb.like(cb.lower(userJoin.get("phone")), term)
                ));
            }

            // Payment method filter (COD, ONLINE / RAZORPAY)
            if (paymentMethodStr != null && !paymentMethodStr.equalsIgnoreCase("ALL") && !paymentMethodStr.trim().isEmpty()) {
                try {
                    String norm = paymentMethodStr.equalsIgnoreCase("ONLINE") ? "RAZORPAY" : paymentMethodStr.toUpperCase();
                    PaymentMethod pm = PaymentMethod.valueOf(norm);
                    predicates.add(cb.equal(root.get("paymentMethod"), pm));
                } catch (Exception ignored) {}
            }

            // Payment status filter (PENDING, PAID / SUCCESS, FAILED, REFUNDED)
            if (paymentStatusStr != null && !paymentStatusStr.equalsIgnoreCase("ALL") && !paymentStatusStr.trim().isEmpty()) {
                try {
                    String norm = paymentStatusStr.equalsIgnoreCase("PAID") ? "SUCCESS" : paymentStatusStr.toUpperCase();
                    PaymentStatus ps = PaymentStatus.valueOf(norm);
                    predicates.add(cb.equal(root.get("paymentStatus"), ps));
                } catch (Exception ignored) {}
            }

            // Order status filter (PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED)
            if (orderStatusStr != null && !orderStatusStr.equalsIgnoreCase("ALL") && !orderStatusStr.trim().isEmpty()) {
                try {
                    OrderStatus os = OrderStatus.valueOf(orderStatusStr.toUpperCase());
                    predicates.add(cb.equal(root.get("status"), os));
                } catch (Exception ignored) {}
            }

            // Date filtering
            java.time.LocalDate today = java.time.LocalDate.now();
            java.time.LocalDateTime startDateTime = null;
            java.time.LocalDateTime endDateTime = null;

            if (dateRange != null && !dateRange.trim().isEmpty() && !dateRange.equalsIgnoreCase("ALL")) {
                switch (dateRange.toLowerCase()) {
                    case "today":
                        startDateTime = today.atStartOfDay();
                        endDateTime = today.atTime(java.time.LocalTime.MAX);
                        break;
                    case "yesterday":
                        startDateTime = today.minusDays(1).atStartOfDay();
                        endDateTime = today.minusDays(1).atTime(java.time.LocalTime.MAX);
                        break;
                    case "last7days":
                    case "7days":
                    case "week":
                        startDateTime = today.minusDays(7).atStartOfDay();
                        endDateTime = today.atTime(java.time.LocalTime.MAX);
                        break;
                    case "last30days":
                    case "30days":
                    case "month":
                        startDateTime = today.minusDays(30).atStartOfDay();
                        endDateTime = today.atTime(java.time.LocalTime.MAX);
                        break;
                    case "custom":
                        if (customStartDate != null && !customStartDate.isBlank()) {
                            try { startDateTime = java.time.LocalDate.parse(customStartDate.trim()).atStartOfDay(); } catch (Exception ignored) {}
                        }
                        if (customEndDate != null && !customEndDate.isBlank()) {
                            try { endDateTime = java.time.LocalDate.parse(customEndDate.trim()).atTime(java.time.LocalTime.MAX); } catch (Exception ignored) {}
                        }
                        break;
                }
            } else if (customStartDate != null && !customStartDate.isBlank()) {
                try { startDateTime = java.time.LocalDate.parse(customStartDate.trim()).atStartOfDay(); } catch (Exception ignored) {}
                if (customEndDate != null && !customEndDate.isBlank()) {
                    try { endDateTime = java.time.LocalDate.parse(customEndDate.trim()).atTime(java.time.LocalTime.MAX); } catch (Exception ignored) {}
                }
            }

            if (startDateTime != null && endDateTime != null) {
                predicates.add(cb.between(root.get("createdAt"), startDateTime, endDateTime));
            } else if (startDateTime != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), startDateTime));
            } else if (endDateTime != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), endDateTime));
            }

            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };

        return orderRepository.findAll(spec, pageable).map(orderService::toResponse);
    }

    @Transactional(readOnly = true)
    public OrderResponse getById(Long id) {
        Order order = findEntity(id);
        return orderService.toResponse(order);
    }

    @Transactional(readOnly = true)
    public java.util.List<com.ems.pragathisweets.entity.OrderNotificationLog> getOrderNotifications(Long id) {
        return orderNotificationService.getNotificationHistory(id);
    }

    @Transactional
    public OrderResponse updateStatus(Long id, OrderStatusRequest request) {
        Order order = findEntity(id);

        OrderStatus newStatus;
        try {
            newStatus = OrderStatus.valueOf(request.getStatus().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Invalid order status: " + request.getStatus());
        }

        order.setStatus(newStatus);

        // ── COD Auto-Settlement ──────────────────────────────────────────────
        // When an admin marks a COD order as DELIVERED, cash has been collected
        // at the doorstep. Automatically update paymentStatus to COLLECTED so
        // the customer's order history reflects real payment state.
        if (newStatus == OrderStatus.DELIVERED
                && order.getPaymentMethod() == PaymentMethod.COD
                && order.getPaymentStatus() == PaymentStatus.PENDING) {
            order.setPaymentStatus(PaymentStatus.COLLECTED);
            emailService.sendCodPaymentCollectedEmail(
                    order.getUser().getEmail(),
                    order.getOrderNumber(),
                    order.getFinalAmount().toString());
        }

        Order saved = orderRepository.save(order);
        OrderResponse orderResponse = orderService.toResponse(saved);

        String phone = order.getContactPhone() != null ? order.getContactPhone() : order.getUser().getPhone();
        String customerEmail = order.getUser() != null ? order.getUser().getEmail() : null;
        String customerName = order.getUser() != null ? order.getUser().getFullName() : "Valued Customer";

        // Dispatch authoritative status change notification to customer (idempotent, rich branded HTML)
        orderNotificationService.sendOrderStatusNotification(
                orderResponse, newStatus.name(), customerEmail, customerName, phone, null);

        // Publish real-time event to Admin dashboard
        eventPublisher.publishEvent(new AdminNotificationEvent(
                newStatus == OrderStatus.CANCELLED ? NotificationType.ORDER_CANCELLED : NotificationType.ORDER_STATUS_CHANGED,
                newStatus == OrderStatus.CANCELLED ? "Order Cancelled #" + saved.getOrderNumber() : "Order Status: " + newStatus.name(),
                "Order #" + saved.getOrderNumber() + " status updated to " + newStatus.name(),
                String.valueOf(saved.getId()),
                "ORDER",
                Map.of(
                        "orderId", saved.getId(),
                        "orderNumber", saved.getOrderNumber(),
                        "status", newStatus.name(),
                        "amount", saved.getFinalAmount()
                )
        ));

        // Trigger non-blocking Excel Reporting layer synchronization
        eventPublisher.publishEvent(new com.ems.pragathisweets.event.OrderConfirmedEvent(saved.getId(), saved.getOrderNumber(), "ADMIN_UPDATE_" + newStatus.name()));

        return orderResponse;
    }

    private Order findEntity(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + id));
    }
}
