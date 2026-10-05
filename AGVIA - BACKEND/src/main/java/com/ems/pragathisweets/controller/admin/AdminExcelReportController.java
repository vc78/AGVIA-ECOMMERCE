package com.ems.pragathisweets.controller.admin;

import com.ems.pragathisweets.dto.ApiResponse;
import com.ems.pragathisweets.service.admin.ExcelReportingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/reports/orders-excel")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Admin - Excel Reporting Layer", description = "AGVIA_ORDERS.xlsx export and on-demand regeneration from MySQL")
public class AdminExcelReportController {

    private final ExcelReportingService excelReportingService;

    @GetMapping
    @Operation(summary = "Download authoritative AGVIA_ORDERS.xlsx report generated from MySQL")
    public ResponseEntity<Resource> downloadOrdersExcel() {
        File file = excelReportingService.getOrGenerateExcelReport();

        Resource resource = new FileSystemResource(file);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getName() + "\"")
                .header(HttpHeaders.ACCESS_CONTROL_EXPOSE_HEADERS, HttpHeaders.CONTENT_DISPOSITION)
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .contentLength(file.length())
                .body(resource);
    }

    @PostMapping("/regenerate")
    @Operation(summary = "Regenerate AGVIA_ORDERS.xlsx fresh from MySQL database records")
    public ResponseEntity<ApiResponse<Map<String, Object>>> regenerateOrdersExcel() {
        excelReportingService.regenerateExcelReport();
        Map<String, Object> status = excelReportingService.getExcelSyncStatus();
        return ResponseEntity.ok(ApiResponse.success("Excel report regenerated successfully from MySQL", status));
    }

    @GetMapping("/status")
    @Operation(summary = "Get AGVIA_ORDERS.xlsx synchronization and health status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSyncStatus() {
        return ResponseEntity.ok(ApiResponse.success(excelReportingService.getExcelSyncStatus()));
    }
}
