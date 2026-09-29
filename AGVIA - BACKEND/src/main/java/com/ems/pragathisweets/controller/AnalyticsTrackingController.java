package com.ems.pragathisweets.controller;

import com.ems.pragathisweets.dto.ApiResponse;
import com.ems.pragathisweets.dto.analytics.AnalyticsTrackRequest;
import com.ems.pragathisweets.entity.User;
import com.ems.pragathisweets.repository.UserRepository;
import com.ems.pragathisweets.service.admin.WebsiteAnalyticsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
@Tag(name = "Analytics Ingestion", description = "Public non-blocking analytics event tracking")
public class AnalyticsTrackingController {

    private final WebsiteAnalyticsService websiteAnalyticsService;
    private final UserRepository userRepository;

    @PostMapping("/track")
    @Operation(summary = "Track website event", description = "Non-blocking public endpoint for page views, product views, add-to-cart, shares, and checkouts")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> trackEvent(@RequestBody AnalyticsTrackRequest request) {
        Long authUserId = resolveCurrentUserId();
        websiteAnalyticsService.recordEvent(request, authUserId);
        return ResponseEntity.ok(ApiResponse.success(Map.of("tracked", true)));
    }

    @PostMapping("/events")
    @Operation(summary = "Alias for event tracking")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> trackEventAlias(@RequestBody AnalyticsTrackRequest request) {
        return trackEvent(request);
    }

    private Long resolveCurrentUserId() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
                String username = auth.getName();
                if (username != null) {
                    Optional<User> userOpt = userRepository.findByEmail(username);
                    if (userOpt.isPresent()) {
                        return userOpt.get().getId();
                    }
                }
            }
        } catch (Exception ignored) {
        }
        return null;
    }
}
