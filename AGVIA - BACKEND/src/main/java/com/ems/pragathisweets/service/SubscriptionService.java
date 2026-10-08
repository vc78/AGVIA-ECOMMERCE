package com.ems.pragathisweets.service;

import com.ems.pragathisweets.config.RazorpayConfig;
import com.ems.pragathisweets.dto.SubscriptionOrderRequest;
import com.ems.pragathisweets.dto.SubscriptionResponse;
import com.ems.pragathisweets.dto.SubscriptionVerifyRequest;
import com.ems.pragathisweets.entity.*;
import com.ems.pragathisweets.exception.PaymentVerificationException;
import com.ems.pragathisweets.exception.ResourceNotFoundException;
import com.ems.pragathisweets.repository.SubscriberRepository;
import com.ems.pragathisweets.repository.SubscriptionRepository;
import com.ems.pragathisweets.repository.UserRepository;
import com.razorpay.RazorpayClient;
import com.razorpay.Utils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class SubscriptionService {

    private final SubscriptionRepository subscriptionRepository;
    private final SubscriberRepository subscriberRepository;
    private final com.ems.pragathisweets.repository.CouponRepository couponRepository;
    private final UserRepository userRepository;
    private final RazorpayClient razorpayClient;
    private final RazorpayConfig razorpayConfig;

    private static final BigDecimal DEFAULT_PLAN_AMOUNT = new BigDecimal("299.00");

    /**
     * Prepares a subscription order and initiates a Razorpay transaction.
     */
    @Transactional
    public SubscriptionResponse createSubscriptionOrder(Long userId, SubscriptionOrderRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        User user = null;
        if (userId != null) {
            user = userRepository.findById(userId).orElse(null);
        } else {
            user = userRepository.findByEmail(email).orElse(null);
        }

        String customerName = request.getCustomerName();
        if ((customerName == null || customerName.isBlank()) && user != null) {
            customerName = user.getFullName();
        }
        if (customerName == null || customerName.isBlank()) {
            customerName = email.split("@")[0];
        }

        String phone = request.getCustomerPhone();
        if ((phone == null || phone.isBlank()) && user != null) {
            phone = user.getPhone();
        }

        // Reuse existing pending subscription or create new
        Subscription subscription = subscriptionRepository.findTopByEmailOrderByCreatedAtDesc(email)
                .filter(s -> s.getStatus() == SubscriptionStatus.PENDING_PAYMENT)
                .orElse(null);

        if (subscription == null) {
            subscription = Subscription.builder()
                    .user(user)
                    .email(email)
                    .customerName(customerName)
                    .customerPhone(phone)
                    .planName(request.getPlanName() != null ? request.getPlanName() : "PRAGATHI_CIRCLE_VIP")
                    .planTier("VIP")
                    .amount(DEFAULT_PLAN_AMOUNT)
                    .status(SubscriptionStatus.PENDING_PAYMENT)
                    .paymentMethod(PaymentMethod.RAZORPAY)
                    .paymentStatus(PaymentStatus.PENDING)
                    .exclusiveCoupon("CIRCLE15")
                    .discountPercent(15)
                    .startDate(LocalDateTime.now())
                    .validTill(LocalDateTime.now().plusDays(365))
                    .build();
        } else {
            subscription.setUser(user);
            subscription.setCustomerName(customerName);
            subscription.setCustomerPhone(phone);
        }

        // Create Razorpay Order
        long amountInPaise = DEFAULT_PLAN_AMOUNT.multiply(BigDecimal.valueOf(100)).longValue();
        try {
            JSONObject orderReq = new JSONObject();
            orderReq.put("amount", amountInPaise);
            orderReq.put("currency", "INR");
            orderReq.put("receipt", "SUB_" + System.currentTimeMillis());

            com.razorpay.Order rpOrder = razorpayClient.orders.create(orderReq);
            String rpOrderId = rpOrder.get("id");

            subscription.setRazorpayOrderId(rpOrderId);
            subscription = subscriptionRepository.save(subscription);

            SubscriptionResponse response = toResponse(subscription);
            response.setRazorpayKeyId(razorpayConfig.getKeyId());
            return response;

        } catch (Exception ex) {
            log.warn("Razorpay order creation fallback (offline/sandbox): {}", ex.getMessage());
            // Fallback generation for sandbox/dev
            String mockOrderId = "order_sub_" + System.currentTimeMillis();
            subscription.setRazorpayOrderId(mockOrderId);
            subscription = subscriptionRepository.save(subscription);

            SubscriptionResponse response = toResponse(subscription);
            response.setRazorpayKeyId(razorpayConfig.getKeyId());
            return response;
        }
    }

    /**
     * Verifies payment and activates the subscription in DB.
     */
    @Transactional
    public SubscriptionResponse verifyAndActivate(SubscriptionVerifyRequest request) {
        Subscription subscription = subscriptionRepository.findByRazorpayOrderId(request.getRazorpayOrderId())
                .or(() -> {
                    if (request.getEmail() != null && !request.getEmail().isBlank()) {
                        return subscriptionRepository.findTopByEmailOrderByCreatedAtDesc(request.getEmail().trim().toLowerCase());
                    }
                    return Optional.empty();
                })
                .orElseThrow(() -> new ResourceNotFoundException("Subscription order not found: " + request.getRazorpayOrderId()));

        // Signature verification if real credentials provided
        if (request.getRazorpaySignature() != null && !request.getRazorpaySignature().isBlank()
                && !razorpayConfig.getKeySecret().isBlank()) {
            try {
                JSONObject attributes = new JSONObject();
                attributes.put("razorpay_order_id", request.getRazorpayOrderId());
                attributes.put("razorpay_payment_id", request.getRazorpayPaymentId());
                attributes.put("razorpay_signature", request.getRazorpaySignature());

                boolean isValid = Utils.verifyPaymentSignature(attributes, razorpayConfig.getKeySecret());
                if (!isValid) {
                    log.error("Invalid signature for subscription order {}", request.getRazorpayOrderId());
                    subscription.setPaymentStatus(PaymentStatus.FAILED);
                    subscriptionRepository.save(subscription);
                    throw new PaymentVerificationException("Payment signature verification failed");
                }
            } catch (PaymentVerificationException pve) {
                throw pve;
            } catch (Exception ex) {
                log.warn("Signature verification warning: {}", ex.getMessage());
            }
        }

        // Activate subscription
        subscription.setPaymentId(request.getRazorpayPaymentId());
        subscription.setPaymentStatus(PaymentStatus.SUCCESS);
        subscription.setStatus(SubscriptionStatus.ACTIVE);
        subscription.setStartDate(LocalDateTime.now());
        subscription.setValidTill(LocalDateTime.now().plusDays(365));

        Subscription saved = subscriptionRepository.save(subscription);

        // Sync with Subscriber table
        syncSubscriberEntity(saved);

        return toResponse(saved);
    }

    /**
     * Instant activation for demo or direct VIP upgrade without gateway redirect.
     */
    @Transactional
    public SubscriptionResponse activateInstant(Long userId, String email, String name, String phone) {
        String cleanEmail = email.trim().toLowerCase();

        User user = null;
        if (userId != null) {
            user = userRepository.findById(userId).orElse(null);
        } else {
            user = userRepository.findByEmail(cleanEmail).orElse(null);
        }

        Subscription subscription = subscriptionRepository.findTopByEmailOrderByCreatedAtDesc(cleanEmail)
                .orElse(Subscription.builder()
                        .email(cleanEmail)
                        .planName("PRAGATHI_CIRCLE_VIP")
                        .planTier("VIP")
                        .amount(DEFAULT_PLAN_AMOUNT)
                        .exclusiveCoupon("CIRCLE15")
                        .discountPercent(15)
                        .build());

        subscription.setUser(user);
        subscription.setCustomerName((name != null && !name.isBlank()) ? name : (user != null ? user.getFullName() : cleanEmail.split("@")[0]));
        subscription.setCustomerPhone((phone != null && !phone.isBlank()) ? phone : (user != null ? user.getPhone() : null));
        subscription.setStatus(SubscriptionStatus.ACTIVE);
        subscription.setPaymentMethod(PaymentMethod.RAZORPAY);
        subscription.setPaymentStatus(PaymentStatus.SUCCESS);
        subscription.setPaymentId("PAY_INSTANT_" + System.currentTimeMillis());
        subscription.setStartDate(LocalDateTime.now());
        subscription.setValidTill(LocalDateTime.now().plusDays(365));

        Subscription saved = subscriptionRepository.save(subscription);
        syncSubscriberEntity(saved);

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public SubscriptionResponse getMySubscription(Long userId, String email) {
        Optional<Subscription> sub = Optional.empty();
        if (userId != null) {
            sub = subscriptionRepository.findTopByUserIdOrderByCreatedAtDesc(userId);
        }
        if (sub.isEmpty() && email != null && !email.isBlank()) {
            sub = subscriptionRepository.findTopByEmailOrderByCreatedAtDesc(email.trim().toLowerCase());
        }

        return sub.map(this::toResponse).orElse(null);
    }

    private void syncSubscriberEntity(Subscription sub) {
        try {
            Subscriber subscriber = subscriberRepository.findByEmailIgnoreCase(sub.getEmail())
                    .orElse(Subscriber.builder().email(sub.getEmail()).build());
            subscriber.setActive(true);
            subscriber.setCouponCode(sub.getExclusiveCoupon());
            subscriber.setDiscountPercent(sub.getDiscountPercent());
            subscriber.setValidTill(sub.getValidTill());
            subscriberRepository.save(subscriber);

            // Ensure exclusive coupon is registered in Coupon table
            String code = sub.getExclusiveCoupon() != null ? sub.getExclusiveCoupon().trim().toUpperCase() : "CIRCLE15";
            if (!couponRepository.existsByCodeIgnoreCase(code)) {
                couponRepository.save(com.ems.pragathisweets.entity.Coupon.builder()
                        .code(code)
                        .description("Exclusive AGVIA Haute Circle VIP Member Voucher")
                        .discountType(com.ems.pragathisweets.entity.DiscountType.PERCENTAGE)
                        .discountValue(sub.getDiscountPercent() != null ? BigDecimal.valueOf(sub.getDiscountPercent()) : new BigDecimal("15.00"))
                        .minOrderAmount(BigDecimal.ZERO)
                        .maxDiscountAmount(new BigDecimal("2000.00"))
                        .validFrom(LocalDateTime.now().minusDays(1))
                        .validTo(sub.getValidTill() != null ? sub.getValidTill() : LocalDateTime.now().plusYears(1))
                        .usageLimit(10000)
                        .usedCount(0)
                        .active(true)
                        .build());
            }
        } catch (Exception ex) {
            log.warn("Failed to sync Subscriber entity or coupon: {}", ex.getMessage());
        }
    }

    public SubscriptionResponse toResponse(Subscription s) {
        long daysRemaining = 0;
        if (s.getValidTill() != null && s.getValidTill().isAfter(LocalDateTime.now())) {
            daysRemaining = Duration.between(LocalDateTime.now(), s.getValidTill()).toDays();
        }

        return SubscriptionResponse.builder()
                .id(s.getId())
                .userId(s.getUser() != null ? s.getUser().getId() : null)
                .email(s.getEmail())
                .customerName(s.getCustomerName())
                .customerPhone(s.getCustomerPhone())
                .planName(s.getPlanName())
                .planTier(s.getPlanTier())
                .amount(s.getAmount())
                .status(s.getStatus().name())
                .paymentMethod(s.getPaymentMethod() != null ? s.getPaymentMethod().name() : null)
                .paymentStatus(s.getPaymentStatus() != null ? s.getPaymentStatus().name() : null)
                .paymentId(s.getPaymentId())
                .razorpayOrderId(s.getRazorpayOrderId())
                .exclusiveCoupon(s.getExclusiveCoupon())
                .discountPercent(s.getDiscountPercent())
                .startDate(s.getStartDate())
                .validTill(s.getValidTill())
                .active(s.isCurrentlyActive())
                .daysRemaining(daysRemaining)
                .createdAt(s.getCreatedAt())
                .build();
    }
}
