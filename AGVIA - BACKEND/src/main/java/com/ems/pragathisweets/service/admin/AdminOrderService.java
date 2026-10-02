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

        return orderResponse;
    }

    private Order findEntity(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + id));
    }
}
