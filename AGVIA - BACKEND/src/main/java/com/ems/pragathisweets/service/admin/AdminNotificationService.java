package com.ems.pragathisweets.service.admin;

import com.ems.pragathisweets.dto.admin.AdminNotificationResponse;
import com.ems.pragathisweets.dto.admin.UnreadCountResponse;
import com.ems.pragathisweets.entity.AdminNotification;
import com.ems.pragathisweets.entity.NotificationType;
import com.ems.pragathisweets.event.AdminNotificationEvent;
import com.ems.pragathisweets.exception.ResourceNotFoundException;
import com.ems.pragathisweets.repository.AdminNotificationRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.time.LocalDateTime;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminNotificationService {

    private final AdminNotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper;

    /**
     * Listens to internal domain events AFTER the originating database transaction commits.
     * Guarantees transactional integrity: WebSocket publication never runs on rolled-back transactions.
     */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void handleAdminNotificationEvent(AdminNotificationEvent event) {
        log.info("[AdminNotificationService] Handling committed event: type={}, ref={}:{}",
                event.getType(), event.getReferenceType(), event.getReferenceId());
        try {
            createAndPublish(
                    event.getType(),
                    event.getTitle(),
                    event.getMessage(),
                    event.getReferenceId(),
                    event.getReferenceType(),
                    event.getRecipientId(),
                    event.getMetadata()
            );
        } catch (Exception ex) {
            log.error("[AdminNotificationService] Failed to process admin notification event {}: {}",
                    event.getType(), ex.getMessage(), ex);
        }
    }

    /**
     * Persists the notification to PostgreSQL database and broadcasts it via WebSocket.
     */
    @Transactional
    public AdminNotificationResponse createAndPublish(
            NotificationType type,
            String title,
            String message,
            String referenceId,
            String referenceType,
            Long recipientId,
            Map<String, Object> metadataMap) {

        // Idempotency & deduplication check
        if (referenceId != null && referenceType != null) {
            boolean exists;
            if (type == NotificationType.ORDER_STATUS_CHANGED || type == NotificationType.LOW_STOCK || type == NotificationType.OUT_OF_STOCK) {
                // Short-window deduplication (10 minutes) for repeating/transitional events
                exists = notificationRepository.existsRecent(type, referenceType, referenceId, LocalDateTime.now().minusMinutes(10));
            } else {
                // Permanent idempotency for single-occurrence events (NEW_ORDER, PAYMENT_RECEIVED, ORDER_CANCELLED, NEW_CUSTOMER)
                exists = notificationRepository.existsByTypeAndReferenceTypeAndReferenceId(type, referenceType, referenceId);
            }

            if (exists) {
                log.info("[AdminNotificationService] Idempotency: Notification of type {} for {}:{} already exists. Skipping duplicate.",
                        type, referenceType, referenceId);
                return null;
            }
        }

        String metadataJson = null;
        if (metadataMap != null && !metadataMap.isEmpty()) {
            try {
                metadataJson = objectMapper.writeValueAsString(metadataMap);
            } catch (Exception e) {
                log.warn("[AdminNotificationService] Could not serialize metadata for {}: {}", referenceId, e.getMessage());
            }
        }

        AdminNotification notification = AdminNotification.builder()
                .type(type)
                .title(title)
                .message(message)
                .referenceId(referenceId)
                .referenceType(referenceType)
                .recipientId(recipientId)
                .metadata(metadataJson)
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();

        AdminNotification saved = notificationRepository.save(notification);
        AdminNotificationResponse response = toResponse(saved);

        // Broadcast to WebSocket subscribers
        try {
            String destination = "/topic/admin/notifications";
            messagingTemplate.convertAndSend(destination, response);
            log.info("[WebSocket] Dispatched real-time notification #{} [{}] to {}", saved.getId(), saved.getType(), destination);
        } catch (Exception wsEx) {
            log.warn("[WebSocket] Could not deliver real-time packet for notification #{} (stored in DB): {}",
                    saved.getId(), wsEx.getMessage());
        }

        return response;
    }

    @Transactional(readOnly = true)
    public Page<AdminNotificationResponse> getNotifications(Pageable pageable, Long recipientId) {
        if (recipientId != null) {
            return notificationRepository.findForRecipient(recipientId, pageable).map(this::toResponse);
        }
        return notificationRepository.findAllByOrderByCreatedAtDesc(pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public UnreadCountResponse getUnreadCount(Long recipientId) {
        long count;
        if (recipientId != null) {
            count = notificationRepository.countUnreadForRecipient(recipientId);
        } else {
            count = notificationRepository.countByIsReadFalse();
        }
        return new UnreadCountResponse(count);
    }

    @Transactional
    public AdminNotificationResponse markAsRead(Long id) {
        AdminNotification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + id));

        if (!notification.isRead()) {
            notification.setRead(true);
            notification.setReadAt(LocalDateTime.now());
            notification = notificationRepository.save(notification);
        }

        return toResponse(notification);
    }

    @Transactional
    public void markAllAsRead(Long recipientId) {
        LocalDateTime now = LocalDateTime.now();
        if (recipientId != null) {
            notificationRepository.markAllAsReadForRecipient(recipientId, now);
        } else {
            notificationRepository.markAllAsRead(now);
        }
    }

    @Transactional
    public void deleteNotification(Long id) {
        if (!notificationRepository.existsById(id)) {
            throw new ResourceNotFoundException("Notification not found with id: " + id);
        }
        notificationRepository.deleteById(id);
    }

    public AdminNotificationResponse toResponse(AdminNotification n) {
        return AdminNotificationResponse.builder()
                .id(n.getId())
                .type(n.getType().name())
                .title(n.getTitle())
                .message(n.getMessage())
                .recipientId(n.getRecipientId())
                .referenceId(n.getReferenceId())
                .referenceType(n.getReferenceType())
                .isRead(n.isRead())
                .metadata(n.getMetadata())
                .createdAt(n.getCreatedAt())
                .readAt(n.getReadAt())
                .build();
    }
}
