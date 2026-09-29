package com.ems.pragathisweets.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "analytics_events", indexes = {
    @Index(name = "idx_ae_created_at", columnList = "created_at"),
    @Index(name = "idx_ae_event_type", columnList = "event_type"),
    @Index(name = "idx_ae_event_created", columnList = "event_type, created_at"),
    @Index(name = "idx_ae_visitor_created", columnList = "visitor_id, created_at"),
    @Index(name = "idx_ae_session_created", columnList = "session_id, created_at"),
    @Index(name = "idx_ae_product_id", columnList = "product_id"),
    @Index(name = "idx_ae_page_path", columnList = "page_path")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnalyticsEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "event_type", nullable = false, length = 50)
    private String eventType;

    @Column(name = "visitor_id", nullable = false, length = 64)
    private String visitorId;

    @Column(name = "session_id", nullable = false, length = 64)
    private String sessionId;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "product_id")
    private Long productId;

    @Column(name = "page_path", length = 255)
    private String pagePath;

    @Column(name = "page_title", length = 150)
    private String pageTitle;

    @Column(name = "referrer", length = 255)
    private String referrer;

    @Column(name = "device_type", length = 20)
    private String deviceType;

    @Column(name = "share_method", length = 30)
    private String shareMethod;

    @Column(name = "quantity")
    private Integer quantity;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }
}
