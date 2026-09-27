package com.ems.pragathisweets.controller.admin;

import com.ems.pragathisweets.dto.ApiResponse;
import com.ems.pragathisweets.dto.ProductRequest;
import com.ems.pragathisweets.dto.ProductResponse;
import com.ems.pragathisweets.service.admin.AdminProductService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/products")
@RequiredArgsConstructor
@Tag(name = "Admin - Products", description = "Admin product catalog management")
public class AdminProductController {

    private final AdminProductService adminProductService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ProductResponse>>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {

        org.springframework.data.domain.Sort.Direction dir = direction.equalsIgnoreCase("asc") ? org.springframework.data.domain.Sort.Direction.ASC : org.springframework.data.domain.Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, org.springframework.data.domain.Sort.by(dir, sortBy));
        return ResponseEntity.ok(ApiResponse.success(adminProductService.getAll(pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(adminProductService.getById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ProductResponse>> create(@Valid @RequestBody ProductRequest request) {
        ProductResponse response = adminProductService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Product created", response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductResponse>> update(@PathVariable Long id,
                                                                @Valid @RequestBody ProductRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Product updated", adminProductService.update(id, request)));
    }

    @PostMapping("/ai-generate")
    public ResponseEntity<ApiResponse<com.ems.pragathisweets.dto.admin.AiProductGenerateResponse>> generateAi(
            @RequestBody com.ems.pragathisweets.dto.admin.AiProductGenerateRequest request) {
        return ResponseEntity.ok(ApiResponse.success("AI content generated successfully", adminProductService.generateAiContent(request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        adminProductService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Product deactivated", null));
    }
}
