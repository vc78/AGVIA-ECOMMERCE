package com.ems.pragathisweets.service;

import com.ems.pragathisweets.config.RazorpayConfig;
import com.ems.pragathisweets.dto.PaymentOrderResponse;
import com.ems.pragathisweets.dto.PaymentVerificationRequest;
import com.ems.pragathisweets.entity.Order;
import com.ems.pragathisweets.entity.Payment;
import com.ems.pragathisweets.entity.PaymentStatus;
import com.ems.pragathisweets.exception.PaymentVerificationException;
import com.ems.pragathisweets.exception.ResourceNotFoundException;
import com.ems.pragathisweets.repository.OrderRepository;
import com.ems.pragathisweets.repository.PaymentRepository;
import com.razorpay.RazorpayClient;
import com.razorpay.Utils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.ems.pragathisweets.entity.NotificationType;
import com.ems.pragathisweets.event.AdminNotificationEvent;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final RazorpayClient razorpayClient;
    private final RazorpayConfig razorpayConfig;
    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final EmailService emailService;
    private final WhatsAppService whatsAppService;
    private final OrderService orderService;
    private final OrderNotificationService orderNotificationService;
    private final ApplicationEventPublisher eventPublisher;

    private Order findOrderByIdOrNumber(String orderIdentifier) {
        if (orderIdentifier == null || orderIdentifier.isBlank()) {
            throw new ResourceNotFoundException("Order identifier is required");
        }
        return orderRepository.findByOrderNumber(orderIdentifier)
                .or(() -> {
                    try {
                        Long id = Long.parseLong(orderIdentifier);
                        return orderRepository.findById(id);
                    } catch (NumberFormatException e) {
                        return Optional.empty();
                    }
                })
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderIdentifier));
    }

    /**
     * Creates a Razorpay order for the given internal order and persists a Payment record.
     */
    @Transactional
    public PaymentOrderResponse createRazorpayOrder(String internalOrderNumber) {
        Order order = findOrderByIdOrNumber(internalOrderNumber);

        long amountInPaise = order.getFinalAmount().multiply(BigDecimal.valueOf(100)).longValue();

        try {
            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", amountInPaise);
            orderRequest.put("currency", "INR");
            orderRequest.put("receipt", order.getOrderNumber());

            com.razorpay.Order razorpayOrder = razorpayClient.orders.create(orderRequest);
            String razorpayOrderId = razorpayOrder.get("id");

            Payment payment = paymentRepository.findByOrderId(order.getId()).orElse(
                    Payment.builder().order(order).build()
            );
            payment.setRazorpayOrderId(razorpayOrderId);
            payment.setAmount(order.getFinalAmount());
            payment.setCurrency("INR");
            payment.setStatus(PaymentStatus.CREATED);
            paymentRepository.save(payment);

            return PaymentOrderResponse.builder()
                    .razorpayOrderId(razorpayOrderId)
                    .razorpayKeyId(razorpayConfig.getKeyId())
                    .amountInPaise(amountInPaise)
                    .currency("INR")
                    .internalOrderId(order.getId())
                    .orderNumber(order.getOrderNumber())
                    .build();

        } catch (Exception ex) {
            log.error("Failed to create Razorpay order for {}: {}", internalOrderNumber, ex.getMessage());
            throw new PaymentVerificationException("Unable to initiate payment. Please try again.");
        }
    }

    /**
     * Verifies the Razorpay payment signature and marks the order/payment as paid.
     */
    @Transactional
    public void verifyPayment(PaymentVerificationRequest request) {
        Order order = findOrderByIdOrNumber(request.getInternalOrderNumber());

        Payment payment = paymentRepository.findByOrderId(order.getId())
                .orElseThrow(() -> new ResourceNotFoundException("No payment record found for this order"));

        // Idempotency guard: If payment is already marked SUCCESS, return safely without duplicate side effects
        if (payment.getStatus() == PaymentStatus.SUCCESS && order.getPaymentStatus() == PaymentStatus.SUCCESS) {
            log.info("[PaymentService] Idempotent payment verification ignored for order: {}", order.getOrderNumber());
            return;
        }

        Map<String, String> attributes = new HashMap<>();
        attributes.put("razorpay_order_id", request.getRazorpayOrderId());
        attributes.put("razorpay_payment_id", request.getRazorpayPaymentId());
        attributes.put("razorpay_signature", request.getRazorpaySignature());

        try {
            boolean isValid = Utils.verifyPaymentSignature(new JSONObject(attributes), razorpayConfig.getKeySecret());
            if (!isValid) {
                payment.setStatus(PaymentStatus.FAILED);
                payment.setFailureReason("Signature verification failed");
                paymentRepository.save(payment);
                throw new PaymentVerificationException("Payment verification failed. Please contact support.");
            }
        } catch (PaymentVerificationException pve) {
            throw pve;
        } catch (Exception ex) {
            log.error("Error verifying payment signature: {}", ex.getMessage());
            throw new PaymentVerificationException("Payment verification failed. Please contact support.");
        }

        payment.setRazorpayPaymentId(request.getRazorpayPaymentId());
        payment.setRazorpaySignature(request.getRazorpaySignature());
        payment.setStatus(PaymentStatus.SUCCESS);
        paymentRepository.save(payment);

        order.setPaymentStatus(PaymentStatus.SUCCESS);
        order.setStatus(com.ems.pragathisweets.entity.OrderStatus.CONFIRMED);
        orderRepository.save(order);

        String customerEmail = order.getUser() != null ? order.getUser().getEmail() : null;
        String customerName = order.getUser() != null ? order.getUser().getFullName() : "Valued Customer";
        String phone = (order.getContactPhone() != null && !order.getContactPhone().isBlank())
                ? order.getContactPhone()
                : (order.getUser() != null ? order.getUser().getPhone() : null);
        com.ems.pragathisweets.dto.OrderResponse orderResponse = orderService.toResponse(order);

        // Dispatch authoritative order confirmation to customer and admin notification
        try {
            orderNotificationService.sendOrderConfirmedNotifications(orderResponse, customerEmail, customerName, phone);
        } catch (Exception ex) {
            log.error("[PaymentService] Error requesting order confirmed notifications for {}: {}", order.getOrderNumber(), ex.getMessage());
        }

        // Publish real-time admin events: NEW_ORDER and PAYMENT_RECEIVED
        eventPublisher.publishEvent(new AdminNotificationEvent(
                NotificationType.NEW_ORDER,
                "New Order #" + order.getOrderNumber(),
                "Online order #" + order.getOrderNumber() + " placed by " + customerName + " (₹" + order.getFinalAmount() + ")",
                String.valueOf(order.getId()),
                "ORDER",
                Map.of(
                        "orderId", order.getId(),
                        "orderNumber", order.getOrderNumber(),
                        "amount", order.getFinalAmount(),
                        "customerName", customerName,
                        "paymentMethod", "ONLINE",
                        "paymentId", request.getRazorpayPaymentId()
                )
        ));

        eventPublisher.publishEvent(new AdminNotificationEvent(
                NotificationType.PAYMENT_RECEIVED,
                "Payment Received #" + order.getOrderNumber(),
                "Payment of ₹" + order.getFinalAmount() + " received for order #" + order.getOrderNumber(),
                String.valueOf(order.getId()),
                "PAYMENT",
                Map.of(
                        "orderId", order.getId(),
                        "orderNumber", order.getOrderNumber(),
                        "amount", order.getFinalAmount(),
                        "paymentId", request.getRazorpayPaymentId()
                )
        ));
    }

    @Transactional
    public void markPaymentFailed(String internalOrderNumber, String reason) {
        Order order = orderRepository.findByOrderNumber(internalOrderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + internalOrderNumber));
        Payment payment = paymentRepository.findByOrderId(order.getId()).orElse(null);
        if (payment != null) {
            payment.setStatus(PaymentStatus.FAILED);
            payment.setFailureReason(reason);
            paymentRepository.save(payment);
        }
        order.setPaymentStatus(PaymentStatus.FAILED);
        orderRepository.save(order);
    }
}
