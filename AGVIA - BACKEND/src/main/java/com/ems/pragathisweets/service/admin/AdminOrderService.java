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
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminOrderService {

    private final OrderRepository orderRepository;
    private final OrderService orderService;
    private final EmailService emailService;
    private final WhatsAppService whatsAppService;
    private final com.ems.pragathisweets.service.OrderNotificationService orderNotificationService;
    private final ApplicationEventPublisher eventPublisher;
    private final com.ems.pragathisweets.repository.ProductRepository productRepository;
    private final com.ems.pragathisweets.repository.ProductVariantRepository productVariantRepository;
    private final com.ems.pragathisweets.repository.UserRepository userRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

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
            if (order.getUser() != null && order.getUser().getEmail() != null) {
                emailService.sendCodPaymentCollectedEmail(
                        order.getUser().getEmail(),
                        order.getOrderNumber(),
                        order.getFinalAmount().toString());
            }
        }

        Order saved = orderRepository.save(order);
        OrderResponse orderResponse = orderService.toResponse(saved);

        String phone = order.getContactPhone() != null ? order.getContactPhone() : (order.getUser() != null ? order.getUser().getPhone() : null);
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

    @Transactional
    public OrderResponse createPosBill(com.ems.pragathisweets.dto.admin.CreatePosBillRequest request, String adminEmail) {
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new IllegalArgumentException("In-store bill must contain at least one silhouette item.");
        }

        // 1. Resolve or Create Patron User
        com.ems.pragathisweets.entity.User patron = resolvePatron(request, adminEmail);

        // 2. Generate unique POS invoice/order number
        String datePrefix = DateTimeFormatter.ofPattern("yyyyMMdd").format(LocalDate.now());
        String orderNumber = "POS-" + datePrefix + "-" + (int) (Math.random() * 9000 + 1000);

        // 3. Resolve Payment Method & Status
        PaymentMethod paymentMethod = PaymentMethod.COD;
        String rawMethod = request.getPaymentMethod() != null ? request.getPaymentMethod().toUpperCase() : "CASH";
        if ("RAZORPAY".equalsIgnoreCase(rawMethod) || "ONLINE".equalsIgnoreCase(rawMethod) || "CARD".equalsIgnoreCase(rawMethod) || "UPI".equalsIgnoreCase(rawMethod)) {
            paymentMethod = PaymentMethod.RAZORPAY;
        }

        PaymentStatus paymentStatus = PaymentStatus.SUCCESS;
        if ("PENDING".equalsIgnoreCase(request.getPaymentStatus())) {
            paymentStatus = PaymentStatus.PENDING;
        }

        // 4. Build base order
        String customerName = (request.getCustomerName() != null && !request.getCustomerName().isBlank())
                ? request.getCustomerName().trim()
                : patron.getFullName();
        String customerPhone = (request.getCustomerPhone() != null && !request.getCustomerPhone().isBlank())
                ? request.getCustomerPhone().trim()
                : patron.getPhone();

        StringBuilder notesBuilder = new StringBuilder();
        notesBuilder.append("[IN_STORE_POS] Cashier: ").append(adminEmail != null ? adminEmail : "Admin");
        notesBuilder.append(" | Customer: ").append(customerName);
        notesBuilder.append(" | Mode: ").append(rawMethod);
        if (request.getDiscountReason() != null && !request.getDiscountReason().isBlank()) {
            notesBuilder.append(" | Concession: ").append(request.getDiscountReason().trim());
        }
        if (request.getNotes() != null && !request.getNotes().isBlank()) {
            notesBuilder.append(" | Note: ").append(request.getNotes().trim());
        }

        String storeAddress = "AGVIA Atelier Storefront — Walk-in Patron";
        if (request.getCustomerAddress() != null && !request.getCustomerAddress().isBlank()) {
            storeAddress += " (" + request.getCustomerAddress().trim() + ")";
        }

        BigDecimal customDiscount = request.getCustomDiscount() != null ? request.getCustomDiscount() : BigDecimal.ZERO;
        BigDecimal taxAmount = request.getTaxAmount() != null ? request.getTaxAmount() : BigDecimal.ZERO;

        Order order = Order.builder()
                .orderNumber(orderNumber)
                .user(patron)
                .status(OrderStatus.DELIVERED)
                .paymentMethod(paymentMethod)
                .paymentStatus(paymentStatus)
                .shippingAddress(storeAddress)
                .contactPhone(customerPhone)
                .notes(notesBuilder.toString())
                .discountAmount(customDiscount)
                .totalAmount(BigDecimal.ZERO)
                .finalAmount(BigDecimal.ZERO)
                .build();

        // 5. Process Items & Deduct Real-Time Stock
        BigDecimal subtotalSum = BigDecimal.ZERO;
        BigDecimal itemDiscountsSum = BigDecimal.ZERO;

        for (com.ems.pragathisweets.dto.admin.PosBillItemRequest itemReq : request.getItems()) {
            com.ems.pragathisweets.entity.Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + itemReq.getProductId()));

            int qty = itemReq.getQuantity() != null && itemReq.getQuantity() > 0 ? itemReq.getQuantity() : 1;
            BigDecimal unitPrice = itemReq.getUnitPrice() != null ? itemReq.getUnitPrice() : product.getPrice();
            BigDecimal lineDiscount = itemReq.getDiscount() != null ? itemReq.getDiscount() : BigDecimal.ZERO;
            BigDecimal lineSubtotal = unitPrice.multiply(BigDecimal.valueOf(qty)).subtract(lineDiscount);
            if (lineSubtotal.compareTo(BigDecimal.ZERO) < 0) lineSubtotal = BigDecimal.ZERO;

            subtotalSum = subtotalSum.add(unitPrice.multiply(BigDecimal.valueOf(qty)));
            itemDiscountsSum = itemDiscountsSum.add(lineDiscount);

            // Deduct product stock safely
            if (product.getStockQuantity() != null) {
                int newStock = Math.max(0, product.getStockQuantity() - qty);
                product.setStockQuantity(newStock);
                productRepository.save(product);
            }

            // Deduct variant stock if variant specified
            String variantColor = null;
            String itemSku = itemReq.getSku() != null ? itemReq.getSku() : product.getSku();
            if (itemReq.getVariantId() != null) {
                com.ems.pragathisweets.entity.ProductVariant variant = productVariantRepository.findById(itemReq.getVariantId()).orElse(null);
                if (variant != null) {
                    if (variant.getStockQuantity() != null) {
                        variant.setStockQuantity(Math.max(0, variant.getStockQuantity() - qty));
                        productVariantRepository.save(variant);
                    }
                    variantColor = variant.getColorName();
                    if (variant.getSku() != null && !variant.getSku().isBlank()) {
                        itemSku = variant.getSku();
                    }
                }
            }

            com.ems.pragathisweets.entity.OrderItem orderItem = com.ems.pragathisweets.entity.OrderItem.builder()
                    .product(product)
                    .productName(itemReq.getProductName() != null ? itemReq.getProductName() : product.getName())
                    .quantity(qty)
                    .price(unitPrice)
                    .subtotal(lineSubtotal)
                    .variantId(itemReq.getVariantId())
                    .colorName(itemReq.getColorName() != null ? itemReq.getColorName() : variantColor)
                    .sku(itemSku)
                    .imageUrl(product.getImageUrl())
                    .build();

            order.addItem(orderItem);
        }

        BigDecimal totalDiscount = itemDiscountsSum.add(customDiscount);
        BigDecimal finalAmount = subtotalSum.subtract(totalDiscount).add(taxAmount);
        if (finalAmount.compareTo(BigDecimal.ZERO) < 0) finalAmount = BigDecimal.ZERO;

        order.setTotalAmount(subtotalSum);
        order.setDiscountAmount(totalDiscount);
        order.setFinalAmount(finalAmount);

        Order savedOrder = orderRepository.save(order);

        // 6. Real-time WebSocket Broadcast to all Admin sessions
        try {
            eventPublisher.publishEvent(new AdminNotificationEvent(
                    NotificationType.NEW_ORDER,
                    "In-Store Walk-in Bill Generated",
                    "Bill " + savedOrder.getOrderNumber() + " generated at atelier counter for ₹" + savedOrder.getFinalAmount() + " (" + customerName + ")",
                    String.valueOf(savedOrder.getId()),
                    "ORDER",
                    Map.of(
                            "orderId", savedOrder.getId(),
                            "orderNumber", savedOrder.getOrderNumber(),
                            "amount", savedOrder.getFinalAmount(),
                            "customer", customerName,
                            "type", "WALK_IN_POS"
                    )
            ));
        } catch (Exception e) {
            log.warn("[POS_EVENT_WARN] Could not broadcast POS order event: {}", e.getMessage());
        }

        // 7. Email Receipt if real email is present
        if (patron.getEmail() != null && !patron.getEmail().endsWith("@agviastore.internal")) {
            try {
                emailService.sendOrderConfirmationEmail(orderService.toResponse(savedOrder), patron.getEmail(), patron.getFullName());
            } catch (Exception e) {
                log.warn("[POS_EMAIL_WARN] Could not dispatch receipt email: {}", e.getMessage());
            }
        }

        // 8. Sync Excel log event
        try {
            eventPublisher.publishEvent(new com.ems.pragathisweets.event.OrderConfirmedEvent(savedOrder.getId(), savedOrder.getOrderNumber(), "IN_STORE_POS"));
        } catch (Exception e) {
            log.warn("[POS_EXCEL_SYNC_WARN] Could not sync POS order event: {}", e.getMessage());
        }

        return orderService.toResponse(savedOrder);
    }

    private com.ems.pragathisweets.entity.User resolvePatron(com.ems.pragathisweets.dto.admin.CreatePosBillRequest req, String adminEmail) {
        String phone = req.getCustomerPhone() != null && !req.getCustomerPhone().isBlank() ? req.getCustomerPhone().trim() : null;
        String email = req.getCustomerEmail() != null && !req.getCustomerEmail().isBlank() ? req.getCustomerEmail().trim().toLowerCase() : null;

        if (email != null) {
            Optional<com.ems.pragathisweets.entity.User> existing = userRepository.findByEmail(email);
            if (existing.isPresent()) return existing.get();
        }

        if (phone != null) {
            Optional<com.ems.pragathisweets.entity.User> existing = userRepository.findByPhone(phone);
            if (existing.isPresent()) return existing.get();
        }

        // If phone or email provided, create a walk-in patron profile
        String name = (req.getCustomerName() != null && !req.getCustomerName().isBlank())
                ? req.getCustomerName().trim()
                : "Walk-in Patron";

        String targetEmail = email != null ? email : "patron_" + System.currentTimeMillis() + "@agviastore.internal";
        String targetPhone = phone != null ? phone : "WALKIN-" + System.currentTimeMillis();

        com.ems.pragathisweets.entity.User newPatron = com.ems.pragathisweets.entity.User.builder()
                .fullName(name)
                .email(targetEmail)
                .phone(targetPhone)
                .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                .address(req.getCustomerAddress() != null && !req.getCustomerAddress().isBlank() ? req.getCustomerAddress().trim() : "In-Store Counter")
                .role(com.ems.pragathisweets.entity.Role.ROLE_USER)
                .enabled(true)
                .phoneVerified(phone != null)
                .build();

        return userRepository.save(newPatron);
    }

    private Order findEntity(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + id));
    }

    @Transactional
    public String rotateTrackingToken(Long id) {
        Order order = findEntity(id);
        String newToken = Order.generateSecureTrackingToken();
        order.setTrackingToken(newToken);
        order.setTrackingTokenRevoked(false);
        orderRepository.save(order);
        return newToken;
    }

    @Transactional
    public void revokeTrackingToken(Long id) {
        Order order = findEntity(id);
        order.setTrackingTokenRevoked(true);
        orderRepository.save(order);
    }
}
