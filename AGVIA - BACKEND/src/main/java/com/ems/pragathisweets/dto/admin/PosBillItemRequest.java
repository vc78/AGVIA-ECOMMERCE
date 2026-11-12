package com.ems.pragathisweets.dto.admin;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PosBillItemRequest {

    @NotNull(message = "Product ID is required")
    private Long productId;

    private Long variantId;

    private String productName;

    private String sku;

    private String colorName;

    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity;

    @NotNull(message = "Unit price is required")
    @Min(value = 0, message = "Unit price cannot be negative")
    private BigDecimal unitPrice;

    @Builder.Default
    private BigDecimal discount = BigDecimal.ZERO;
}

