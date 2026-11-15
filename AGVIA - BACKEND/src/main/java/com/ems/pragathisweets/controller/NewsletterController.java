package com.ems.pragathisweets.controller;

import com.ems.pragathisweets.dto.ApiResponse;
import com.ems.pragathisweets.entity.Subscriber;
import com.ems.pragathisweets.repository.SubscriberRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

@RestController
@RequestMapping("/api/newsletter")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Newsletter & VIP Circle", description = "Endpoints for customer subscription and circle privileges")
public class NewsletterController {

    private final SubscriberRepository subscriberRepository;
    private final com.ems.pragathisweets.repository.CouponRepository couponRepository;

    private static final List<String> CIRCLE_BENEFITS = List.of(
            "15% Boutique Credit on your first designer order",
            "Complimentary Royal Keepsake Gift Wrapping with gold satin ribbon",
            "Guaranteed priority same-day dispatch during festive peaks",
            "Exclusive invitations to private couture showcases and atelier previews"
    );

    @PostMapping("/subscribe")
    @Operation(summary = "Subscribe to AGVIA Haute Circle", description = "Subscribes email, activates VIP perks, and returns an exclusive coupon code with validity")
    public ResponseEntity<ApiResponse<Map<String, Object>>> subscribe(@RequestBody Map<String, String> request) {
        String rawEmail = request.get("email");
        if (rawEmail == null || rawEmail.trim().isEmpty() || !rawEmail.contains("@")) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Please enter a valid email address."));
        }

        String email = rawEmail.trim().toLowerCase();
        Optional<Subscriber> existingOpt = subscriberRepository.findByEmailIgnoreCase(email);

        Subscriber subscriber;
        boolean alreadySubscribed = false;

        if (existingOpt.isPresent()) {
            subscriber = existingOpt.get();
            alreadySubscribed = true;
            log.info("Existing AGVIA Haute Circle subscriber requested perks: {}", email);
        } else {
            subscriber = Subscriber.builder()
                    .email(email)
                    .couponCode("CIRCLE15")
                    .discountPercent(15)
                    .subscribedAt(LocalDateTime.now())
                    .validTill(LocalDateTime.now().plusDays(30))
                    .active(true)
                    .build();
            subscriber = subscriberRepository.save(subscriber);
            log.info("New AGVIA Haute Circle subscriber enrolled: {}", email);
        }

        // Ensure CIRCLE15 exists in coupons repository
        if (couponRepository != null && !couponRepository.existsByCodeIgnoreCase("CIRCLE15")) {
            try {
                couponRepository.save(com.ems.pragathisweets.entity.Coupon.builder()
                        .code("CIRCLE15")
                        .description("AGVIA Haute Circle VIP 15% Boutique Credit")
                        .discountType(com.ems.pragathisweets.entity.DiscountType.PERCENTAGE)
                        .discountValue(new java.math.BigDecimal("15.00"))
                        .minOrderAmount(java.math.BigDecimal.ZERO)
                        .maxDiscountAmount(new java.math.BigDecimal("2000.00"))
                        .validFrom(LocalDateTime.now().minusDays(1))
                        .validTo(LocalDateTime.now().plusYears(5))
                        .usageLimit(10000)
                        .usedCount(0)
                        .active(true)
                        .build());
            } catch (Exception ex) {
                log.warn("Coupon CIRCLE15 auto-provision skipped: {}", ex.getMessage());
            }
        }

        long daysRemaining = Math.max(0, ChronoUnit.DAYS.between(LocalDateTime.now(), subscriber.getValidTill()));

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("email", subscriber.getEmail());
        data.put("couponCode", subscriber.getCouponCode());
        data.put("discount", subscriber.getDiscountPercent() + "% OFF");
        data.put("validTill", subscriber.getValidTill().toString());
        data.put("daysRemaining", daysRemaining);
        data.put("minOrderAmount", 499);
        data.put("benefits", CIRCLE_BENEFITS);
        data.put("alreadySubscribed", alreadySubscribed);

        String message = alreadySubscribed
                ? "Welcome back, AGVIA Haute Circle VIP! Your privileges and coupon are active."
                : "Welcome to the AGVIA Haute Circle! Your VIP perks & 15% code are now unlocked.";

        return ResponseEntity.ok(ApiResponse.success(message, data));
    }

    @GetMapping("/status")
    @Operation(summary = "Check subscription status", description = "Inspects if an email is an enrolled Circle member")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkStatus(@RequestParam String email) {
        Optional<Subscriber> subscriberOpt = subscriberRepository.findByEmailIgnoreCase(email.trim().toLowerCase());
        if (subscriberOpt.isEmpty()) {
            return ResponseEntity.ok(ApiResponse.success("Not subscribed", Map.of("subscribed", false)));
        }

        Subscriber subscriber = subscriberOpt.get();
        long daysRemaining = Math.max(0, ChronoUnit.DAYS.between(LocalDateTime.now(), subscriber.getValidTill()));

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("subscribed", true);
        data.put("email", subscriber.getEmail());
        data.put("couponCode", subscriber.getCouponCode());
        data.put("discount", subscriber.getDiscountPercent() + "% OFF");
        data.put("validTill", subscriber.getValidTill().toString());
        data.put("daysRemaining", daysRemaining);
        data.put("benefits", CIRCLE_BENEFITS);

        return ResponseEntity.ok(ApiResponse.success("Subscriber verified", data));
    }
}
