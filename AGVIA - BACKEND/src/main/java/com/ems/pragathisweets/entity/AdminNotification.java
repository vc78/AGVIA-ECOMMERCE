package com.ems.pragathisweets.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "admin_notifications", indexes = {
    @Index(name = "idx_admin_notif_recipient", columnList = "recipient_id"),
    @Index(name = "idx_admin_notif_is_read", columnList = "is_read"),
    @Index(name = "idx_admin_notif_created_at", columnList = "created_at"),
    @Index(name = "idx_admin_notif_composite", columnList = "recipient_id, is_read, created_at"),
    @Index(name = "idx_admin_notif_dedup", columnList = "type, reference_type, reference_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminNotification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private NotificationType type;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(nullable = false, length = 500)
    private String message;

    @Column(name = "recipient_id")
    private Long recipientId; // null implies broadcast to all authorized administrators

    @Column(name = "reference_id", length = 100)
    private String referenceId; // e.g. "1048", "AGV-1048", product ID, customer ID

    @Column(name = "reference_type", length = 50)
    private String referenceType; // e.g. "ORDER", "PRODUCT", "CUSTOMER", "PAYMENT"

    @Column(name = "is_read", nullable = false)
    @Builder.Default
    private boolean isRead = false;

    @Column(name = "metadata", columnDefinition = "TEXT")
    private String metadata; // JSON representation of extra contextual fields

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }
}
