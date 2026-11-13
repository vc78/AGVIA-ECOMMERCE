package com.ems.pragathisweets.controller;

import com.ems.pragathisweets.dto.ApiResponse;
import com.ems.pragathisweets.dto.CreateReturnRequest;
import com.ems.pragathisweets.dto.ReturnRequestResponse;
import com.ems.pragathisweets.security.UserDetailsImpl;
import com.ems.pragathisweets.service.ReturnService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/returns")
@RequiredArgsConstructor
public class ReturnController {

    private final ReturnService returnService;

    @PostMapping
    public ResponseEntity<ApiResponse<ReturnRequestResponse>> createReturn(
            @AuthenticationPrincipal UserDetailsImpl principal,
            @Valid @RequestBody CreateReturnRequest request) {
        if (principal == null) {
            throw new AccessDeniedException("Please sign in to submit a return or exchange request.");
        }
        ReturnRequestResponse response = returnService.createReturnRequest(principal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Your return/exchange request has been received. Our concierge team is reviewing it.", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ReturnRequestResponse>>> getMyReturns(
            @AuthenticationPrincipal UserDetailsImpl principal) {
        if (principal == null) {
            throw new AccessDeniedException("Please sign in to view your return requests.");
        }
        List<ReturnRequestResponse> responses = returnService.getUserReturns(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/order/{orderId}")
    public ResponseEntity<ApiResponse<List<ReturnRequestResponse>>> getOrderReturns(
            @AuthenticationPrincipal UserDetailsImpl principal,
            @PathVariable Long orderId) {
        if (principal == null) {
            throw new AccessDeniedException("Please sign in to view your return requests.");
        }
        List<ReturnRequestResponse> responses = returnService.getOrderReturns(principal.getId(), orderId);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ReturnRequestResponse>> getReturn(
            @AuthenticationPrincipal UserDetailsImpl principal,
            @PathVariable Long id) {
        if (principal == null) {
            throw new AccessDeniedException("Please sign in to view your return request.");
        }
        ReturnRequestResponse response = returnService.getReturnById(id);
        if (response.getUserId() == null || !response.getUserId().equals(principal.getId())) {
            throw new AccessDeniedException("You do not have permission to view this return request.");
        }
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
