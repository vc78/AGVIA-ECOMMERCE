package com.ems.pragathisweets.service;

import com.ems.pragathisweets.dto.AdminReturnDecisionRequest;
import com.ems.pragathisweets.dto.CreateReturnRequest;
import com.ems.pragathisweets.dto.ReturnRequestResponse;
import com.ems.pragathisweets.entity.*;
import com.ems.pragathisweets.exception.ResourceNotFoundException;
import com.ems.pragathisweets.repository.*;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReturnService {

    private final ReturnRequestRepository returnRequestRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final UserRepository userRepository;
    private final CouponRepository couponRepository;
    private final ObjectMapper objectMapper;

    private static final int RETURN_WINDOW_DAYS = 7;

    @Transactional
    public ReturnRequestResponse createReturnRequest(Long userId, CreateReturnRequest request) {
        log.info("[RETURN_REQUEST] User {} requesting return/exchange for Order {}", userId, request.getOrderId());

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Patron account not found"));

        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        // 1. Enforce patron ownership
        if (order.getUser() == null || !order.getUser().getId().equals(userId)) {
            log.warn("[SECURITY] Patron {} attempted to return order {} owned by another user", userId, order.getId());
            throw new AccessDeniedException("You do not have permission to modify this order.");
        }

        // 2. Validate order status (must be DELIVERED)
        if (order.getStatus() != OrderStatus.DELIVERED) {
            throw new IllegalArgumentException("Returns or size exchanges can only be initiated once an order has been successfully delivered.");
        }

        // 3. Enforce 7-day return policy window
        LocalDateTime deliveryOrCreationDate = order.getUpdatedAt() != null ? order.getUpdatedAt() : order.getCreatedAt();
        if (deliveryOrCreationDate != null && deliveryOrCreationDate.plusDays(RETURN_WINDOW_DAYS).isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("The 7-day return policy window for this order has elapsed. Please reach out to Atelier Concierge for bespoke support.");
        }

        // 4. Check for existing active return/exchange request
        boolean hasActiveReturn = returnRequestRepository.existsByOrderIdAndStatusNotIn(
                order.getId(),
                List.of(ReturnStatus.REJECTED, ReturnStatus.CANCELLED)
        );
        if (hasActiveReturn) {
            throw new IllegalArgumentException("A return or size exchange request is already active for this order.");
        }

        // 5. Validate Return Type, Reason and Resolution
        ReturnType type;
        try {
            type = ReturnType.valueOf(request.getType().trim().toUpperCase());
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid return request type. Must be RETURN or EXCHANGE.");
        }

        ReturnReason reason;
        try {
            reason = ReturnReason.valueOf(request.getReason().trim().toUpperCase());
        } catch (Exception e) {
            throw new IllegalArgumentException("Please select a valid reason for return or size exchange.");
        }

        ReturnResolution resolution;
        try {
            resolution = ReturnResolution.valueOf(request.getResolution().trim().toUpperCase());
        } catch (Exception e) {
            throw new IllegalArgumentException("Please select a valid resolution (Exchange, Store Privilege Credit, or Original Payment).");
        }

        // 6. Optional OrderItem specific validation
        OrderItem orderItem = null;
        BigDecimal calculatedRefundAmount = order.getFinalAmount();
        if (request.getOrderItemId() != null) {
            orderItem = orderItemRepository.findById(request.getOrderItemId())
                    .orElse(null);
            if (orderItem != null && !orderItem.getOrder().getId().equals(order.getId())) {
                throw new IllegalArgumentException("The specified garment item does not belong to this order.");
            }
            if (orderItem != null && orderItem.getSubtotal() != null) {
                calculatedRefundAmount = orderItem.getSubtotal();
            }
        }

        // 7. Store images as JSON
        String imagesJson = null;
        if (request.getImages() != null && !request.getImages().isEmpty()) {
            try {
                imagesJson = objectMapper.writeValueAsString(request.getImages());
            } catch (Exception e) {
                log.warn("Failed to serialize return images: {}", e.getMessage());
            }
        }

        // 8. Generate unique return reference number (RET-YYYYMMDD-XXXXXX)
        String returnNumber = "RET-" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"))
                + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();

        String pickupAddress = request.getPickupAddress();
        if (pickupAddress == null || pickupAddress.isBlank()) {
            pickupAddress = order.getShippingAddress();
        }

        ReturnRequest returnRequest = ReturnRequest.builder()
                .returnNumber(returnNumber)
                .order(order)
                .user(user)
                .orderItem(orderItem)
                .type(type)
                .reason(reason)
                .resolution(resolution)
                .status(ReturnStatus.REQUESTED)
                .targetSize(request.getTargetSize())
                .targetColor(request.getTargetColor())
                .targetVariantId(request.getTargetVariantId())
                .customerNotes(request.getCustomerNotes())
                .imagesJson(imagesJson)
                .bankDetails(request.getBankDetails())
                .pickupAddress(pickupAddress)
                .refundAmount(calculatedRefundAmount)
                .adminNotes(null)
                .build();

        ReturnRequest saved = returnRequestRepository.save(returnRequest);
        log.info("[RETURN_REQUEST_CREATED] Created {} for order {}", saved.getReturnNumber(), order.getOrderNumber());
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<ReturnRequestResponse> getUserReturns(Long userId) {
        return returnRequestRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ReturnRequestResponse> getOrderReturns(Long userId, Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        if (order.getUser() == null || !order.getUser().getId().equals(userId)) {
            throw new AccessDeniedException("You do not have permission to view returns for this order.");
        }

        return returnRequestRepository.findByOrderIdOrderByCreatedAtDesc(orderId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public Page<ReturnRequestResponse> getAllReturns(String status, Pageable pageable) {
        if (status != null && !status.isBlank() && !status.equalsIgnoreCase("ALL")) {
            try {
                ReturnStatus s = ReturnStatus.valueOf(status.trim().toUpperCase());
                return returnRequestRepository.findByStatusOrderByCreatedAtDesc(s, pageable).map(this::toResponse);
            } catch (Exception ignored) {}
        }
        return returnRequestRepository.findAllByOrderByCreatedAtDesc(pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public ReturnRequestResponse getReturnById(Long returnId) {
        ReturnRequest request = returnRequestRepository.findById(returnId)
                .orElseThrow(() -> new ResourceNotFoundException("Return request not found"));
        return toResponse(request);
    }

    @Transactional
    public ReturnRequestResponse updateReturnDecision(Long returnId, AdminReturnDecisionRequest decision) {
        ReturnRequest returnRequest = returnRequestRepository.findById(returnId)
                .orElseThrow(() -> new ResourceNotFoundException("Return request not found"));

        ReturnStatus newStatus;
        try {
            newStatus = ReturnStatus.valueOf(decision.getStatus().trim().toUpperCase());
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid status provided for return decision.");
        }

        returnRequest.setStatus(newStatus);

        if (decision.getAdminNotes() != null) {
            returnRequest.setAdminNotes(decision.getAdminNotes());
        }

        if (decision.getReverseCourierPartner() != null && !decision.getReverseCourierPartner().isBlank()) {
            returnRequest.setReverseCourierPartner(decision.getReverseCourierPartner().trim());
        }

        if (decision.getReverseTrackingNumber() != null && !decision.getReverseTrackingNumber().isBlank()) {
            returnRequest.setReverseTrackingNumber(decision.getReverseTrackingNumber().trim());
        }

        if (decision.getRefundAmount() != null) {
            returnRequest.setRefundAmount(decision.getRefundAmount());
        }

        // When reverse pickup is scheduled, provide automated courier defaults if missing
        if (newStatus == ReturnStatus.PICKUP_SCHEDULED) {
            if (returnRequest.getReverseCourierPartner() == null || returnRequest.getReverseCourierPartner().isBlank()) {
                returnRequest.setReverseCourierPartner("Blue Dart Express (Reverse Logistics)");
            }
            if (returnRequest.getReverseTrackingNumber() == null || returnRequest.getReverseTrackingNumber().isBlank()) {
                long pseudoAwb = Math.abs(System.currentTimeMillis() % 9000000000L) + 1000000000L;
                returnRequest.setReverseTrackingNumber("AGV-REV-" + pseudoAwb);
            }
        }

        // When return is COMPLETED, handle Store Credit generation or refund confirmation
        if (newStatus == ReturnStatus.COMPLETED) {
            boolean isStoreCredit = returnRequest.getResolution() == ReturnResolution.STORE_CREDIT
                    || Boolean.TRUE.equals(decision.getIssueStoreCreditCoupon());

            if (isStoreCredit && (returnRequest.getCreditCouponCode() == null || returnRequest.getCreditCouponCode().isBlank())) {
                BigDecimal creditValue = returnRequest.getRefundAmount();
                if (creditValue == null || creditValue.compareTo(BigDecimal.ZERO) <= 0) {
                    creditValue = returnRequest.getOrder().getFinalAmount();
                }

                // Add 5% VIP privilege store credit bonus
                BigDecimal privilegeBonus = creditValue.multiply(new BigDecimal("0.05"));
                BigDecimal totalCredit = creditValue.add(privilegeBonus).setScale(2, java.math.RoundingMode.HALF_UP);

                String couponCode = "PRIV-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
                while (couponRepository.existsByCodeIgnoreCase(couponCode)) {
                    couponCode = "PRIV-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
                }

                Coupon coupon = Coupon.builder()
                        .code(couponCode)
                        .description("AGVIA Store Privilege Credit (+5% VIP Bonus) for Return #" + returnRequest.getReturnNumber())
                        .discountType(DiscountType.FLAT)
                        .discountValue(totalCredit)
                        .minOrderAmount(BigDecimal.ZERO)
                        .usageLimit(1)
                        .usedCount(0)
                        .active(true)
                        .validFrom(LocalDateTime.now())
                        .validTo(LocalDateTime.now().plusMonths(12))
                        .build();

                couponRepository.save(coupon);
                returnRequest.setCreditCouponCode(couponCode);
                log.info("[STORE_CREDIT_ISSUED] Issued voucher {} of value ₹{} for return {}", couponCode, totalCredit, returnRequest.getReturnNumber());
            }
        }

        ReturnRequest updated = returnRequestRepository.save(returnRequest);
        log.info("[RETURN_DECISION_UPDATED] Return {} status updated to {}", updated.getReturnNumber(), updated.getStatus());
        return toResponse(updated);
    }

    public ReturnRequestResponse toResponse(ReturnRequest req) {
        List<String> images = Collections.emptyList();
        if (req.getImagesJson() != null && !req.getImagesJson().isBlank()) {
            try {
                images = objectMapper.readValue(req.getImagesJson(), new TypeReference<List<String>>() {});
            } catch (Exception ignored) {}
        }

        String orderItemName = null;
        String orderItemSku = null;
        String orderItemImageUrl = null;
        BigDecimal orderItemPrice = null;
        Integer orderItemQuantity = null;

        if (req.getOrderItem() != null) {
            orderItemName = req.getOrderItem().getProductName();
            orderItemSku = req.getOrderItem().getSku();
            orderItemImageUrl = req.getOrderItem().getImageUrl();
            orderItemPrice = req.getOrderItem().getPrice();
            orderItemQuantity = req.getOrderItem().getQuantity();
        }

        return ReturnRequestResponse.builder()
                .id(req.getId())
                .returnNumber(req.getReturnNumber())
                .orderId(req.getOrder() != null ? req.getOrder().getId() : null)
                .orderNumber(req.getOrder() != null ? req.getOrder().getOrderNumber() : null)
                .userId(req.getUser() != null ? req.getUser().getId() : null)
                .userName(req.getUser() != null ? req.getUser().getFullName() : null)
                .userEmail(req.getUser() != null ? req.getUser().getEmail() : null)
                .orderItemId(req.getOrderItem() != null ? req.getOrderItem().getId() : null)
                .orderItemName(orderItemName)
                .orderItemSku(orderItemSku)
                .orderItemImageUrl(orderItemImageUrl)
                .orderItemPrice(orderItemPrice)
                .orderItemQuantity(orderItemQuantity)
                .type(req.getType() != null ? req.getType().name() : null)
                .reason(req.getReason() != null ? req.getReason().name() : null)
                .resolution(req.getResolution() != null ? req.getResolution().name() : null)
                .status(req.getStatus() != null ? req.getStatus().name() : null)
                .targetSize(req.getTargetSize())
                .targetColor(req.getTargetColor())
                .targetVariantId(req.getTargetVariantId())
                .customerNotes(req.getCustomerNotes())
                .images(images)
                .bankDetails(req.getBankDetails())
                .pickupAddress(req.getPickupAddress())
                .reverseCourierPartner(req.getReverseCourierPartner())
                .reverseTrackingNumber(req.getReverseTrackingNumber())
                .creditCouponCode(req.getCreditCouponCode())
                .refundAmount(req.getRefundAmount())
                .adminNotes(req.getAdminNotes())
                .createdAt(req.getCreatedAt())
                .updatedAt(req.getUpdatedAt())
                .build();
    }
}
