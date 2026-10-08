package com.ems.pragathisweets.dto;

import com.ems.pragathisweets.entity.ProductPaymentOption;
import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductVariantResponse {

    private Long id;
    private Long productId;
    private String colorName;
    private String colorCode;
    private String sku;
    private BigDecimal price;
    private BigDecimal discountPrice;
    private BigDecimal effectivePrice;
    private Integer stockQuantity;
    private Integer lowStockThreshold;
    private String stockStatus;
    private boolean inStock;
    private ProductPaymentOption paymentOption;
    private boolean codAllowed;
    private boolean onlineAllowed;
    private PaymentPolicyResponse paymentPolicy;
    private boolean active;
    private String primaryImageUrl;

    @Builder.Default
    private List<VariantImageDto> images = new ArrayList<>();
}
