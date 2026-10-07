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
    private final com.ems.pragathisweets.repository.ProductVariantRepository productVariantRepository;
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

        // Validate mixed cart payment availability against MySQL products & variants
        for (CartItem cartItem : cart.getItems()) {
            Product p = productRepository.findById(cartItem.getProduct().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + cartItem.getProduct().getId()));

            boolean codAllowed = p.isCodAllowed();
            boolean onlineAllowed = p.isOnlineAllowed();

            if (p.getPaymentOption() == com.ems.pragathisweets.entity.ProductPaymentOption.COD_ONLY) {
                codAllowed = true;
                onlineAllowed = false;
            } else if (p.getPaymentOption() == com.ems.pragathisweets.entity.ProductPaymentOption.ONLINE_ONLY) {
                codAllowed = false;
                onlineAllowed = true;
            } else if (cartItem.getVariantId() != null) {
                com.ems.pragathisweets.entity.ProductVariant v = productVariantRepository.findById(cartItem.getVariantId()).orElse(null);
                if (v != null && v.getPaymentOption() != null) {
                    codAllowed = v.getPaymentOption() == com.ems.pragathisweets.entity.ProductPaymentOption.COD_AND_ONLINE || v.getPaymentOption() == com.ems.pragathisweets.entity.ProductPaymentOption.COD_ONLY;
                    onlineAllowed = v.getPaymentOption() == com.ems.pragathisweets.entity.ProductPaymentOption.COD_AND_ONLINE || v.getPaymentOption() == com.ems.pragathisweets.entity.ProductPaymentOption.ONLINE_ONLY;
                }
            }

            if (paymentMethod == PaymentMethod.COD && !codAllowed) {
                throw new IllegalArgumentException("Cash on Delivery isn't available for one or more items in your order. Please choose online payment.");
            }
            if (paymentMethod == PaymentMethod.RAZORPAY && !onlineAllowed) {
                throw new IllegalArgumentException("Online payment isn't available for one or more items in your order. Please choose Cash on Delivery.");
            }
        }

        for (CartItem cartItem : cart.getItems()) {
            // Pessimistic write lock ensures atomic check-and-decrement under high concurrency (e.g. flash sales)
            Product product = productRepository.findByIdWithPessimisticLock(cartItem.getProduct().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + cartItem.getProduct().getId()));

            com.ems.pragathisweets.entity.ProductVariant variant = null;
            if (cartItem.getVariantId() != null) {
                variant = productVariantRepository.findByIdForUpdate(cartItem.getVariantId())
                        .orElseThrow(() -> new ResourceNotFoundException("Product variant not found: " + cartItem.getVariantId()));

                if (variant.getStockQuantity() < cartItem.getQuantity()) {
                    throw new InsufficientStockException("Insufficient stock for " + product.getName()
                            + " (" + variant.getColorName() + "). Available: " + variant.getStockQuantity());
                }
            } else {
                if (product.getStockQuantity() < cartItem.getQuantity()) {
                    throw new InsufficientStockException("Insufficient stock for " + product.getName()
                            + ". Available: " + product.getStockQuantity());
                }
            }

            BigDecimal effectivePrice = (variant != null)
                    ? variant.getEffectivePrice(product.getEffectivePrice())
                    : product.getEffectivePrice();

            BigDecimal subtotal = effectivePrice.multiply(BigDecimal.valueOf(cartItem.getQuantity()));
            totalAmount = totalAmount.add(subtotal);

            String itemSku = (variant != null && variant.getSku() != null) ? variant.getSku() : product.getSku();
            String itemColor = (variant != null) ? variant.getColorName() : cartItem.getColorName();
            String itemImage = (variant != null && variant.getPrimaryImage() != null)
                    ? variant.getPrimaryImage().getImageUrl()
                    : (cartItem.getImageUrl() != null ? cartItem.getImageUrl() : product.getImageUrl());

            OrderItem orderItem = OrderItem.builder()
                    .product(product)
                    .productName(product.getName())
                    .quantity(cartItem.getQuantity())
                    .price(effectivePrice)
                    .subtotal(subtotal)
                    .variantId(variant != null ? variant.getId() : null)
                    .colorName(itemColor)
                    .sku(itemSku)
                    .imageUrl(itemImage)
                    .build();
            order.addItem(orderItem);

            // Decrement variant stock if applicable
            if (variant != null) {
                variant.setStockQuantity(variant.getStockQuantity() - cartItem.getQuantity());
                productVariantRepository.save(variant);
            }

            // Decrement stock (reserved at order creation time)
            int previousStock = product.getStockQuantity();
            int threshold = product.getEffectiveLowStockThreshold();
            int remainingStock = Math.max(0, previousStock - cartItem.getQuantity());
            product.setStockQuantity(remainingStock);
            productRepository.save(product);

            // State-transition inventory alerts (prevents redundant duplicate alerts):
            // 1. IN_STOCK -> LOW_STOCK: ONLY trigger on transition from > threshold to <= threshold and > 0
            if (previousStock > threshold && remainingStock <= threshold && remainingStock > 0) {
                eventPublisher.publishEvent(new AdminNotificationEvent(
                        NotificationType.LOW_STOCK,
                        "Low Stock: " + product.getName(),
                        "Stock is running low for " + product.getName() + " — " + remainingStock + " remaining.",
                        String.valueOf(product.getId()),
                        "PRODUCT",
                        java.util.Map.of("productId", product.getId(), "name", product.getName(), "stock", remainingStock, "threshold", threshold)
                ));
            }
            // 2. Any stock -> OUT_OF_STOCK: ONLY trigger on transition to 0
            else if (previousStock > 0 && remainingStock == 0) {
                eventPublisher.publishEvent(new AdminNotificationEvent(
                        NotificationType.OUT_OF_STOCK,
                        "Out of Stock: " + product.getName(),
                        product.getName() + " is now out of stock.",
                        String.valueOf(product.getId()),
                        "PRODUCT",
                        java.util.Map.of("productId", product.getId(), "name", product.getName(), "sku", product.getSku() != null ? product.getSku() : "")
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

            // Trigger non-blocking Excel Reporting layer synchronization
            eventPublisher.publishEvent(new com.ems.pragathisweets.event.OrderConfirmedEvent(saved.getId(), saved.getOrderNumber(), "COD"));
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
            if (item.getVariantId() != null) {
                productVariantRepository.findById(item.getVariantId()).ifPresent(v -> {
                    v.setStockQuantity(v.getStockQuantity() + item.getQuantity());
                    productVariantRepository.save(v);
                });
            }
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
                        .variantId(item.getVariantId())
                        .colorName(item.getColorName())
                        .sku(item.getSku())
                        .imageUrl(item.getImageUrl())
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
