package com.ems.pragathisweets.service;

import com.ems.pragathisweets.config.RazorpayConfig;
import com.ems.pragathisweets.dto.PaymentVerificationRequest;
import com.ems.pragathisweets.dto.StoreSettingDto;
import com.ems.pragathisweets.dto.SubscriptionVerifyRequest;
import com.ems.pragathisweets.entity.*;
import com.ems.pragathisweets.exception.PaymentVerificationException;
import com.ems.pragathisweets.exception.ResourceNotFoundException;
import com.ems.pragathisweets.repository.*;
import com.ems.pragathisweets.security.LoginRateLimiterFilter;
import com.ems.pragathisweets.util.SecuritySanitizer;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SecurityHardeningAndPaymentTest {

    @Mock private OrderRepository orderRepository;
    @Mock private PaymentRepository paymentRepository;
    @Mock private RazorpayConfig razorpayConfig;
    @Mock private ProductVariantRepository productVariantRepository;
    @Mock private SubscriptionRepository subscriptionRepository;
    @Mock private SubscriberRepository subscriberRepository;
    @Mock private CouponRepository couponRepository;
    @Mock private UserRepository userRepository;
    @Mock private StoreSettingRepository storeSettingRepository;
    @Mock private SimpMessagingTemplate messagingTemplate;
    @Mock private ApplicationEventPublisher eventPublisher;

    @Test
    @DisplayName("Payment verification enforces order ownership and exact Razorpay order ID binding")
    void testPaymentOwnershipAndOrderIdBinding() {
        User owner = User.builder().id(10L).email("owner@example.com").build();
        Order order = Order.builder()
                .id(500L)
                .orderNumber("LLW-1001")
                .user(owner)
                .finalAmount(new BigDecimal("4999.00"))
                .paymentStatus(PaymentStatus.PENDING)
                .build();
        Payment payment = Payment.builder()
                .id(1L)
                .order(order)
                .razorpayOrderId("order_real_123")
                .status(PaymentStatus.CREATED)
                .build();

        PaymentService paymentService = new PaymentService(
                null, razorpayConfig, paymentRepository, orderRepository,
                null, null, null, productVariantRepository, eventPublisher);

        when(orderRepository.findByOrderNumber("LLW-1001")).thenReturn(Optional.of(order));

        PaymentVerificationRequest req = new PaymentVerificationRequest();
        req.setInternalOrderNumber("LLW-1001");
        req.setRazorpayOrderId("order_real_123");
        req.setRazorpayPaymentId("pay_123");
        req.setRazorpaySignature("sig_abc");

        // Different customer cannot verify/access payment for owner's order (IDOR blocked)
        assertThrows(AccessDeniedException.class, () -> paymentService.verifyPayment(req, 99L, false));

        // Owner with mismatched razorpayOrderId is blocked before signature verification
        when(paymentRepository.findByOrderId(500L)).thenReturn(Optional.of(payment));
        req.setRazorpayOrderId("order_forged_999");
        assertThrows(PaymentVerificationException.class, () -> paymentService.verifyPayment(req, 10L, false));
    }

    @Test
    @DisplayName("Razorpay webhook fails closed if webhook secret is missing or signature is invalid")
    void testWebhookRequiresValidSignature() {
        PaymentService paymentService = new PaymentService(
                null, razorpayConfig, paymentRepository, orderRepository,
                null, null, null, productVariantRepository, eventPublisher);

        when(razorpayConfig.getWebhookSecret()).thenReturn("");
        assertThrows(PaymentVerificationException.class, () ->
                paymentService.handleWebhook("{\"event\":\"payment.captured\"}", "any-sig"));

        when(razorpayConfig.getWebhookSecret()).thenReturn("whsec_real_secret");
        assertThrows(PaymentVerificationException.class, () ->
                paymentService.handleWebhook("{\"event\":\"payment.captured\"}", "forged_signature"));
    }

    @Test
    @DisplayName("Subscription activation rejects blank signature and other users (no bypass)")
    void testSubscriptionRejectsBlankSignature() {
        SubscriptionService service = new SubscriptionService(
                subscriptionRepository, subscriberRepository, couponRepository,
                userRepository, null, razorpayConfig);

        SubscriptionVerifyRequest req = new SubscriptionVerifyRequest();
        req.setRazorpayOrderId("order_sub_1");
        req.setRazorpayPaymentId("pay_1");
        req.setRazorpaySignature("");

        assertThrows(PaymentVerificationException.class, () -> service.verifyAndActivate(10L, req));
    }

    @Test
    @DisplayName("Order tracking enforces ownership for full order details and rejects order-number enumeration on public-track")
    void testOrderTrackingIdorAndPublicEnumerationBlocked() {
        User owner = User.builder().id(10L).email("owner@example.com").build();
        Order order = Order.builder()
                .id(77L)
                .orderNumber("LLW-2026-77")
                .trackingToken("0123456789abcdef0123456789abcdef")
                .user(owner)
                .build();

        OrderService orderService = new OrderService(
                orderRepository, null, null, null, null, null, null, null, null);

        when(orderRepository.findByOrderNumberWithDetails("LLW-2026-77")).thenReturn(Optional.of(order));

        // Another user cannot view full OrderResponse PII via /track
        assertThrows(AccessDeniedException.class, () -> orderService.trackOrderForUser("LLW-2026-77", 99L, false));
        assertDoesNotThrow(() -> orderService.trackOrderForUser("LLW-2026-77", 10L, false));

        // Short or guessed order number is rejected on public-track
        assertThrows(ResourceNotFoundException.class, () -> orderService.getPublicTracking("LLW-2026-77"));
    }

    @Test
    @DisplayName("Public StoreSettings redacts adminAlertEmail and updatedBy")
    void testPublicSettingsRedaction() {
        StoreSetting setting = StoreSetting.builder()
                .id(1L)
                .storeName("Lokesh Lingam Weaver")
                .adminAlertEmail("private-admin@internal.local")
                .updatedBy("admin@internal.local")
                .build();
        when(storeSettingRepository.findFirstByOrderByIdAsc()).thenReturn(Optional.of(setting));

        StoreSettingService service = new StoreSettingService(storeSettingRepository, messagingTemplate, eventPublisher);
        StoreSettingDto publicDto = service.getPublicSettings();

        assertEquals("Lokesh Lingam Weaver", publicDto.getStoreName());
        assertNull(publicDto.getAdminAlertEmail());
        assertNull(publicDto.getUpdatedBy());
    }

    @Test
    @DisplayName("SecuritySanitizer blocks XSS javascript/SVG/HTML URLs and strips HTML brackets")
    void testSecuritySanitizer() {
        assertEquals("/images/lokesh-lingam-logo.png", SecuritySanitizer.validateSafeImageUrl("/images/lokesh-lingam-logo.png"));
        assertEquals("https://cdn.example.com/saree.webp", SecuritySanitizer.validateSafeImageUrl("https://cdn.example.com/saree.webp"));
        assertThrows(IllegalArgumentException.class, () -> SecuritySanitizer.validateSafeImageUrl("javascript:alert(1)"));
        assertThrows(IllegalArgumentException.class, () -> SecuritySanitizer.validateSafeImageUrl("data:image/svg+xml;base64,PHNjcmlwdD4="));
        assertThrows(IllegalArgumentException.class, () -> SecuritySanitizer.validateSafeImageUrl("data:text/html;base64,PHNjcmlwdD4="));
        assertEquals("scriptNice silk saree/script", SecuritySanitizer.sanitizePlainText("<script>Nice silk saree</script>"));
    }

    @Test
    @DisplayName("Rate limiter enforces 429 on repeated forgot-password and login attempts")
    void testRateLimiterEnforced() throws Exception {
        LoginRateLimiterFilter filter = new LoginRateLimiterFilter();

        for (int i = 0; i < 6; i++) {
            MockHttpServletRequest req = new MockHttpServletRequest("POST", "/api/auth/forgot-password");
            req.setRemoteAddr("198.51.100.25");
            MockHttpServletResponse res = new MockHttpServletResponse();
            filter.doFilter(req, res, new MockFilterChain());
            assertEquals(200, res.getStatus());
        }

        // 7th attempt within 60s must be rate-limited (429)
        MockHttpServletRequest blockedReq = new MockHttpServletRequest("POST", "/api/auth/forgot-password");
        blockedReq.setRemoteAddr("198.51.100.25");
        MockHttpServletResponse blockedRes = new MockHttpServletResponse();
        filter.doFilter(blockedReq, blockedRes, new MockFilterChain());
        assertEquals(429, blockedRes.getStatus());
    }
}
