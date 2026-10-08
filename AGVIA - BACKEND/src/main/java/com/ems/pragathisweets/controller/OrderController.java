package com.ems.pragathisweets.controller;

import com.ems.pragathisweets.dto.ApiResponse;
import com.ems.pragathisweets.dto.CheckoutRequest;
import com.ems.pragathisweets.dto.OrderResponse;
import com.ems.pragathisweets.security.UserDetailsImpl;
import com.ems.pragathisweets.service.OrderService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@Tag(name = "Orders", description = "Checkout and order history for the authenticated user")
public class OrderController {

    private final OrderService orderService;

    @PostMapping("/validate")
    public ResponseEntity<ApiResponse<com.ems.pragathisweets.dto.CheckoutValidationResponse>> validateCheckout(
            @AuthenticationPrincipal UserDetailsImpl principal,
            @RequestBody(required = false) com.ems.pragathisweets.dto.CheckoutValidationRequest request) {
        Long userId = principal != null ? principal.getId() : null;
        var response = orderService.validateCheckout(userId, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/checkout")
    public ResponseEntity<ApiResponse<OrderResponse>> checkout(@AuthenticationPrincipal UserDetailsImpl principal,
                                                                @Valid @RequestBody CheckoutRequest request) {
        OrderResponse response = orderService.checkout(principal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Order placed successfully", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<OrderResponse>>> getMyOrders(
            @AuthenticationPrincipal UserDetailsImpl principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(ApiResponse.success(orderService.getUserOrders(principal.getId(), pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OrderResponse>> getMyOrder(@AuthenticationPrincipal UserDetailsImpl principal,
                                                                  @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(orderService.getUserOrder(principal.getId(), id)));
    }


    @GetMapping("/track/{identifier}")
    public ResponseEntity<ApiResponse<OrderResponse>> trackOrder(@PathVariable String identifier) {
        return ResponseEntity.ok(ApiResponse.success("Order retrieved successfully", orderService.trackOrder(identifier)));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<OrderResponse>> cancelOrder(@AuthenticationPrincipal UserDetailsImpl principal,
                                                                   @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Order cancelled", orderService.cancelOrder(principal.getId(), id)));
    }
}
