package com.ems.pragathisweets.controller;

import com.ems.pragathisweets.dto.ApiResponse;
import com.ems.pragathisweets.dto.ReviewRequest;
import com.ems.pragathisweets.dto.ReviewResponse;
import com.ems.pragathisweets.security.UserDetailsImpl;
import com.ems.pragathisweets.service.ReviewService;
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
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
@Tag(name = "Reviews", description = "Product reviews")
public class ReviewController {

    private final ReviewService reviewService;

    @GetMapping("/product/{productId}")
    public ResponseEntity<ApiResponse<Page<ReviewResponse>>> getByProduct(
            @PathVariable Long productId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(ApiResponse.success(reviewService.getByProduct(productId, pageable)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ReviewResponse>> addReview(
            @AuthenticationPrincipal UserDetailsImpl principal,
            @Valid @RequestBody ReviewRequest request) {
        Long userId = principal != null ? principal.getId() : null;
        ReviewResponse response = reviewService.addReview(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Review added successfully", response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteReview(@AuthenticationPrincipal UserDetailsImpl principal,
                                                           @PathVariable Long id) {
        if (principal == null) {
            throw new org.springframework.security.access.AccessDeniedException("Authentication required to delete a review");
        }
        boolean isAdmin = principal.getAuthorities() != null &&
                principal.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        reviewService.deleteReview(principal.getId(), id, isAdmin);
        return ResponseEntity.ok(ApiResponse.success("Review deleted successfully", null));
    }
}
