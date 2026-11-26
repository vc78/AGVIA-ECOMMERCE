package com.ems.pragathisweets.controller;

import com.ems.pragathisweets.dto.ApiResponse;
import com.ems.pragathisweets.dto.PaymentOrderResponse;
import com.ems.pragathisweets.dto.PaymentVerificationRequest;
import com.ems.pragathisweets.security.UserDetailsImpl;
import com.ems.pragathisweets.service.PaymentService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Tag(name = "Payments", description = "Authenticated Razorpay order creation, verification, and verified webhooks")
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/razorpay/create/{orderNumber}")
    public ResponseEntity<ApiResponse<PaymentOrderResponse>> createRazorpayOrder(
            @AuthenticationPrincipal UserDetailsImpl principal,
            @PathVariable String orderNumber) {
        if (principal == null) {
            throw new AccessDeniedException("Authentication required to initiate payment.");
        }
        boolean isAdmin = hasAdminRole(principal);
        PaymentOrderResponse response = paymentService.createRazorpayOrder(orderNumber, principal.getId(), isAdmin);
        return ResponseEntity.ok(ApiResponse.success("Razorpay order created", response));
    }

    @PostMapping("/razorpay/verify")
    public ResponseEntity<ApiResponse<Void>> verifyPayment(
            @AuthenticationPrincipal UserDetailsImpl principal,
            @Valid @RequestBody PaymentVerificationRequest request) {
        if (principal == null) {
            throw new AccessDeniedException("Authentication required to verify payment.");
        }
        boolean isAdmin = hasAdminRole(principal);
        paymentService.verifyPayment(request, principal.getId(), isAdmin);
        return ResponseEntity.ok(ApiResponse.success("Payment verified successfully", null));
    }

    @PostMapping("/webhook")
    public ResponseEntity<String> handleWebhook(
            @RequestBody String payload,
            @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature) {
        paymentService.handleWebhook(payload, signature);
        return ResponseEntity.ok("ok");
    }

    private boolean hasAdminRole(UserDetailsImpl principal) {
        return principal.getAuthorities() != null &&
                principal.getAuthorities().stream().anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
    }
}
