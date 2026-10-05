package com.ems.pragathisweets.controller.admin;

import com.ems.pragathisweets.dto.ApiResponse;
import com.ems.pragathisweets.dto.admin.AdminNotificationResponse;
import com.ems.pragathisweets.dto.admin.UnreadCountResponse;
import com.ems.pragathisweets.security.UserDetailsImpl;
import com.ems.pragathisweets.service.admin.AdminNotificationService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/notifications")
@RequiredArgsConstructor
@Tag(name = "Admin - Notifications", description = "Real-time administrator notification management")
public class AdminNotificationController {

    private final AdminNotificationService notificationService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<AdminNotificationResponse>>> getNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Long adminId = userDetails != null ? userDetails.getId() : null;
        Page<AdminNotificationResponse> result = notificationService.getNotifications(pageable, adminId);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<UnreadCountResponse>> getUnreadCount(
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        Long adminId = userDetails != null ? userDetails.getId() : null;
        return ResponseEntity.ok(ApiResponse.success(notificationService.getUnreadCount(adminId)));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<ApiResponse<AdminNotificationResponse>> markAsRead(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Notification marked as read", notificationService.markAsRead(id)));
    }

    @PatchMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead(
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        Long adminId = userDetails != null ? userDetails.getId() : null;
        notificationService.markAllAsRead(adminId);
        return ResponseEntity.ok(ApiResponse.success("All notifications marked as read", null));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteNotification(@PathVariable Long id) {
        notificationService.deleteNotification(id);
        return ResponseEntity.ok(ApiResponse.success("Notification deleted successfully", null));
    }

    @PostMapping("/test")
    public ResponseEntity<ApiResponse<AdminNotificationResponse>> sendTestNotification(
            @RequestParam(defaultValue = "NEW_ORDER") String type,
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String message,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        com.ems.pragathisweets.entity.NotificationType notifType;
        try {
            notifType = com.ems.pragathisweets.entity.NotificationType.valueOf(type.toUpperCase());
        } catch (Exception e) {
            notifType = com.ems.pragathisweets.entity.NotificationType.NEW_ORDER;
        }

        String actualTitle = (title != null && !title.isBlank())
                ? title
                : "Real-Time Test Alert (" + notifType.name() + ")";
        String actualMessage = (message != null && !message.isBlank())
                ? message
                : "Live WebSocket ping verified. Atelier notification channel is functioning in real time!";

        AdminNotificationResponse response = notificationService.createAndPublish(
                notifType,
                actualTitle,
                actualMessage,
                "TEST-" + (System.currentTimeMillis() % 10000),
                "SYSTEM",
                null,
                java.util.Map.of(
                        "isTest", true,
                        "triggeredBy", userDetails != null ? userDetails.getUsername() : "Admin",
                        "timestamp", System.currentTimeMillis()
                )
        );

        return ResponseEntity.ok(ApiResponse.success("Test notification broadcast dispatched successfully", response));
    }
}

