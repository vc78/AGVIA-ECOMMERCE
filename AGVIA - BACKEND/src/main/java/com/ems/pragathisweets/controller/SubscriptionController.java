package com.ems.pragathisweets.controller;

import com.ems.pragathisweets.dto.ApiResponse;
import com.ems.pragathisweets.dto.SubscriptionOrderRequest;
import com.ems.pragathisweets.dto.SubscriptionResponse;
import com.ems.pragathisweets.dto.SubscriptionVerifyRequest;
import com.ems.pragathisweets.security.UserDetailsImpl;
import com.ems.pragathisweets.service.SubscriptionService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/subscriptions")
@RequiredArgsConstructor
@Tag(name = "Subscriptions", description = "Customer VIP subscription orders and payment activation")
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    @PostMapping("/create-order")
    public ResponseEntity<ApiResponse<SubscriptionResponse>> createOrder(
            @AuthenticationPrincipal UserDetailsImpl principal,
            @Valid @RequestBody SubscriptionOrderRequest request) {

        Long userId = (principal != null) ? principal.getId() : null;
        SubscriptionResponse response = subscriptionService.createSubscriptionOrder(userId, request);
        return ResponseEntity.ok(ApiResponse.success("Subscription order created", response));
    }

    @PostMapping("/verify-payment")
    public ResponseEntity<ApiResponse<SubscriptionResponse>> verifyPayment(
            @Valid @RequestBody SubscriptionVerifyRequest request) {

        SubscriptionResponse response = subscriptionService.verifyAndActivate(request);
        return ResponseEntity.ok(ApiResponse.success("VIP Membership Activated successfully!", response));
    }

    @PostMapping("/activate-instant")
    public ResponseEntity<ApiResponse<SubscriptionResponse>> activateInstant(
            @AuthenticationPrincipal UserDetailsImpl principal,
            @RequestBody SubscriptionOrderRequest request) {

        Long userId = (principal != null) ? principal.getId() : null;
        String email = request.getEmail();
        if ((email == null || email.isBlank()) && principal != null) {
            email = principal.getEmail();
        }
        SubscriptionResponse response = subscriptionService.activateInstant(
                userId, email, request.getCustomerName(), request.getCustomerPhone());
        return ResponseEntity.ok(ApiResponse.success("VIP Membership Activated successfully!", response));
    }

    @GetMapping("/my-status")
    public ResponseEntity<ApiResponse<SubscriptionResponse>> getMyStatus(
            @AuthenticationPrincipal UserDetailsImpl principal) {

        if (principal == null) {
            return ResponseEntity.ok(ApiResponse.success(null));
        }

        SubscriptionResponse response = subscriptionService.getMySubscription(principal.getId(), principal.getEmail());
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
