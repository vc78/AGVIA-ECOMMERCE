package com.ems.pragathisweets.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecentActivityItem {
    private Long id;
    private String eventType;
    private String eventLabel;
    private String visitorLabel;
    private String pagePath;
    private Long productId;
    private String productName;
    private String shareMethod;
    private String deviceType;
    private LocalDateTime timestamp;
    private LocalDateTime createdAt;
    private String description;
}
