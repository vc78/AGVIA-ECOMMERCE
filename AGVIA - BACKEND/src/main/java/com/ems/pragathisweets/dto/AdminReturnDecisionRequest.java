package com.ems.pragathisweets.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminReturnDecisionRequest {

    @NotNull(message = "Status is mandatory")
    private String status; // APPROVED, REJECTED, PICKUP_SCHEDULED, PICKED_UP, RECEIVED, COMPLETED, CANCELLED

    private String adminNotes;
    private String reverseCourierPartner;
    private String reverseTrackingNumber;
    private BigDecimal refundAmount;
    private Boolean issueStoreCreditCoupon;
}
