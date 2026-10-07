package com.ems.pragathisweets.controller.admin;

import com.ems.pragathisweets.dto.ApiResponse;
import com.ems.pragathisweets.dto.OrderResponse;
import com.ems.pragathisweets.dto.admin.OrderStatusRequest;
import com.ems.pragathisweets.entity.OrderStatus;
import com.ems.pragathisweets.service.admin.AdminOrderService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/orders")
@RequiredArgsConstructor
@Tag(name = "Admin - Orders", description = "Admin order management")
public class AdminOrderController {

    private final AdminOrderService adminOrderService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<OrderResponse>>> getAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String paymentMethod,
            @RequestParam(required = false) String paymentStatus,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String dateRange,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        Page<OrderResponse> results = adminOrderService.searchOrders(
                search,
                paymentMethod,
                paymentStatus,
                status,
                dateRange,
                startDate,
                endDate,
                pageable
        );

        return ResponseEntity.ok(ApiResponse.success(results));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OrderResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(adminOrderService.getById(id)));
    }

    @GetMapping("/{id}/notifications")
    public ResponseEntity<ApiResponse<java.util.List<com.ems.pragathisweets.entity.OrderNotificationLog>>> getNotifications(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(adminOrderService.getOrderNotifications(id)));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<OrderResponse>> updateStatus(@PathVariable Long id,
                                                                    @Valid @RequestBody OrderStatusRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Order status updated", adminOrderService.updateStatus(id, request)));
    }
}
