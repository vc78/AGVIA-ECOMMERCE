package com.ems.pragathisweets.controller.admin;

import com.ems.pragathisweets.dto.ApiResponse;
import com.ems.pragathisweets.dto.ProductResponse;
import com.ems.pragathisweets.dto.admin.StockUpdateRequest;
import com.ems.pragathisweets.service.admin.InventoryService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/inventory")
@RequiredArgsConstructor
@Tag(name = "Admin - Inventory", description = "Stock level management")
public class AdminInventoryController {

    private final InventoryService inventoryService;

    @GetMapping({"", "/overview"})
    public ResponseEntity<ApiResponse<java.util.Map<String, Object>>> getInventoryOverview() {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.getInventoryOverview()));
    }

    @GetMapping("/low-stock")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getLowStock() {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.getLowStockProducts()));
    }

    @PutMapping("/{productId}")
    public ResponseEntity<ApiResponse<ProductResponse>> setStock(@PathVariable Long productId,
                                                                  @Valid @RequestBody StockUpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Stock updated", inventoryService.adjustStock(productId, request.getQuantity())));
    }
}
