package com.ems.pragathisweets.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicOrderTrackingResponse {

    private String trackingToken;
    private String maskedOrderNumber;
    private String status;
    private LocalDateTime createdAt;
    private String estimatedDelivery;
    private int totalItems;
    private String destinationCity;
    private String destinationState;
    private String carrier;
    @Builder.Default
    private boolean requiresAuthForFullDetails = true;
    private List<TrackingMilestone> timeline;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TrackingMilestone {
        private String step;
        private String title;
        private String description;
        private LocalDateTime timestamp;
        private boolean completed;
        private boolean current;
    }
}

