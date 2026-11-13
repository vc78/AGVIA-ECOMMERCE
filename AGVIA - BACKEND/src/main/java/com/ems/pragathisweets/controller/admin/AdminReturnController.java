package com.ems.pragathisweets.controller.admin;

import com.ems.pragathisweets.dto.AdminReturnDecisionRequest;
import com.ems.pragathisweets.dto.ApiResponse;
import com.ems.pragathisweets.dto.ReturnRequestResponse;
import com.ems.pragathisweets.service.ReturnService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/returns")
@RequiredArgsConstructor
@Tag(name = "Admin - Returns & Exchanges", description = "Admin returns, size exchanges and reverse logistics management")
@PreAuthorize("hasRole('ADMIN')")
public class AdminReturnController {

    private final ReturnService returnService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ReturnRequestResponse>>> getAll(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<ReturnRequestResponse> results = returnService.getAllReturns(status, pageable);
        return ResponseEntity.ok(ApiResponse.success(results));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ReturnRequestResponse>> getById(@PathVariable Long id) {
        ReturnRequestResponse result = returnService.getReturnById(id);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PutMapping("/{id}/decision")
    public ResponseEntity<ApiResponse<ReturnRequestResponse>> updateDecision(
            @PathVariable Long id,
            @Valid @RequestBody AdminReturnDecisionRequest decision) {
        ReturnRequestResponse result = returnService.updateReturnDecision(id, decision);
        return ResponseEntity.ok(ApiResponse.success("Return status updated successfully", result));
    }
}
