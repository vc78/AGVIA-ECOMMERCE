package com.ems.pragathisweets.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "homepage_sections", indexes = {
    @Index(name = "idx_hs_display_order", columnList = "display_order"),
    @Index(name = "idx_hs_active", columnList = "active")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HomepageSection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "section_key", nullable = false, length = 50)
    private String sectionKey; // HERO_BANNER, SHOP_BY_COLLECTION, BEST_SELLERS, TRENDING_NOW, NEW_ARRIVALS, SHOP_BY_COLOR, LIMITED_STOCK, FEATURED_PRODUCTS

    @Column(nullable = false, length = 150)
    private String title;

    @Column(length = 255)
    private String subtitle;

    @Column(name = "display_order", nullable = false)
    @Builder.Default
    private Integer displayOrder = 0;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    @Column(name = "is_automatic", nullable = false)
    @Builder.Default
    private boolean automatic = true;

    @Column(name = "max_items", nullable = false)
    @Builder.Default
    private Integer maxItems = 8;

    @Column(name = "start_date")
    private LocalDateTime startDate;

    @Column(name = "end_date")
    private LocalDateTime endDate;

    @Column(name = "custom_product_ids", length = 1000)
    private String customProductIds; // comma-separated product IDs for manual curation

    @Column(name = "collection_id")
    private Long collectionId;

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

    public boolean isCurrentlyActive() {
        if (!active) return false;
        LocalDateTime now = LocalDateTime.now();
        if (startDate != null && now.isBefore(startDate)) return false;
        if (endDate != null && now.isAfter(endDate)) return false;
        return true;
    }
}
