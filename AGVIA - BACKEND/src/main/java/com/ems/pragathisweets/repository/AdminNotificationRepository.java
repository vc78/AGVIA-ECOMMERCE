package com.ems.pragathisweets.repository;

import com.ems.pragathisweets.entity.AdminNotification;
import com.ems.pragathisweets.entity.NotificationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface AdminNotificationRepository extends JpaRepository<AdminNotification, Long> {

    Page<AdminNotification> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @Query("SELECT n FROM AdminNotification n WHERE n.recipientId = :recipientId OR n.recipientId IS NULL ORDER BY n.createdAt DESC")
    Page<AdminNotification> findForRecipient(@Param("recipientId") Long recipientId, Pageable pageable);

    long countByIsReadFalse();

    @Query("SELECT COUNT(n) FROM AdminNotification n WHERE (n.recipientId = :recipientId OR n.recipientId IS NULL) AND n.isRead = false")
    long countUnreadForRecipient(@Param("recipientId") Long recipientId);

    @Modifying
    @Query("UPDATE AdminNotification n SET n.isRead = true, n.readAt = :readAt WHERE n.isRead = false")
    int markAllAsRead(@Param("readAt") LocalDateTime readAt);

    @Modifying
    @Query("UPDATE AdminNotification n SET n.isRead = true, n.readAt = :readAt WHERE (n.recipientId = :recipientId OR n.recipientId IS NULL) AND n.isRead = false")
    int markAllAsReadForRecipient(@Param("recipientId") Long recipientId, @Param("readAt") LocalDateTime readAt);

    boolean existsByTypeAndReferenceTypeAndReferenceId(NotificationType type, String referenceType, String referenceId);

    @Query("SELECT COUNT(n) > 0 FROM AdminNotification n WHERE n.type = :type AND n.referenceType = :referenceType AND n.referenceId = :referenceId AND n.createdAt >= :since")
    boolean existsRecent(
            @Param("type") NotificationType type,
            @Param("referenceType") String referenceType,
            @Param("referenceId") String referenceId,
            @Param("since") LocalDateTime since);
}
