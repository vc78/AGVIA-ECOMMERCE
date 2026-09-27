package com.ems.pragathisweets.service;

import com.ems.pragathisweets.dto.ReviewRequest;
import com.ems.pragathisweets.dto.ReviewResponse;
import com.ems.pragathisweets.entity.Product;
import com.ems.pragathisweets.entity.Review;
import com.ems.pragathisweets.entity.User;
import com.ems.pragathisweets.exception.DuplicateResourceException;
import com.ems.pragathisweets.exception.ProductNotFoundException;
import com.ems.pragathisweets.exception.ResourceNotFoundException;
import com.ems.pragathisweets.repository.ProductRepository;
import com.ems.pragathisweets.repository.ReviewRepository;
import com.ems.pragathisweets.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public Page<ReviewResponse> getByProduct(Long productId, Pageable pageable) {
        return reviewRepository.findByProductId(productId, pageable).map(this::toResponse);
    }

    @Transactional
    public ReviewResponse addReview(Long userId, ReviewRequest request) {
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ProductNotFoundException(request.getProductId()));

        User user = null;
        String patronName = request.getCustomerName() != null && !request.getCustomerName().isBlank()
                ? request.getCustomerName().trim()
                : "Valued Patron";

        if (userId != null) {
            user = userRepository.findById(userId).orElse(null);
            if (user != null && user.getFullName() != null && !user.getFullName().isBlank()) {
                patronName = user.getFullName();
            }
        }

        Review review = Review.builder()
                .product(product)
                .user(user)
                .customerName(patronName)
                .rating(request.getRating())
                .comment(request.getComment())
                .verifiedPurchase(true)
                .build();

        Review saved = reviewRepository.save(review);
        recalculateProductRating(product);

        return toResponse(saved);
    }

    @Transactional
    public void deleteReview(Long userId, Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found with id: " + reviewId));

        if (!review.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("You can only delete your own reviews");
        }

        Product product = review.getProduct();
        reviewRepository.delete(review);
        recalculateProductRating(product);
    }

    private void recalculateProductRating(Product product) {
        var reviews = reviewRepository.findByProductId(product.getId(),
                org.springframework.data.domain.Pageable.unpaged()).getContent();

        double avg = reviews.stream().mapToInt(Review::getRating).average().orElse(0.0);
        product.setAvgRating(Math.round(avg * 10.0) / 10.0);
        product.setNumReviews(reviews.size());
        productRepository.save(product);
    }

    @Transactional(readOnly = true)
    public Page<ReviewResponse> getAllReviews(Pageable pageable) {
        return reviewRepository.findAll(pageable).map(this::toResponse);
    }

    @Transactional
    public void deleteReviewAdmin(Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found with id: " + reviewId));
        Product product = review.getProduct();
        reviewRepository.delete(review);
        recalculateProductRating(product);
    }

    private ReviewResponse toResponse(Review review) {
        String name = "Valued Patron";
        if (review.getCustomerName() != null && !review.getCustomerName().isBlank()) {
            name = review.getCustomerName();
        } else if (review.getUser() != null && review.getUser().getFullName() != null && !review.getUser().getFullName().isBlank()) {
            name = review.getUser().getFullName();
        }
        return ReviewResponse.builder()
                .id(review.getId())
                .productId(review.getProduct() != null ? review.getProduct().getId() : null)
                .productName(review.getProduct() != null ? review.getProduct().getName() : null)
                .userId(review.getUser() != null ? review.getUser().getId() : null)
                .userName(name)
                .customerName(name)
                .verifiedPurchase(review.getVerifiedPurchase() != null ? review.getVerifiedPurchase() : true)
                .rating(review.getRating())
                .comment(review.getComment())
                .createdAt(review.getCreatedAt())
                .build();
    }
}
