package com.ems.pragathisweets.event;

import com.ems.pragathisweets.entity.NotificationType;
import lombok.Builder;
import lombok.Getter;

import java.util.Map;

@Getter
@Builder
public class AdminNotificationEvent {
    private final NotificationType type;
    private final String title;
    private final String message;
    private final Long recipientId;
    private final String referenceId;
    private final String referenceType;
    private final Map<String, Object> metadata;

    public AdminNotificationEvent(
            NotificationType type,
            String title,
            String message,
            Long recipientId,
            String referenceId,
            String referenceType,
            Map<String, Object> metadata) {
        this.type = type;
        this.title = title;
        this.message = message;
        this.recipientId = recipientId;
        this.referenceId = referenceId;
        this.referenceType = referenceType;
        this.metadata = metadata;
    }

    public AdminNotificationEvent(
            NotificationType type,
            String title,
            String message,
            String referenceId,
            String referenceType,
            Map<String, Object> metadata) {
        this(type, title, message, null, referenceId, referenceType, metadata);
    }
}
