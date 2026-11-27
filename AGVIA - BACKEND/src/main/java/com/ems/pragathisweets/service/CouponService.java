package com.ems.pragathisweets.service;

import com.ems.pragathisweets.dto.CouponRequest;
import com.ems.pragathisweets.dto.CouponResponse;
import com.ems.pragathisweets.dto.CouponValidationResponse;
import com.ems.pragathisweets.entity.Coupon;
import com.ems.pragathisweets.entity.DiscountType;
import com.ems.pragathisweets.exception.DuplicateResourceException;
import com.ems.pragathisweets.exception.InvalidCouponException;
import com.ems.pragathisweets.exception.ResourceNotFoundException;
import com.ems.pragathisweets.repository.CouponRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CouponService {

    private final CouponRepository couponRepository;
    private final com.ems.pragathisweets.repository.SubscriberRepository subscriberRepository;

    @Transactional(readOnly = true)
    public List<CouponResponse> getAll() {
        return couponRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<CouponResponse> getActiveCoupons() {
        return couponRepository.findByActiveTrue().stream()
                .filter(Coupon::isCurrentlyValid)
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public CouponResponse toggleStatus(Long id) {
        Coupon coupon = findEntity(id);
        coupon.setActive(!coupon.isActive());
        return toResponse(couponRepository.save(coupon));
    }

    @Transactional(readOnly = true)
    public CouponResponse getById(Long id) {
        return toResponse(findEntity(id));
    }

    @Transactional
    public CouponResponse create(CouponRequest request) {
        if (couponRepository.existsByCodeIgnoreCase(request.getCode())) {
            throw new DuplicateResourceException("Coupon code already exists: " + request.getCode());
        }
        Coupon coupon = Coupon.builder()
                .code(request.getCode().toUpperCase())
                .description(request.getDescription())
                .discountType(DiscountType.valueOf(request.getDiscountType().toUpperCase()))
                .discountValue(request.getDiscountValue())
                .minOrderAmount(request.getMinOrderAmount() != null ? request.getMinOrderAmount() : BigDecimal.ZERO)
                .maxDiscountAmount(request.getMaxDiscountAmount())
                .validFrom(request.getValidFrom())
                .validTo(request.getValidTo())
                .usageLimit(request.getUsageLimit())
                .usedCount(0)
                .active(request.getActive() == null || request.getActive())
                .build();
        return toResponse(couponRepository.save(coupon));
    }

    @Transactional
    public CouponResponse update(Long id, CouponRequest request) {
        Coupon coupon = findEntity(id);

        if (!coupon.getCode().equalsIgnoreCase(request.getCode())
                && couponRepository.existsByCodeIgnoreCase(request.getCode())) {
            throw new DuplicateResourceException("Coupon code already exists: " + request.getCode());
        }

        coupon.setCode(request.getCode().toUpperCase());
        coupon.setDescription(request.getDescription());
        coupon.setDiscountType(DiscountType.valueOf(request.getDiscountType().toUpperCase()));
        coupon.setDiscountValue(request.getDiscountValue());
        coupon.setMinOrderAmount(request.getMinOrderAmount() != null ? request.getMinOrderAmount() : BigDecimal.ZERO);
        coupon.setMaxDiscountAmount(request.getMaxDiscountAmount());
        coupon.setValidFrom(request.getValidFrom());
        coupon.setValidTo(request.getValidTo());
        coupon.setUsageLimit(request.getUsageLimit());
        if (request.getActive() != null) {
            coupon.setActive(request.getActive());
        }

        return toResponse(couponRepository.save(coupon));
    }

    @Transactional
    public void delete(Long id) {
        Coupon coupon = findEntity(id);
        coupon.setActive(false);
        couponRepository.save(coupon);
    }

    @Transactional
    public CouponValidationResponse validate(String code, BigDecimal orderAmount) {
        if (code == null || code.trim().isEmpty()) {
            return CouponValidationResponse.builder()
                    .valid(false)
                    .message("Please enter a coupon code")
                    .code(code)
                    .build();
        }

        String cleanCode = code.trim().toUpperCase();
        Coupon coupon = couponRepository.findByCodeIgnoreCase(cleanCode)
                .orElseGet(() -> autoProvisionKnownCoupon(cleanCode));

        if (coupon == null) {
            return CouponValidationResponse.builder()
                    .valid(false)
                    .message("Invalid coupon code")
                    .code(cleanCode)
                    .build();
        }

        if (!coupon.isCurrentlyValid()) {
            return CouponValidationResponse.builder()
                    .valid(false)
                    .message("Coupon has expired or is no longer active")
                    .code(coupon.getCode())
                    .build();
        }

        if (orderAmount != null && coupon.getMinOrderAmount() != null 
                && orderAmount.compareTo(coupon.getMinOrderAmount()) < 0) {
            return CouponValidationResponse.builder()
                    .valid(false)
                    .message("Minimum order amount of " + coupon.getMinOrderAmount() + " required")
                    .code(coupon.getCode())
                    .build();
        }

        BigDecimal discount = calculateDiscount(coupon, orderAmount != null ? orderAmount : BigDecimal.ZERO);
        BigDecimal base = orderAmount != null ? orderAmount : BigDecimal.ZERO;
        BigDecimal finalAmount = base.subtract(discount).setScale(2, RoundingMode.HALF_UP);

        return CouponValidationResponse.builder()
                .valid(true)
                .message("Coupon applied successfully")
                .code(coupon.getCode())
                .discountAmount(discount)
                .finalAmount(finalAmount)
                .build();
    }

    /**
     * Applies the coupon and increments usage. Throws if the coupon cannot be applied.
     * Used internally during checkout.
     */
    @Transactional
    public BigDecimal applyCoupon(String code, BigDecimal orderAmount) {
        if (code == null || code.trim().isEmpty()) {
            throw new InvalidCouponException("Please provide a valid coupon code");
        }

        String cleanCode = code.trim().toUpperCase();
        Coupon coupon = couponRepository.findByCodeIgnoreCase(cleanCode)
                .orElseGet(() -> autoProvisionKnownCoupon(cleanCode));

        if (coupon == null) {
            throw new InvalidCouponException("Invalid coupon code: " + code);
        }

        if (!coupon.isCurrentlyValid()) {
            throw new InvalidCouponException("Coupon has expired or is no longer active");
        }

        if (orderAmount != null && coupon.getMinOrderAmount() != null 
                && orderAmount.compareTo(coupon.getMinOrderAmount()) < 0) {
            throw new InvalidCouponException("Minimum order amount of " + coupon.getMinOrderAmount() + " required for this coupon");
        }

        BigDecimal discount = calculateDiscount(coupon, orderAmount != null ? orderAmount : BigDecimal.ZERO);

        coupon.setUsedCount(coupon.getUsedCount() + 1);
        couponRepository.save(coupon);

        return discount;
    }

    private Coupon autoProvisionKnownCoupon(String code) {
        if (code == null || code.isBlank()) return null;
        String upper = code.trim().toUpperCase();

        // 1. Known VIP, Subscription, and Storewide Coupons
        if ("CIRCLE15".equals(upper)) {
            return saveAutoCoupon(upper, "AGVIA Haute Circle VIP 15% Boutique Credit", DiscountType.PERCENTAGE, new BigDecimal("15.00"), BigDecimal.ZERO, new BigDecimal("2000.00"));
        }
        if ("AGVIAVIP10".equals(upper)) {
            return saveAutoCoupon(upper, "Exclusive VIP 10% Boutique Discount", DiscountType.PERCENTAGE, new BigDecimal("10.00"), BigDecimal.ZERO, new BigDecimal("2000.00"));
        }
        if ("AGVIA15".equals(upper)) {
            return saveAutoCoupon(upper, "VIP Welcome Voucher 15% Boutique Credit", DiscountType.PERCENTAGE, new BigDecimal("15.00"), BigDecimal.ZERO, new BigDecimal("2000.00"));
        }
        if ("AGVIA10".equals(upper)) {
            return saveAutoCoupon(upper, "Special 10% Storewide Boutique Discount", DiscountType.PERCENTAGE, new BigDecimal("10.00"), BigDecimal.ZERO, new BigDecimal("1500.00"));
        }
        if ("WELCOME10".equals(upper)) {
            return saveAutoCoupon(upper, "Welcome 10% Off on First Boutique Purchase", DiscountType.PERCENTAGE, new BigDecimal("10.00"), BigDecimal.ZERO, new BigDecimal("1000.00"));
        }
        if ("FIRST50".equals(upper)) {
            return saveAutoCoupon(upper, "₹50 Flat Credit on Debut Order", DiscountType.FLAT, new BigDecimal("50.00"), new BigDecimal("299.00"), new BigDecimal("50.00"));
        }
        if ("AZADI15".equals(upper)) {
            return saveAutoCoupon(upper, "15% Off Independence Celebration Offer", DiscountType.PERCENTAGE, new BigDecimal("15.00"), new BigDecimal("499.00"), new BigDecimal("2000.00"));
        }
        if ("RAKHI200".equals(upper)) {
            return saveAutoCoupon(upper, "₹200 Off Raksha Bandhan Delight", DiscountType.FLAT, new BigDecimal("200.00"), new BigDecimal("999.00"), new BigDecimal("200.00"));
        }
        if ("DIWALI2025".equals(upper)) {
            return saveAutoCoupon(upper, "25% Off Corporate Grandeur Bulk Order", DiscountType.PERCENTAGE, new BigDecimal("25.00"), new BigDecimal("1499.00"), new BigDecimal("3000.00"));
        }

        // 2. Check if any subscriber has this coupon code
        if (subscriberRepository != null) {
            try {
                var subs = subscriberRepository.findByCouponCodeIgnoreCase(upper);
                if (subs != null && !subs.isEmpty()) {
                    var sub = subs.get(0);
                    BigDecimal pct = sub.getDiscountPercent() != null ? BigDecimal.valueOf(sub.getDiscountPercent()) : new BigDecimal("15.00");
                    return saveAutoCoupon(upper, "Subscriber VIP Privilege Code", DiscountType.PERCENTAGE, pct, BigDecimal.ZERO, new BigDecimal("2000.00"));
                }
            } catch (Exception ignored) {
            }
        }

        return null;
    }

    private Coupon saveAutoCoupon(String code, String desc, DiscountType type, BigDecimal value, BigDecimal minOrder, BigDecimal maxDiscount) {
        try {
            Coupon coupon = Coupon.builder()
                    .code(code)
                    .description(desc)
                    .discountType(type)
                    .discountValue(value)
                    .minOrderAmount(minOrder != null ? minOrder : BigDecimal.ZERO)
                    .maxDiscountAmount(maxDiscount)
                    .validFrom(java.time.LocalDateTime.now().minusDays(1))
                    .validTo(java.time.LocalDateTime.now().plusYears(5))
                    .usageLimit(10000)
                    .usedCount(0)
                    .active(true)
                    .build();
            return couponRepository.save(coupon);
        } catch (Exception ex) {
            return couponRepository.findByCodeIgnoreCase(code).orElse(null);
        }
    }

    private BigDecimal calculateDiscount(Coupon coupon, BigDecimal orderAmount) {
        BigDecimal discount;
        if (coupon.getDiscountType() == DiscountType.PERCENTAGE) {
            discount = orderAmount.multiply(coupon.getDiscountValue()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            if (coupon.getMaxDiscountAmount() != null && discount.compareTo(coupon.getMaxDiscountAmount()) > 0) {
                discount = coupon.getMaxDiscountAmount();
            }
        } else {
            discount = coupon.getDiscountValue();
        }
        if (discount.compareTo(orderAmount) > 0) {
            discount = orderAmount;
        }
        return discount;
    }

    private Coupon findEntity(Long id) {
        return couponRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon not found with id: " + id));
    }

    private CouponResponse toResponse(Coupon coupon) {
        return CouponResponse.builder()
                .id(coupon.getId())
                .code(coupon.getCode())
                .description(coupon.getDescription())
                .discountType(coupon.getDiscountType().name())
                .discountValue(coupon.getDiscountValue())
                .minOrderAmount(coupon.getMinOrderAmount())
                .maxDiscountAmount(coupon.getMaxDiscountAmount())
                .validFrom(coupon.getValidFrom())
                .validTo(coupon.getValidTo())
                .usageLimit(coupon.getUsageLimit())
                .usedCount(coupon.getUsedCount())
                .active(coupon.isActive())
                .currentlyValid(coupon.isCurrentlyValid())
                .build();
    }
}
