package com.ems.pragathisweets.service.admin;

import com.ems.pragathisweets.dto.ProductRequest;
import com.ems.pragathisweets.dto.ProductResponse;
import com.ems.pragathisweets.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

/**
 * Thin admin-facing wrapper over ProductService. Kept separate so that
 * admin-only concerns (e.g. audit logging, bulk operations) can evolve
 * independently from the public-facing ProductService.
 */
@Service
@RequiredArgsConstructor
public class AdminProductService {

    private final ProductService productService;
    private final GeminiService geminiService;

    public com.ems.pragathisweets.dto.admin.AiProductGenerateResponse generateAiContent(com.ems.pragathisweets.dto.admin.AiProductGenerateRequest request) {
        return geminiService.generateProductContent(request);
    }

    public Page<ProductResponse> getAll(Pageable pageable) {
        return productService.getAll(pageable);
    }

    public ProductResponse getById(Long id) {
        return productService.getById(id);
    }

    public ProductResponse create(ProductRequest request) {
        return productService.create(request);
    }

    public ProductResponse update(Long id, ProductRequest request) {
        return productService.update(id, request);
    }

    public void delete(Long id) {
        productService.delete(id);
    }

    public java.util.List<com.ems.pragathisweets.dto.ProductVariantResponse> getVariants(Long id) {
        return productService.getVariantsByProductId(id);
    }

    public void deleteVariant(Long variantId) {
        productService.deleteVariant(variantId);
    }
}
