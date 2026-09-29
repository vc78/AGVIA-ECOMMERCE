package com.ems.pragathisweets.controller.admin;

import com.ems.pragathisweets.dto.ApiResponse;
import com.ems.pragathisweets.dto.admin.DashboardResponse;
import com.ems.pragathisweets.dto.admin.SalesReportResponse;
import com.ems.pragathisweets.dto.analytics.*;
import com.ems.pragathisweets.service.admin.AnalyticsService;
import com.ems.pragathisweets.service.admin.WebsiteAnalyticsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/admin/analytics")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin - Analytics", description = "Website analytics and dashboard metrics")
public class AdminAnalyticsController {

    private final AnalyticsService analyticsService;
    private final WebsiteAnalyticsService websiteAnalyticsService;

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<DashboardResponse>> getDashboard() {
        return ResponseEntity.ok(ApiResponse.success(analyticsService.getDashboard()));
    }

    @GetMapping("/sales-report")
    public ResponseEntity<ApiResponse<SalesReportResponse>> getSalesReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        return ResponseEntity.ok(ApiResponse.success(analyticsService.getSalesReport(startDate, endDate)));
    }

    @GetMapping("/overview")
    @Operation(summary = "Get aggregated website analytics overview")
    public ResponseEntity<ApiResponse<AnalyticsOverviewResponse>> getOverview(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        LocalDate end = endDate != null ? endDate : LocalDate.now();
        LocalDate start = startDate != null ? startDate : end.minusDays(29);
        return ResponseEntity.ok(ApiResponse.success(websiteAnalyticsService.getOverview(start, end)));
    }

    @GetMapping("/trends")
    @Operation(summary = "Get daily trend analytics")
    public ResponseEntity<ApiResponse<List<AnalyticsTrendItem>>> getTrends(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        LocalDate end = endDate != null ? endDate : LocalDate.now();
        LocalDate start = startDate != null ? startDate : end.minusDays(29);
        return ResponseEntity.ok(ApiResponse.success(websiteAnalyticsService.getTrends(start, end)));
    }

    @GetMapping("/products")
    @Operation(summary = "Get top performing products")
    public ResponseEntity<ApiResponse<List<TopProductAnalyticsItem>>> getTopProducts(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "10") int limit) {

        LocalDate end = endDate != null ? endDate : LocalDate.now();
        LocalDate start = startDate != null ? startDate : end.minusDays(29);
        return ResponseEntity.ok(ApiResponse.success(websiteAnalyticsService.getTopProducts(start, end, limit)));
    }

    @GetMapping("/pages")
    @Operation(summary = "Get top visited public pages")
    public ResponseEntity<ApiResponse<List<TopPageItem>>> getTopPages(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "10") int limit) {

        LocalDate end = endDate != null ? endDate : LocalDate.now();
        LocalDate start = startDate != null ? startDate : end.minusDays(29);
        return ResponseEntity.ok(ApiResponse.success(websiteAnalyticsService.getTopPages(start, end, limit)));
    }

    @GetMapping("/devices")
    @Operation(summary = "Get device distribution breakdown")
    public ResponseEntity<ApiResponse<List<DeviceStatsItem>>> getDevices(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        LocalDate end = endDate != null ? endDate : LocalDate.now();
        LocalDate start = startDate != null ? startDate : end.minusDays(29);
        return ResponseEntity.ok(ApiResponse.success(websiteAnalyticsService.getDeviceStats(start, end)));
    }

    @GetMapping("/sources")
    @Operation(summary = "Get traffic sources breakdown")
    public ResponseEntity<ApiResponse<List<TrafficSourceItem>>> getSources(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        LocalDate end = endDate != null ? endDate : LocalDate.now();
        LocalDate start = startDate != null ? startDate : end.minusDays(29);
        return ResponseEntity.ok(ApiResponse.success(websiteAnalyticsService.getTrafficSources(start, end)));
    }

    @GetMapping("/funnel")
    @Operation(summary = "Get conversion funnel metrics")
    public ResponseEntity<ApiResponse<ConversionFunnelResponse>> getFunnel(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        LocalDate end = endDate != null ? endDate : LocalDate.now();
        LocalDate start = startDate != null ? startDate : end.minusDays(29);
        return ResponseEntity.ok(ApiResponse.success(websiteAnalyticsService.getFunnel(start, end)));
    }

    @GetMapping("/recent")
    @Operation(summary = "Get recent chronological activity")
    public ResponseEntity<ApiResponse<List<RecentActivityItem>>> getRecentActivity(
            @RequestParam(defaultValue = "20") int limit) {

        return ResponseEntity.ok(ApiResponse.success(websiteAnalyticsService.getRecentActivity(limit)));
    }
}
