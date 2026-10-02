package com.ems.pragathisweets.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminNotificationResponse {
    private Long id;
    private String type;
    private String title;
    private String message;
    private Long recipientId;
    private String referenceId;
    private String referenceType;
    private boolean isRead;
    private String metadata;
    private LocalDateTime createdAt;
    private LocalDateTime readAt;
}
