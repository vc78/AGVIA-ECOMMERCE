package com.ems.pragathisweets.controller.admin;

import com.ems.pragathisweets.dto.ApiResponse;
import com.ems.pragathisweets.dto.ProductCollectionRequest;
import com.ems.pragathisweets.dto.ProductCollectionResponse;
import com.ems.pragathisweets.entity.Product;
import com.ems.pragathisweets.entity.ProductCollection;
import com.ems.pragathisweets.exception.DuplicateResourceException;
import com.ems.pragathisweets.exception.ResourceNotFoundException;
import com.ems.pragathisweets.repository.ProductCollectionRepository;
import com.ems.pragathisweets.repository.ProductRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/collections")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminCollectionController {

    private final ProductCollectionRepository productCollectionRepository;
    private final ProductRepository productRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProductCollectionResponse>>> getAllCollections() {
        List<ProductCollectionResponse> list = productCollectionRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok("Collections retrieved", list));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ProductCollectionResponse>> createCollection(@Valid @RequestBody ProductCollectionRequest request) {
        String slug = request.getSlug() != null && !request.getSlug().isBlank()
                ? toSlug(request.getSlug())
                : toSlug(request.getName());

        if (productCollectionRepository.existsBySlug(slug)) {
            throw new DuplicateResourceException("Collection with slug '" + slug + "' already exists");
        }

        Set<Product> products = new HashSet<>();
        if (request.getProductIds() != null && !request.getProductIds().isEmpty()) {
            products.addAll(productRepository.findAllById(request.getProductIds()));
        }

        ProductCollection collection = ProductCollection.builder()
                .name(request.getName())
                .slug(slug)
                .description(request.getDescription())
                .coverImage(request.getCoverImage())
                .bannerImage(request.getBannerImage())
                .displayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : 0)
                .active(request.getActive() == null || request.getActive())
                .seoTitle(request.getSeoTitle())
                .seoDescription(request.getSeoDescription())
                .products(products)
                .build();

        return ResponseEntity.ok(ApiResponse.ok("Collection created", toResponse(productCollectionRepository.save(collection))));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductCollectionResponse>> updateCollection(@PathVariable Long id, @Valid @RequestBody ProductCollectionRequest request) {
        ProductCollection collection = productCollectionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Collection not found with id: " + id));

        String slug = request.getSlug() != null && !request.getSlug().isBlank()
                ? toSlug(request.getSlug())
                : toSlug(request.getName());

        if (productCollectionRepository.existsBySlugAndIdNot(slug, id)) {
            throw new DuplicateResourceException("Collection with slug '" + slug + "' already exists");
        }

        collection.setName(request.getName());
        collection.setSlug(slug);
        collection.setDescription(request.getDescription());
        collection.setCoverImage(request.getCoverImage());
        collection.setBannerImage(request.getBannerImage());
        if (request.getDisplayOrder() != null) collection.setDisplayOrder(request.getDisplayOrder());
        if (request.getActive() != null) collection.setActive(request.getActive());
        collection.setSeoTitle(request.getSeoTitle());
        collection.setSeoDescription(request.getSeoDescription());

        if (request.getProductIds() != null) {
            Set<Product> products = new HashSet<>(productRepository.findAllById(request.getProductIds()));
            collection.setProducts(products);
        }

        return ResponseEntity.ok(ApiResponse.ok("Collection updated", toResponse(productCollectionRepository.save(collection))));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCollection(@PathVariable Long id) {
        if (!productCollectionRepository.existsById(id)) {
            throw new ResourceNotFoundException("Collection not found with id: " + id);
        }
        productCollectionRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.ok("Collection deleted", null));
    }

    private ProductCollectionResponse toResponse(ProductCollection c) {
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

    private String toSlug(String input) {
        return input.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
    }
}
