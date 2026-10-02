package com.ems.pragathisweets.service;

import com.ems.pragathisweets.dto.CheckoutRequest;
import com.ems.pragathisweets.dto.OrderItemResponse;
import com.ems.pragathisweets.dto.OrderResponse;
import com.ems.pragathisweets.entity.*;
import com.ems.pragathisweets.exception.InsufficientStockException;
import com.ems.pragathisweets.exception.ResourceNotFoundException;
import com.ems.pragathisweets.repository.CartRepository;
import com.ems.pragathisweets.repository.OrderRepository;
import com.ems.pragathisweets.repository.ProductRepository;
import com.ems.pragathisweets.repository.UserRepository;
import com.ems.pragathisweets.event.AdminNotificationEvent;
import org.springframework.context.ApplicationEventPublisher;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final CartRepository cartRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final CouponService couponService;
    private final EmailService emailService;
    private final WhatsAppService whatsAppService;
    private final OrderNotificationService orderNotificationService;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public OrderResponse checkout(Long userId, CheckoutRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart is empty"));

        if (cart.getItems().isEmpty()) {
            throw new IllegalArgumentException("Cannot checkout with an empty cart");
        }

        PaymentMethod paymentMethod;
        try {
            paymentMethod = PaymentMethod.valueOf(request.getPaymentMethod().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Invalid payment method. Use COD or RAZORPAY");
        }

        // Validate stock and build order items
        BigDecimal totalAmount = BigDecimal.ZERO;
        Order order = Order.builder()
                .orderNumber(generateOrderNumber())
                .user(user)
                .paymentMethod(paymentMethod)
                .paymentStatus(paymentMethod == PaymentMethod.COD ? PaymentStatus.PENDING : PaymentStatus.PENDING)
                // COD orders are confirmed immediately; RAZORPAY orders stay PENDING until payment verification
                .status(paymentMethod == PaymentMethod.COD ? OrderStatus.CONFIRMED : OrderStatus.PENDING)
                .shippingAddress(request.getShippingAddress())
                .contactPhone(request.getContactPhone())
                .notes(request.getNotes())
                .couponCode(request.getCouponCode())
                .discountAmount(BigDecimal.ZERO)
                .build();

        for (CartItem cartItem : cart.getItems()) {
            // Pessimistic write lock ensures atomic check-and-decrement under high concurrency (e.g. flash sales)
            Product product = productRepository.findByIdWithPessimisticLock(cartItem.getProduct().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + cartItem.getProduct().getId()));

            if (product.getStockQuantity() < cartItem.getQuantity()) {
                throw new InsufficientStockException("Insufficient stock for " + product.getName()
                        + ". Available: " + product.getStockQuantity());
            }

            BigDecimal subtotal = product.getEffectivePrice().multiply(BigDecimal.valueOf(cartItem.getQuantity()));
            totalAmount = totalAmount.add(subtotal);

            OrderItem orderItem = OrderItem.builder()
                    .product(product)
                    .productName(product.getName())
                    .quantity(cartItem.getQuantity())
                    .price(product.getEffectivePrice())
                    .subtotal(subtotal)
                    .build();
            order.addItem(orderItem);

            // Decrement stock (reserved at order creation time)
            int remainingStock = product.getStockQuantity() - cartItem.getQuantity();
            product.setStockQuantity(remainingStock);
            productRepository.save(product);

            // Publish inventory alerts
            if (remainingStock == 0) {
                eventPublisher.publishEvent(new AdminNotificationEvent(
                        NotificationType.OUT_OF_STOCK,
                        "Out of Stock: " + product.getName(),
                        "Silhouette " + product.getName() + " (SKU: " + product.getSku() + ") is now OUT OF STOCK.",
                        String.valueOf(product.getId()),
                        "PRODUCT",
                        java.util.Map.of("productId", product.getId(), "name", product.getName(), "sku", product.getSku())
                ));
            } else if (remainingStock <= 10) {
                eventPublisher.publishEvent(new AdminNotificationEvent(
                        NotificationType.LOW_STOCK,
                        "Low Stock: " + product.getName(),
                        "Silhouette " + product.getName() + " has only " + remainingStock + " piece(s) remaining.",
                        String.valueOf(product.getId()),
                        "PRODUCT",
                        java.util.Map.of("productId", product.getId(), "name", product.getName(), "stock", remainingStock)
                ));
            }
        }

        order.setTotalAmount(totalAmount);

        BigDecimal discount = BigDecimal.ZERO;
        if (request.getCouponCode() != null && !request.getCouponCode().isBlank()) {
            discount = couponService.applyCoupon(request.getCouponCode(), totalAmount);
        }
        order.setDiscountAmount(discount);

        BigDecimal deliveryFee = (totalAmount.compareTo(BigDecimal.valueOf(999)) >= 0 || totalAmount.compareTo(BigDecimal.ZERO) == 0)
                ? BigDecimal.ZERO
                : BigDecimal.valueOf(50);

        BigDecimal finalAmount = totalAmount.subtract(discount).add(deliveryFee);
        if (finalAmount.compareTo(BigDecimal.ZERO) < 0) {
            finalAmount = BigDecimal.ZERO;
        }
        order.setFinalAmount(finalAmount);

        Order saved = orderRepository.save(order);

        // Clear the cart after order is placed
        cart.getItems().clear();
        cartRepository.save(cart);

        // WhatsApp and email confirmation – uses contactPhone from the order (preferred) or user profile phone
        String phone = (request.getContactPhone() != null && !request.getContactPhone().isBlank())
                ? request.getContactPhone()
                : user.getPhone();
        OrderResponse orderResponse = toResponse(saved);

        // Only send order confirmation immediately for COD orders.
        // Online payment (Razorpay) orders remain PENDING until backend signature verification.
        if (saved.getPaymentMethod() == PaymentMethod.COD) {
            orderNotificationService.sendOrderConfirmedNotifications(orderResponse, user.getEmail(), user.getFullName(), phone);

            // Publish real-time NEW_ORDER event to admin dashboard
            eventPublisher.publishEvent(new AdminNotificationEvent(
                    NotificationType.NEW_ORDER,
                    "New COD Order #" + saved.getOrderNumber(),
                    "Order #" + saved.getOrderNumber() + " placed by " + (user.getFullName() != null ? user.getFullName() : "Patron") + " (₹" + saved.getFinalAmount() + ")",
                    String.valueOf(saved.getId()),
                    "ORDER",
                    java.util.Map.of(
                            "orderId", saved.getId(),
                            "orderNumber", saved.getOrderNumber(),
                            "amount", saved.getFinalAmount(),
                            "customerName", user.getFullName() != null ? user.getFullName() : "Patron",
                            "itemsCount", saved.getItems().size(),
                            "paymentMethod", "COD"
                    )
            ));
        }

        return orderResponse;
    }

    @Transactional(readOnly = true)
    public Page<OrderResponse> getUserOrders(Long userId, Pageable pageable) {
        return orderRepository.findByUserId(userId, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public OrderResponse getUserOrder(Long userId, Long orderId) {
        Order order = orderRepository.findByIdAndUserId(orderId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));
        return toResponse(order);
    }

    @Transactional(readOnly = true)
    public Order findUserOrderEntity(Long userId, String identifier) {
        try {
            Long numericId = Long.parseLong(identifier);
            return orderRepository.findByIdAndUserId(numericId, userId)
                    .orElseGet(() -> orderRepository.findByOrderNumberAndUserId(identifier, userId)
                            .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + identifier)));
        } catch (NumberFormatException e) {
            return orderRepository.findByOrderNumberAndUserId(identifier, userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + identifier));
        }
    }

    @Transactional(readOnly = true)
    public String getOrderWhatsAppMessage(Long userId, String identifier) {
        Order order = findUserOrderEntity(userId, identifier);
        OrderResponse response = toResponse(order);
        return whatsAppService.buildOrderConfirmationMessage(response, order.getUser().getFullName());
    }

    @Transactional(readOnly = true)
    public OrderResponse trackOrder(String identifier) {
        if (identifier == null || identifier.isBlank()) {
            throw new IllegalArgumentException("Order reference is required");
        }
        String clean = identifier.trim();
        java.util.Optional<Order> orderOpt = orderRepository.findByOrderNumber(clean);
        if (orderOpt.isEmpty()) {
            String alt = clean.startsWith("PS-") ? clean : "PS-" + clean;
            orderOpt = orderRepository.findByOrderNumber(alt);
        }
        if (orderOpt.isEmpty() && clean.startsWith("#")) {
            orderOpt = orderRepository.findByOrderNumber(clean.substring(1));
        }
        if (orderOpt.isEmpty()) {
            try {
                Long id = Long.parseLong(clean.replaceAll("[^0-9]", ""));
                orderOpt = orderRepository.findById(id);
            } catch (Exception ignored) {}
        }
        Order order = orderOpt.orElseThrow(() -> new ResourceNotFoundException("No order found with reference: " + identifier));
        return toResponse(order);
    }

    @Transactional
    public OrderResponse cancelOrder(Long userId, Long orderId) {
        Order order = orderRepository.findByIdAndUserId(orderId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        if (order.getStatus() == OrderStatus.SHIPPED || order.getStatus() == OrderStatus.DELIVERED) {
            throw new IllegalArgumentException("Cannot cancel an order that has already been shipped or delivered");
        }
        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new IllegalArgumentException("Order is already cancelled");
        }

        // Restock items
        for (OrderItem item : order.getItems()) {
            if (item.getProduct() != null) {
                Product product = item.getProduct();
                product.setStockQuantity(product.getStockQuantity() + item.getQuantity());
                productRepository.save(product);
            }
        }

        order.setStatus(OrderStatus.CANCELLED);
        Order saved = orderRepository.save(order);

        eventPublisher.publishEvent(new AdminNotificationEvent(
                NotificationType.ORDER_CANCELLED,
                "Order Cancelled #" + saved.getOrderNumber(),
                "Order #" + saved.getOrderNumber() + " was cancelled by customer " + (order.getUser() != null ? order.getUser().getFullName() : ""),
                String.valueOf(saved.getId()),
                "ORDER",
                java.util.Map.of(
                        "orderId", saved.getId(),
                        "orderNumber", saved.getOrderNumber(),
                        "amount", saved.getFinalAmount()
                )
        ));

        String cancelPhone = order.getContactPhone() != null ? order.getContactPhone() : order.getUser().getPhone();
        OrderResponse response = toResponse(saved);
        orderNotificationService.sendOrderStatusNotification(response, "CANCELLED", order.getUser().getEmail(), order.getUser().getFullName(), cancelPhone, "Order cancelled by customer");
        return response;
    }

    private String generateOrderNumber() {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        int random = ThreadLocalRandom.current().nextInt(100, 999);
        return "PS" + timestamp + random;
    }

    public OrderResponse toResponse(Order order) {
        var items = order.getItems().stream()
                .map(item -> OrderItemResponse.builder()
                        .productId(item.getProduct() != null ? item.getProduct().getId() : null)
                        .productName(item.getProductName())
                        .quantity(item.getQuantity())
                        .price(item.getPrice())
                        .subtotal(item.getSubtotal())
                        .build())
                .toList();

        return OrderResponse.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
                .userId(order.getUser().getId())
                .userName(order.getUser().getFullName())
                .userEmail(order.getUser().getEmail())
                .items(items)
                .totalAmount(order.getTotalAmount())
                .discountAmount(order.getDiscountAmount())
                .finalAmount(order.getFinalAmount())
                .couponCode(order.getCouponCode())
                .status(order.getStatus().name())
                .paymentMethod(order.getPaymentMethod().name())
                .paymentStatus(order.getPaymentStatus().name())
                .shippingAddress(order.getShippingAddress())
                .contactPhone(order.getContactPhone())
                .notes(order.getNotes())
                .createdAt(order.getCreatedAt())
                .build();
    }
}
