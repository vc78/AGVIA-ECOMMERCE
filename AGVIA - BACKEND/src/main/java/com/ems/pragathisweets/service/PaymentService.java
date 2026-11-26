package com.ems.pragathisweets.service;

import com.ems.pragathisweets.config.RazorpayConfig;
import com.ems.pragathisweets.dto.PaymentOrderResponse;
import com.ems.pragathisweets.dto.PaymentVerificationRequest;
import com.ems.pragathisweets.entity.NotificationType;
import com.ems.pragathisweets.entity.Order;
import com.ems.pragathisweets.entity.OrderStatus;
import com.ems.pragathisweets.entity.Payment;
import com.ems.pragathisweets.entity.PaymentStatus;
import com.ems.pragathisweets.entity.Product;
import com.ems.pragathisweets.event.AdminNotificationEvent;
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
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    private final OrderService orderService;
    private final OrderNotificationService orderNotificationService;
    private final com.ems.pragathisweets.repository.ProductVariantRepository productVariantRepository;
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

    private void assertOrderOwnership(Order order, Long requesterUserId, boolean isAdmin) {
        if (isAdmin) return;
        if (requesterUserId == null || order.getUser() == null || !order.getUser().getId().equals(requesterUserId)) {
            log.warn("[PAYMENT_OWNERSHIP_DENIED] User {} attempted access to order {}", requesterUserId, order.getOrderNumber());
            throw new AccessDeniedException("You do not have permission to process payment for this order.");
        }
    }

    @Transactional
    public PaymentOrderResponse createRazorpayOrder(String internalOrderNumber, Long requesterUserId, boolean isAdmin) {
        Order order = findOrderByIdOrNumber(internalOrderNumber);
        assertOrderOwnership(order, requesterUserId, isAdmin);

        if (order.getPaymentMethod() == com.ems.pragathisweets.entity.PaymentMethod.COD) {
            throw new PaymentVerificationException("This order is designated for Cash on Delivery. Online payment cannot be initiated.");
        }

        if (order.getPaymentStatus() == PaymentStatus.SUCCESS || order.getPaymentStatus() == PaymentStatus.COLLECTED) {
            throw new PaymentVerificationException("This order has already been paid.");
        }

        if (razorpayConfig.getKeyId() == null || razorpayConfig.getKeyId().isBlank()
                || razorpayConfig.getKeySecret() == null || razorpayConfig.getKeySecret().isBlank()) {
            throw new PaymentVerificationException("Online payment gateway credentials are not configured.");
        }

        for (com.ems.pragathisweets.entity.OrderItem item : order.getItems()) {
            Product p = item.getProduct();
            if (p != null && (p.getPaymentOption() == com.ems.pragathisweets.entity.ProductPaymentOption.COD_ONLY || !p.isOnlineAllowed())) {
                throw new PaymentVerificationException("Online payment is not available for " + item.getProductName() + " (Cash on Delivery only).");
            }
            if (item.getVariantId() != null) {
                com.ems.pragathisweets.entity.ProductVariant v = productVariantRepository.findById(item.getVariantId()).orElse(null);
                if (v != null && !v.isOnlineAllowed(p)) {
                    throw new PaymentVerificationException("Online payment is not available for " + item.getProductName() + " (" + v.getColorName() + ") (Cash on Delivery only).");
                }
            }
        }

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

    @Transactional
    public void verifyPayment(PaymentVerificationRequest request, Long requesterUserId, boolean isAdmin) {
        Order order = findOrderByIdOrNumber(request.getInternalOrderNumber());
        assertOrderOwnership(order, requesterUserId, isAdmin);

        Payment payment = paymentRepository.findByOrderId(order.getId())
                .orElseThrow(() -> new ResourceNotFoundException("No payment record found for this order"));

        if (payment.getStatus() == PaymentStatus.SUCCESS && order.getPaymentStatus() == PaymentStatus.SUCCESS) {
            log.info("[PaymentService] Idempotent payment verification ignored for order: {}", order.getOrderNumber());
            return;
        }

        if (payment.getRazorpayOrderId() == null || !payment.getRazorpayOrderId().equals(request.getRazorpayOrderId())) {
            log.warn("[PAYMENT_ORDER_MISMATCH] Expected razorpayOrderId={} for order={}",
                    payment.getRazorpayOrderId(), order.getOrderNumber());
            throw new PaymentVerificationException("Payment verification failed due to order reference mismatch.");
        }

        if (razorpayConfig.getKeySecret() == null || razorpayConfig.getKeySecret().isBlank()) {
            throw new PaymentVerificationException("Payment gateway configuration missing.");
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

        finalizeSuccessfulPayment(order, payment, request.getRazorpayPaymentId(), request.getRazorpaySignature());
    }

    @Transactional
    public void handleWebhook(String payload, String signature) {
        String webhookSecret = razorpayConfig.getWebhookSecret();
        if (webhookSecret == null || webhookSecret.isBlank()) {
            log.error("[RAZORPAY_WEBHOOK_UNCONFIGURED] Rejecting webhook because RAZORPAY_WEBHOOK_SECRET is not configured.");
            throw new PaymentVerificationException("Webhook verification secret is not configured.");
        }
        if (signature == null || signature.isBlank() || payload == null || payload.isBlank()) {
            log.warn("[RAZORPAY_WEBHOOK_REJECTED] Missing webhook payload or signature header.");
            throw new PaymentVerificationException("Missing webhook signature.");
        }

        try {
            boolean valid = Utils.verifyWebhookSignature(payload, signature, webhookSecret);
            if (!valid) {
                log.warn("[RAZORPAY_WEBHOOK_INVALID_SIGNATURE] Rejected forged Razorpay webhook.");
                throw new PaymentVerificationException("Invalid webhook signature.");
            }
        } catch (PaymentVerificationException pve) {
            throw pve;
        } catch (Exception ex) {
            log.error("[RAZORPAY_WEBHOOK_ERROR] Signature verification failed: {}", ex.getMessage());
            throw new PaymentVerificationException("Webhook signature verification failed.");
        }

        JSONObject root = new JSONObject(payload);
        String event = root.optString("event", "");
        JSONObject paymentEntity = Optional.ofNullable(root.optJSONObject("payload"))
                .map(p -> p.optJSONObject("payment"))
                .map(p -> p.optJSONObject("entity"))
                .orElse(null);

        if (paymentEntity == null) {
            return;
        }

        String razorpayOrderId = paymentEntity.optString("order_id", "");
        String razorpayPaymentId = paymentEntity.optString("id", "");
        long paidPaise = paymentEntity.optLong("amount", -1L);
        String currency = paymentEntity.optString("currency", "");

        if (razorpayOrderId.isBlank()) {
            return;
        }

        Optional<Payment> paymentOpt = paymentRepository.findByRazorpayOrderId(razorpayOrderId);
        if (paymentOpt.isEmpty()) {
            log.info("[RAZORPAY_WEBHOOK_UNKNOWN_ORDER] Ignoring webhook for unrecognized order_id={}", razorpayOrderId);
            return;
        }

        Payment payment = paymentOpt.get();
        Order order = payment.getOrder();

        if ("payment.captured".equals(event)) {
            if (payment.getStatus() == PaymentStatus.SUCCESS && order.getPaymentStatus() == PaymentStatus.SUCCESS) {
                return;
            }
            long expectedPaise = order.getFinalAmount().multiply(BigDecimal.valueOf(100)).longValue();
            if (paidPaise != expectedPaise || !"INR".equalsIgnoreCase(currency)) {
                log.error("[RAZORPAY_WEBHOOK_AMOUNT_MISMATCH] order={} expected={}paise got={}paise currency={}",
                        order.getOrderNumber(), expectedPaise, paidPaise, currency);
                throw new PaymentVerificationException("Webhook payment amount or currency mismatch.");
            }
            finalizeSuccessfulPayment(order, payment, razorpayPaymentId, signature);
        } else if ("payment.failed".equals(event)) {
            if (payment.getStatus() != PaymentStatus.SUCCESS) {
                payment.setStatus(PaymentStatus.FAILED);
                payment.setFailureReason(paymentEntity.optString("error_description", "Payment failed via webhook"));
                paymentRepository.save(payment);
                order.setPaymentStatus(PaymentStatus.FAILED);
                orderRepository.save(order);
            }
        }
    }

    private void finalizeSuccessfulPayment(Order order, Payment payment, String paymentId, String signature) {
        payment.setRazorpayPaymentId(paymentId);
        payment.setRazorpaySignature(signature);
        payment.setStatus(PaymentStatus.SUCCESS);
        paymentRepository.save(payment);

        order.setPaymentStatus(PaymentStatus.SUCCESS);
        order.setStatus(OrderStatus.CONFIRMED);
        orderRepository.save(order);

        String customerEmail = order.getUser() != null ? order.getUser().getEmail() : null;
        String customerName = order.getUser() != null ? order.getUser().getFullName() : "Valued Customer";
        String phone = (order.getContactPhone() != null && !order.getContactPhone().isBlank())
                ? order.getContactPhone()
                : (order.getUser() != null ? order.getUser().getPhone() : null);
        com.ems.pragathisweets.dto.OrderResponse orderResponse = orderService.toResponse(order);

        try {
            orderNotificationService.sendOrderConfirmedNotifications(orderResponse, customerEmail, customerName, phone);
        } catch (Exception ex) {
            log.error("[PaymentService] Error requesting order confirmed notifications for {}: {}", order.getOrderNumber(), ex.getMessage());
        }

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
                        "paymentId", paymentId != null ? paymentId : ""
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
                        "paymentId", paymentId != null ? paymentId : ""
                )
        ));

        eventPublisher.publishEvent(new com.ems.pragathisweets.event.OrderConfirmedEvent(order.getId(), order.getOrderNumber(), "ONLINE"));
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
