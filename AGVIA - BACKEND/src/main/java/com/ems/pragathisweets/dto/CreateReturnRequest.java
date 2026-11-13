package com.ems.pragathisweets.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateReturnRequest {

    @NotNull(message = "Order ID is mandatory")
    private Long orderId;

    private Long orderItemId;

    @NotNull(message = "Request type (RETURN or EXCHANGE) is mandatory")
    private String type; // RETURN, EXCHANGE

    @NotNull(message = "Return reason is mandatory")
    private String reason; // SIZE_FIT, DEFECTIVE, COLOR_MISMATCH, INCORRECT_ITEM, NOT_AS_EXPECTED, OTHER

    @NotNull(message = "Resolution is mandatory")
    private String resolution; // SIZE_EXCHANGE, STORE_CREDIT, ORIGINAL_PAYMENT

    private String targetSize;
    private String targetColor;
    private Long targetVariantId;
    private String customerNotes;
    private List<String> images;
    private String bankDetails; // UPI ID or Account Details for COD
    private String pickupAddress;
}
