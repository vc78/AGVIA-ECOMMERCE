package com.ems.pragathisweets.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Lightweight audit & synchronization entity tracking the export status of orders
 * to the AGVIA_ORDERS.xlsx reporting layer.
 * 
 * Follows AGVIA MySQL / JPA naming conventions.
 * MySQL remains the primary source of truth.
 */
@Entity
@Table(name = "order_excel_sync_logs", indexes = {
    @Index(name = "idx_excel_sync_order_id", columnList = "order_id"),
    @Index(name = "idx_excel_sync_order_num", columnList = "order_number"),
    @Index(name = "idx_excel_sync_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderExcelSyncLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_id", nullable = false)
    private Long orderId;

    @Column(name = "order_number", nullable = false, length = 50)
    private String orderNumber;

    @Column(nullable = false, length = 30)
    private String action; // APPEND, UPDATE, REGENERATE

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "SUCCESS"; // SUCCESS, FAILED

    @Column(name = "error_message", length = 1000)
    private String errorMessage;

    @Column(name = "synced_at")
    private LocalDateTime syncedAt;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.syncedAt == null) {
            this.syncedAt = LocalDateTime.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
