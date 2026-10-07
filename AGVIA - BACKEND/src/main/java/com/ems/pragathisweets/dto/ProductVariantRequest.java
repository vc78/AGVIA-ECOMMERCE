package com.ems.pragathisweets.dto;

import com.ems.pragathisweets.entity.ProductPaymentOption;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductVariantRequest {

    private Long id; // null for new variant

    @NotBlank(message = "Color name is required")
    private String colorName;

    private String colorCode; // Hex or CSS color

    @NotBlank(message = "SKU is required")
    private String sku;

    private BigDecimal price; // If null, inherits from product

    private BigDecimal discountPrice;

    @NotNull(message = "Stock quantity is required")
    @PositiveOrZero(message = "Stock quantity cannot be negative")
    private Integer stockQuantity;

    private Integer lowStockThreshold;

    private ProductPaymentOption paymentOption;

    private Boolean active;

    @Builder.Default
    private List<VariantImageDto> images = new ArrayList<>();
}
