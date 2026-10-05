package com.ems.pragathisweets.controller;

import com.ems.pragathisweets.dto.ApiResponse;
import com.ems.pragathisweets.dto.StoreSettingDto;
import com.ems.pragathisweets.dto.admin.AdminNotificationResponse;
import com.ems.pragathisweets.entity.NotificationType;
import com.ems.pragathisweets.security.UserDetailsImpl;
import com.ems.pragathisweets.service.StoreSettingService;
import com.ems.pragathisweets.service.admin.AdminNotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@Slf4j
@Tag(name = "E-Commerce Settings", description = "Real-time store settings and live operational toggles")
public class StoreSettingController {

    private final StoreSettingService storeSettingService;
    private final AdminNotificationService adminNotificationService;

    /**
     * Public storefront endpoint to retrieve active operational settings (tariffs, announcements, maintenance status).
     */
    @GetMapping("/api/settings")
    @Operation(summary = "Get public store operational settings (shipping rules, announcements, maintenance)")
    public ResponseEntity<ApiResponse<StoreSettingDto>> getPublicSettings() {
        return ResponseEntity.ok(ApiResponse.success(storeSettingService.getSettings()));
    }

    /**
     * Admin endpoint to inspect full boutique settings.
     */
    @GetMapping("/api/admin/settings")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get comprehensive boutique settings for admin panel")
    public ResponseEntity<ApiResponse<StoreSettingDto>> getAdminSettings() {
        return ResponseEntity.ok(ApiResponse.success(storeSettingService.getSettings()));
    }

    /**
     * Admin endpoint to update e-commerce settings in real time.
     */
    @PutMapping("/api/admin/settings")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update store settings and broadcast real-time changes to active sessions")
    public ResponseEntity<ApiResponse<StoreSettingDto>> updateSettings(
            @RequestBody StoreSettingDto request,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        String adminIdentifier = userDetails != null ? userDetails.getUsername() : "ADMIN";
        StoreSettingDto updated = storeSettingService.updateSettings(request, adminIdentifier);
        return ResponseEntity.ok(ApiResponse.success("Boutique settings updated and synchronized successfully", updated));
    }

    /**
     * Admin endpoint to restore factory luxury defaults.
     */
    @PostMapping("/api/admin/settings/reset")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Reset store settings to original defaults")
    public ResponseEntity<ApiResponse<StoreSettingDto>> resetSettings(
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        String adminIdentifier = userDetails != null ? userDetails.getUsername() : "ADMIN";
        StoreSettingDto reset = storeSettingService.resetToDefaults(adminIdentifier);
        return ResponseEntity.ok(ApiResponse.success("Settings restored to factory defaults", reset));
    }

    /**
     * Test notification endpoint: triggers a real-time notification packet through WebSocket.
     */
    @PostMapping("/api/admin/settings/test-notification")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Send an immediate test notification to verify real-time alerts and chime")
    public ResponseEntity<ApiResponse<AdminNotificationResponse>> testRealTimeNotification(
            @RequestParam(defaultValue = "NEW_ORDER") String type,
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String message,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        NotificationType notifType;
        try {
            notifType = NotificationType.valueOf(type.toUpperCase());
        } catch (Exception e) {
            notifType = NotificationType.NEW_ORDER;
        }

        String actualTitle = (title != null && !title.isBlank())
                ? title
                : "Real-Time Test Alert (" + notifType.name() + ")";
        String actualMessage = (message != null && !message.isBlank())
                ? message
                : "Live WebSocket ping verified. Atelier notification channel is functioning in real time!";

        AdminNotificationResponse response = adminNotificationService.createAndPublish(
                notifType,
                actualTitle,
                actualMessage,
                "TEST-" + System.currentTimeMillis() % 10000,
                "SYSTEM",
                null,
                Map.of(
                        "isTest", true,
                        "triggeredBy", userDetails != null ? userDetails.getUsername() : "Admin",
                        "timestamp", System.currentTimeMillis()
                )
        );

        return ResponseEntity.ok(ApiResponse.success("Test notification broadcast dispatched successfully", response));
    }
}
