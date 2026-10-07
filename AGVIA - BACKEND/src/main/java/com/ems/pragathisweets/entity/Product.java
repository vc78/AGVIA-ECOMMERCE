package com.ems.pragathisweets.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "products", indexes = {
    @Index(name = "idx_products_category_id", columnList = "category_id"),
    @Index(name = "idx_products_active", columnList = "active"),
    @Index(name = "idx_products_cat_active", columnList = "category_id, active"),
    @Index(name = "idx_products_bestseller_active", columnList = "is_bestseller, active")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(length = 2000)
    private String description;

    @Column(name = "sku", unique = true, length = 50)
    private String sku;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(name = "discount_price", precision = 10, scale = 2)
    private BigDecimal discountPrice;

    @Column(name = "stock_quantity", nullable = false)
    @Builder.Default
    private Integer stockQuantity = 0;

    @Column(name = "low_stock_threshold", nullable = false)
    @Builder.Default
    private Integer lowStockThreshold = 10;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_option", nullable = false, length = 30)
    @Builder.Default
    private ProductPaymentOption paymentOption = ProductPaymentOption.COD_AND_ONLINE;

    @Column(length = 30)
    private String unit; // e.g. "500g", "1kg", "12 pieces"

    @Column(name = "image_url", columnDefinition = "LONGTEXT")
    private String imageUrl;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private java.util.List<ProductVariant> variants = new java.util.ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @Builder.Default
    @Column(nullable = false)
    private boolean active = true;

    @Builder.Default
    @Column(name = "is_bestseller")
    private boolean bestseller = false;

    @Builder.Default
    @Column(name = "avg_rating")
    private Double avgRating = 0.0;

    @Builder.Default
    @Column(name = "num_reviews")
    private Integer numReviews = 0;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    @Transient
    public BigDecimal getEffectivePrice() {
        return (discountPrice != null && discountPrice.compareTo(BigDecimal.ZERO) > 0)
                ? discountPrice
                : price;
    }

    public boolean isInStock() {
        return stockQuantity != null && stockQuantity > 0;
    }

    public boolean isCodAllowed() {
        return paymentOption == null || paymentOption == ProductPaymentOption.COD_AND_ONLINE || paymentOption == ProductPaymentOption.COD_ONLY;
    }

    public boolean isOnlineAllowed() {
        return paymentOption == null || paymentOption == ProductPaymentOption.COD_AND_ONLINE || paymentOption == ProductPaymentOption.ONLINE_ONLY;
    }

    public Integer getEffectiveLowStockThreshold() {
        return lowStockThreshold != null ? lowStockThreshold : 10;
    }

    public boolean hasVariants() {
        return variants != null && !variants.isEmpty();
    }

    public String getStockStatus() {
        if (stockQuantity == null || stockQuantity <= 0) {
            return "OUT_OF_STOCK";
        }
        if (stockQuantity <= getEffectiveLowStockThreshold()) {
            return "LOW_STOCK";
        }
        return "IN_STOCK";
    }
}
