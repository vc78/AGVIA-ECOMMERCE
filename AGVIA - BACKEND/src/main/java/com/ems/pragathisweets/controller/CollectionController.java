package com.ems.pragathisweets.controller;

import com.ems.pragathisweets.dto.ApiResponse;
import com.ems.pragathisweets.dto.ProductCollectionResponse;
import com.ems.pragathisweets.dto.ProductResponse;
import com.ems.pragathisweets.entity.ProductCollection;
import com.ems.pragathisweets.exception.ResourceNotFoundException;
import com.ems.pragathisweets.mapper.ProductMapper;
import com.ems.pragathisweets.repository.ProductCollectionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/collections")
@RequiredArgsConstructor
public class CollectionController {

    private final ProductCollectionRepository productCollectionRepository;
    private final ProductMapper productMapper;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProductCollectionResponse>>> getActiveCollections() {
        List<ProductCollectionResponse> list = productCollectionRepository.findByActiveTrueOrderByDisplayOrderAsc().stream()
                .map(this::toResponseWithoutProducts)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok("Collections retrieved", list));
    }

    @GetMapping("/{slug}")
    public ResponseEntity<ApiResponse<ProductCollectionResponse>> getCollectionBySlug(@PathVariable String slug) {
        ProductCollection collection = productCollectionRepository.findBySlugWithProducts(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Collection not found with slug: " + slug));

        List<ProductResponse> products = collection.getProducts().stream()
                .filter(p -> p.isActive())
                .map(productMapper::toResponse)
                .collect(Collectors.toList());

        ProductCollectionResponse response = ProductCollectionResponse.builder()
                .id(collection.getId())
                .name(collection.getName())
                .slug(collection.getSlug())
                .description(collection.getDescription())
                .coverImage(collection.getCoverImage())
                .bannerImage(collection.getBannerImage())
                .displayOrder(collection.getDisplayOrder())
                .active(collection.isActive())
                .seoTitle(collection.getSeoTitle())
                .seoDescription(collection.getSeoDescription())
                .productCount(products.size())
                .products(products)
                .build();

        return ResponseEntity.ok(ApiResponse.ok("Collection retrieved", response));
    }

    private ProductCollectionResponse toResponseWithoutProducts(ProductCollection c) {
        return ProductCollectionResponse.builder()
                .id(c.getId())
                .name(c.getName())
                .slug(c.getSlug())
                .description(c.getDescription())
                .coverImage(c.getCoverImage())
                .bannerImage(c.getBannerImage())
                .displayOrder(c.getDisplayOrder())
                .active(c.isActive())
                .seoTitle(c.getSeoTitle())
                .seoDescription(c.getSeoDescription())
                .productCount(c.getProducts() != null ? c.getProducts().size() : 0)
                .build();
    }
}
