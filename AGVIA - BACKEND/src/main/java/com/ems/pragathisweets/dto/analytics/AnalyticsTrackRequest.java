package com.ems.pragathisweets.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsTrackRequest {
    private String eventType;
    private String visitorId;
    private String sessionId;
    private Long userId;
    private Long productId;
    private String pagePath;
    private String pageTitle;
    private String referrer;
    private String deviceType;
    private String shareMethod;
    private Integer quantity;
}
