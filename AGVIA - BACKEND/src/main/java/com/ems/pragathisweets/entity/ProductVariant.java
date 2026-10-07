package com.ems.pragathisweets.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "product_variants", indexes = {
    @Index(name = "idx_pv_product_id", columnList = "product_id"),
    @Index(name = "idx_pv_sku", columnList = "sku"),
    @Index(name = "idx_pv_active", columnList = "active")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductVariant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    @JsonIgnore
    private Product product;

    @Column(name = "color_name", nullable = false, length = 100)
    private String colorName;

    @Column(name = "color_code", length = 50)
    private String colorCode; // Hex code (e.g. #2D5A27) or color name

    @Column(name = "sku", unique = true, nullable = false, length = 100)
    private String sku;

    @Column(precision = 10, scale = 2)
    private BigDecimal price; // If null, inherits from product.price

    @Column(name = "discount_price", precision = 10, scale = 2)
    private BigDecimal discountPrice;

    @Column(name = "stock_quantity", nullable = false)
    @Builder.Default
    private Integer stockQuantity = 0;

    @Column(name = "low_stock_threshold", nullable = false)
    @Builder.Default
    private Integer lowStockThreshold = 5;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_option", length = 30)
    private ProductPaymentOption paymentOption; // If null, inherits product.paymentOption

    @Builder.Default
    @Column(nullable = false)
    private boolean active = true;

    @OneToMany(mappedBy = "variant", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("sortOrder ASC")
    @Builder.Default
    private List<VariantImage> images = new ArrayList<>();

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

    public BigDecimal getEffectivePrice(BigDecimal fallbackProductPrice) {
        if (discountPrice != null && discountPrice.compareTo(BigDecimal.ZERO) > 0) {
            return discountPrice;
        }
        if (price != null && price.compareTo(BigDecimal.ZERO) > 0) {
            return price;
        }
        return fallbackProductPrice;
    }

    public boolean isInStock() {
        return stockQuantity != null && stockQuantity > 0;
    }

    public String getStockStatus() {
        if (stockQuantity == null || stockQuantity <= 0) {
            return "OUT_OF_STOCK";
        }
        if (stockQuantity <= (lowStockThreshold != null ? lowStockThreshold : 5)) {
            return "LOW_STOCK";
        }
        return "IN_STOCK";
    }

    public VariantImage getPrimaryImage() {
        if (images == null || images.isEmpty()) return null;
        return images.stream()
                .filter(VariantImage::isPrimary)
                .findFirst()
                .orElse(images.get(0));
    }

    public void addImage(VariantImage image) {
        if (images == null) images = new ArrayList<>();
        images.add(image);
        image.setVariant(this);
    }
}
