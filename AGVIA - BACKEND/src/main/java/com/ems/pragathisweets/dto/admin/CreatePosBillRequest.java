package com.ems.pragathisweets.dto.admin;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreatePosBillRequest {

    private String customerName;
    private String customerPhone;
    private String customerEmail;
    private String customerAddress;

    @Builder.Default
    private String paymentMethod = "CASH";

    @Builder.Default
    private String paymentStatus = "SUCCESS";

    @Builder.Default
    private BigDecimal customDiscount = BigDecimal.ZERO;

    private String discountReason;

    @Builder.Default
    private BigDecimal taxAmount = BigDecimal.ZERO;

    private String notes;

    @NotEmpty(message = "Bill must contain at least one product")
    @Valid
    private List<PosBillItemRequest> items;
}

