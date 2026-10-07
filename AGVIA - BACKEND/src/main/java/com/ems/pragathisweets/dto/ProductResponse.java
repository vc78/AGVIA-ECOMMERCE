package com.ems.pragathisweets.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@AllArgsConstructor
public class ProductResponse {

    private Long id;
    private String name;
    private String description;
    private String sku;
    private BigDecimal price;
    private BigDecimal discountPrice;
    private BigDecimal effectivePrice;
    private Integer stockQuantity;
    private String unit;
    private String imageUrl;
    private Long categoryId;
    private String categoryName;
    private boolean active;
    private boolean bestseller;
    private Double avgRating;
    private Integer numReviews;
    private boolean inStock;
    private com.ems.pragathisweets.entity.ProductPaymentOption paymentOption;
    private Integer lowStockThreshold;
    private String stockStatus;
    private boolean codAllowed;
    private boolean onlineAllowed;
    private boolean hasVariants;
    private java.util.List<ProductVariantResponse> variants;
    private LocalDateTime createdAt;
}
