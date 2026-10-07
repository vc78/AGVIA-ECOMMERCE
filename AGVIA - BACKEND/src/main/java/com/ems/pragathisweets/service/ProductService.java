package com.ems.pragathisweets.service;

import com.ems.pragathisweets.dto.ProductRequest;
import com.ems.pragathisweets.dto.ProductResponse;
import com.ems.pragathisweets.entity.Category;
import com.ems.pragathisweets.entity.Product;
import com.ems.pragathisweets.exception.DuplicateResourceException;
import com.ems.pragathisweets.exception.ProductNotFoundException;
import com.ems.pragathisweets.exception.ResourceNotFoundException;
import com.ems.pragathisweets.mapper.ProductMapper;
import com.ems.pragathisweets.repository.CategoryRepository;
import com.ems.pragathisweets.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final com.ems.pragathisweets.repository.ProductVariantRepository productVariantRepository;
    private final com.ems.pragathisweets.repository.VariantImageRepository variantImageRepository;
    private final ProductMapper productMapper;

    @Transactional(readOnly = true)
    public Page<ProductResponse> getAll(Pageable pageable) {
        return productRepository.findByActiveTrue(pageable).map(productMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<ProductResponse> getByCategory(Long categoryId, Pageable pageable) {
        return productRepository.findByCategoryIdAndActiveTrue(categoryId, pageable).map(productMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<ProductResponse> search(String keyword, Pageable pageable) {
        return productRepository.search(keyword, pageable).map(productMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public ProductResponse getById(Long id) {
        return productMapper.toResponse(findEntity(id));
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> getFeatured() {
        return productRepository.findTop8ByActiveTrueOrderByAvgRatingDesc().stream()
                .map(productMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> getRelated(Long id, int limit) {
        Product product = findEntity(id);
        Long categoryId = product.getCategory() != null ? product.getCategory().getId() : null;
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(0, limit);
        List<Product> list;
        if (categoryId != null) {
            list = new java.util.ArrayList<>(productRepository.findByCategoryIdAndIdNotAndActiveTrue(categoryId, id, pageable));
        } else {
            list = new java.util.ArrayList<>();
        }
        if (list.size() < limit) {
            List<Product> fallback = productRepository.findTop8ByActiveTrueOrderByAvgRatingDesc().stream()
                    .filter(p -> !p.getId().equals(id) && list.stream().noneMatch(existing -> existing.getId().equals(p.getId())))
                    .limit(limit - list.size())
                    .toList();
            list.addAll(fallback);
        }
        return list.stream().map(productMapper::toResponse).toList();
    }

    @Transactional
    public ProductResponse create(ProductRequest request) {
        if (request.getSku() != null && !request.getSku().isBlank()
                && productRepository.existsBySkuIgnoreCase(request.getSku())) {
            throw new DuplicateResourceException("A product with SKU " + request.getSku() + " already exists");
        }

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + request.getCategoryId()));

        Product product = Product.builder()
                .name(request.getName())
                .description(request.getDescription())
                .sku(request.getSku())
                .price(request.getPrice())
                .discountPrice(request.getDiscountPrice())
                .stockQuantity(request.getStockQuantity())
                .lowStockThreshold(request.getLowStockThreshold() != null ? request.getLowStockThreshold() : 10)
                .paymentOption(request.getPaymentOption() != null ? request.getPaymentOption() : com.ems.pragathisweets.entity.ProductPaymentOption.COD_AND_ONLINE)
                .unit(request.getUnit())
                .imageUrl(request.getImageUrl())
                .category(category)
                .active(request.getActive() == null || request.getActive())
                .avgRating(0.0)
                .numReviews(0)
                .build();

        Product savedProduct = productRepository.save(product);

        // Process variants if supplied
        if (request.getVariants() != null && !request.getVariants().isEmpty()) {
            saveOrUpdateVariants(savedProduct, request.getVariants());
        }

        return productMapper.toResponse(savedProduct);
    }

    @Transactional
    public ProductResponse update(Long id, ProductRequest request) {
        Product product = findEntity(id);

        if (request.getSku() != null && !request.getSku().isBlank()
                && !request.getSku().equalsIgnoreCase(product.getSku())
                && productRepository.existsBySkuIgnoreCase(request.getSku())) {
            throw new DuplicateResourceException("A product with SKU " + request.getSku() + " already exists");
        }

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + request.getCategoryId()));

        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setSku(request.getSku());
        product.setPrice(request.getPrice());
        product.setDiscountPrice(request.getDiscountPrice());
        product.setStockQuantity(request.getStockQuantity());
        if (request.getLowStockThreshold() != null) {
            product.setLowStockThreshold(request.getLowStockThreshold());
        }
        if (request.getPaymentOption() != null) {
            product.setPaymentOption(request.getPaymentOption());
        }
        product.setUnit(request.getUnit());
        product.setImageUrl(request.getImageUrl());
        product.setCategory(category);
        if (request.getActive() != null) {
            product.setActive(request.getActive());
        }

        Product savedProduct = productRepository.save(product);

        // Process variants if supplied
        if (request.getVariants() != null) {
            saveOrUpdateVariants(savedProduct, request.getVariants());
        }

        return productMapper.toResponse(savedProduct);
    }

    private void saveOrUpdateVariants(Product product, List<com.ems.pragathisweets.dto.ProductVariantRequest> variantRequests) {
        for (com.ems.pragathisweets.dto.ProductVariantRequest vr : variantRequests) {
            if (vr.getSku() == null || vr.getSku().isBlank()) {
                throw new IllegalArgumentException("Variant SKU is required");
            }
            if (vr.getColorName() == null || vr.getColorName().isBlank()) {
                throw new IllegalArgumentException("Variant color name is required");
            }

            // Check SKU uniqueness
            if (vr.getId() == null) {
                if (productVariantRepository.existsBySku(vr.getSku())) {
                    throw new DuplicateResourceException("Variant SKU " + vr.getSku() + " is already in use");
                }
            } else {
                if (productVariantRepository.existsBySkuAndIdNot(vr.getSku(), vr.getId())) {
                    throw new DuplicateResourceException("Variant SKU " + vr.getSku() + " is already in use");
                }
            }

            com.ems.pragathisweets.entity.ProductVariant variant;
            if (vr.getId() != null) {
                variant = productVariantRepository.findById(vr.getId())
                        .orElse(new com.ems.pragathisweets.entity.ProductVariant());
            } else {
                variant = new com.ems.pragathisweets.entity.ProductVariant();
            }

            variant.setProduct(product);
            variant.setColorName(vr.getColorName().trim());
            variant.setColorCode(vr.getColorCode() != null ? vr.getColorCode().trim() : null);
            variant.setSku(vr.getSku().trim());
            variant.setPrice(vr.getPrice());
            variant.setDiscountPrice(vr.getDiscountPrice());
            variant.setStockQuantity(vr.getStockQuantity() != null ? vr.getStockQuantity() : 0);
            variant.setLowStockThreshold(vr.getLowStockThreshold() != null ? vr.getLowStockThreshold() : 5);
            variant.setPaymentOption(vr.getPaymentOption());
            variant.setActive(vr.getActive() == null || vr.getActive());

            // Handle images
            variant.getImages().clear();
            if (vr.getImages() != null && !vr.getImages().isEmpty()) {
                boolean hasPrimary = vr.getImages().stream().anyMatch(com.ems.pragathisweets.dto.VariantImageDto::isPrimary);
                for (int i = 0; i < vr.getImages().size(); i++) {
                    com.ems.pragathisweets.dto.VariantImageDto imgDto = vr.getImages().get(i);
                    boolean isPrim = imgDto.isPrimary() || (!hasPrimary && i == 0);
                    com.ems.pragathisweets.entity.VariantImage vi = com.ems.pragathisweets.entity.VariantImage.builder()
                            .variant(variant)
                            .imageUrl(imgDto.getImageUrl())
                            .altText(imgDto.getAltText() != null ? imgDto.getAltText() : product.getName() + " - " + variant.getColorName())
                            .sortOrder(imgDto.getSortOrder() != null ? imgDto.getSortOrder() : i)
                            .isPrimary(isPrim)
                            .build();
                    variant.getImages().add(vi);
                }
            }

            productVariantRepository.save(variant);
        }
    }

    @Transactional(readOnly = true)
    public List<com.ems.pragathisweets.dto.ProductVariantResponse> getVariantsByProductId(Long productId) {
        Product product = findEntity(productId);
        return productVariantRepository.findByProductId(productId).stream()
                .map(v -> productMapper.toVariantResponse(v, product))
                .collect(java.util.stream.Collectors.toList());
    }

    @Transactional(readOnly = true)
    public com.ems.pragathisweets.dto.ProductVariantResponse getVariantById(Long variantId) {
        com.ems.pragathisweets.entity.ProductVariant variant = productVariantRepository.findById(variantId)
                .orElseThrow(() -> new ResourceNotFoundException("Variant not found with id: " + variantId));
        return productMapper.toVariantResponse(variant, variant.getProduct());
    }

    @Transactional
    public void deleteVariant(Long variantId) {
        com.ems.pragathisweets.entity.ProductVariant variant = productVariantRepository.findById(variantId)
                .orElseThrow(() -> new ResourceNotFoundException("Variant not found with id: " + variantId));
        variant.setActive(false);
        productVariantRepository.save(variant);
    }

    @Transactional
    public void delete(Long id) {
        Product product = findEntity(id);
        product.setActive(false);
        productRepository.save(product);
    }

    protected Product findEntity(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ProductNotFoundException(id));
    }

    @Transactional
    public void recalculateRating(Long productId, double newAvg, int newCount) {
        Product product = findEntity(productId);
        product.setAvgRating(newAvg);
        product.setNumReviews(newCount);
        productRepository.save(product);
    }
}
