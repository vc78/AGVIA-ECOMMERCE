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
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/subscriptions")
@RequiredArgsConstructor
@Tag(name = "Subscriptions", description = "Authenticated customer membership orders and verified payment activation")
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    @PostMapping("/create-order")
    public ResponseEntity<ApiResponse<SubscriptionResponse>> createOrder(
            @AuthenticationPrincipal UserDetailsImpl principal,
            @Valid @RequestBody SubscriptionOrderRequest request) {
        if (principal == null) {
            throw new AccessDeniedException("Authentication required to create a membership order.");
        }
        SubscriptionResponse response = subscriptionService.createSubscriptionOrder(principal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Subscription order created", response));
    }

    @PostMapping("/verify-payment")
    public ResponseEntity<ApiResponse<SubscriptionResponse>> verifyPayment(
            @AuthenticationPrincipal UserDetailsImpl principal,
            @Valid @RequestBody SubscriptionVerifyRequest request) {
        if (principal == null) {
            throw new AccessDeniedException("Authentication required to verify membership payment.");
        }
        SubscriptionResponse response = subscriptionService.verifyAndActivate(principal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Membership activated successfully!", response));
    }

    @PostMapping("/activate-instant")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<SubscriptionResponse>> activateInstant(
            @RequestBody SubscriptionOrderRequest request) {
        SubscriptionResponse response = subscriptionService.activateInstant(
                null, request.getEmail(), request.getCustomerName(), request.getCustomerPhone());
        return ResponseEntity.ok(ApiResponse.success("Membership granted by administrator", response));
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
