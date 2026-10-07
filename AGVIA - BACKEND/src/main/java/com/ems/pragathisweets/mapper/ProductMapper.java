package com.ems.pragathisweets.mapper;

import com.ems.pragathisweets.dto.ProductResponse;
import com.ems.pragathisweets.entity.Product;
import org.springframework.stereotype.Component;

@Component
public class ProductMapper {

    public ProductResponse toResponse(Product product) {
        if (product == null) {
            return null;
        }

        java.util.List<com.ems.pragathisweets.dto.ProductVariantResponse> variantResponses = new java.util.ArrayList<>();
        if (product.getVariants() != null && !product.getVariants().isEmpty()) {
            for (com.ems.pragathisweets.entity.ProductVariant v : product.getVariants()) {
                if (v.isActive()) {
                    variantResponses.add(toVariantResponse(v, product));
                }
            }
        }

        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .description(product.getDescription())
                .sku(product.getSku())
                .price(product.getPrice())
                .discountPrice(product.getDiscountPrice())
                .effectivePrice(product.getEffectivePrice())
                .stockQuantity(product.getStockQuantity())
                .unit(product.getUnit())
                .imageUrl(product.getImageUrl())
                .categoryId(product.getCategory() != null ? product.getCategory().getId() : null)
                .categoryName(product.getCategory() != null ? product.getCategory().getName() : null)
                .active(product.isActive())
                .bestseller(product.isBestseller())
                .avgRating(product.getAvgRating())
                .numReviews(product.getNumReviews())
                .inStock(product.isInStock())
                .paymentOption(product.getPaymentOption() != null ? product.getPaymentOption() : com.ems.pragathisweets.entity.ProductPaymentOption.COD_AND_ONLINE)
                .lowStockThreshold(product.getEffectiveLowStockThreshold())
                .stockStatus(product.getStockStatus())
                .codAllowed(product.isCodAllowed())
                .onlineAllowed(product.isOnlineAllowed())
                .hasVariants(!variantResponses.isEmpty())
                .variants(variantResponses)
                .createdAt(product.getCreatedAt())
                .build();
    }

    public com.ems.pragathisweets.dto.ProductVariantResponse toVariantResponse(com.ems.pragathisweets.entity.ProductVariant variant, Product product) {
        if (variant == null) return null;
        java.math.BigDecimal fallback = product != null ? product.getEffectivePrice() : java.math.BigDecimal.ZERO;
        java.math.BigDecimal effPrice = variant.getEffectivePrice(fallback);
        com.ems.pragathisweets.entity.VariantImage primaryImg = variant.getPrimaryImage();

        java.util.List<com.ems.pragathisweets.dto.VariantImageDto> imgDtos = new java.util.ArrayList<>();
        if (variant.getImages() != null) {
            for (com.ems.pragathisweets.entity.VariantImage img : variant.getImages()) {
                imgDtos.add(com.ems.pragathisweets.dto.VariantImageDto.builder()
                        .id(img.getId())
                        .imageUrl(img.getImageUrl())
                        .altText(img.getAltText())
                        .sortOrder(img.getSortOrder())
                        .isPrimary(img.isPrimary())
                        .build());
            }
        }

        com.ems.pragathisweets.entity.ProductPaymentOption opt = variant.getPaymentOption() != null ? variant.getPaymentOption() :
                (product != null ? product.getPaymentOption() : com.ems.pragathisweets.entity.ProductPaymentOption.COD_AND_ONLINE);
        boolean codAllowed = opt == null || opt == com.ems.pragathisweets.entity.ProductPaymentOption.COD_AND_ONLINE || opt == com.ems.pragathisweets.entity.ProductPaymentOption.COD_ONLY;
        boolean onlineAllowed = opt == null || opt == com.ems.pragathisweets.entity.ProductPaymentOption.COD_AND_ONLINE || opt == com.ems.pragathisweets.entity.ProductPaymentOption.ONLINE_ONLY;

        return com.ems.pragathisweets.dto.ProductVariantResponse.builder()
                .id(variant.getId())
                .productId(product != null ? product.getId() : (variant.getProduct() != null ? variant.getProduct().getId() : null))
                .colorName(variant.getColorName())
                .colorCode(variant.getColorCode())
                .sku(variant.getSku())
                .price(variant.getPrice())
                .discountPrice(variant.getDiscountPrice())
                .effectivePrice(effPrice)
                .stockQuantity(variant.getStockQuantity())
                .lowStockThreshold(variant.getLowStockThreshold())
                .stockStatus(variant.getStockStatus())
                .inStock(variant.isInStock())
                .paymentOption(opt)
                .codAllowed(codAllowed)
                .onlineAllowed(onlineAllowed)
                .active(variant.isActive())
                .primaryImageUrl(primaryImg != null ? primaryImg.getImageUrl() : (product != null ? product.getImageUrl() : null))
                .images(imgDtos)
                .build();
    }
}
