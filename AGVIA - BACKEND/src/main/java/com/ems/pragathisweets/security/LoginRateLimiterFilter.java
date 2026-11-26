package com.ems.pragathisweets.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Thread-safe sliding window rate limiter for authentication, password-reset, and public tracking endpoints.
 * Bounds memory usage by periodically evicting expired IP trackers.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 1)
public class LoginRateLimiterFilter extends OncePerRequestFilter {

    private static final int MAX_AUTH_REQUESTS_PER_MINUTE = 15;
    private static final int MAX_RESET_REQUESTS_PER_MINUTE = 6;
    private static final int MAX_TRACK_REQUESTS_PER_MINUTE = 30;
    private static final long WINDOW_MILLIS = 60_000L;
    private static final int MAX_TRACKERS = 10_000;

    private static class RequestTracker {
        long windowStartTime;
        int requestCount;

        RequestTracker(long windowStartTime) {
            this.windowStartTime = windowStartTime;
            this.requestCount = 1;
        }
    }

    private final Map<String, RequestTracker> trackers = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String uri = request.getRequestURI();
        String method = request.getMethod();
        int limit = resolveLimit(method, uri);

        if (limit > 0) {
            long now = System.currentTimeMillis();
            if (trackers.size() > MAX_TRACKERS) {
                trackers.entrySet().removeIf(entry -> (now - entry.getValue().windowStartTime) > WINDOW_MILLIS);
            }

            String bucket = resolveBucket(uri);
            String key = getClientIp(request) + ":" + bucket;

            RequestTracker tracker = trackers.compute(key, (k, existing) -> {
                if (existing == null || (now - existing.windowStartTime) > WINDOW_MILLIS) {
                    return new RequestTracker(now);
                }
                existing.requestCount++;
                return existing;
            });

            if (tracker.requestCount > limit) {
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                response.getWriter().write("{\"success\":false,\"message\":\"Too many requests. Please wait a minute before retrying.\",\"data\":null}");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private int resolveLimit(String method, String uri) {
        if (uri == null) return 0;
        if ("POST".equalsIgnoreCase(method)) {
            if (uri.endsWith("/api/auth/forgot-password") || uri.endsWith("/api/auth/reset-password")) {
                return MAX_RESET_REQUESTS_PER_MINUTE;
            }
            if (uri.endsWith("/api/auth/login")
                    || uri.endsWith("/api/auth/register")
                    || uri.endsWith("/api/auth/google")
                    || uri.endsWith("/api/auth/change-password")
                    || uri.endsWith("/api/newsletter/subscribe")) {
                return MAX_AUTH_REQUESTS_PER_MINUTE;
            }
        }
        if ("GET".equalsIgnoreCase(method) && uri.contains("/api/orders/public-track")) {
            return MAX_TRACK_REQUESTS_PER_MINUTE;
        }
        return 0;
    }

    private String resolveBucket(String uri) {
        if (uri.endsWith("/forgot-password") || uri.endsWith("/reset-password")) return "reset";
        if (uri.contains("/public-track")) return "track";
        return "auth";
    }

    private String getClientIp(HttpServletRequest request) {
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank() && !"unknown".equalsIgnoreCase(realIp)) {
            return realIp.trim();
        }
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader != null && !xfHeader.isBlank() && !"unknown".equalsIgnoreCase(xfHeader)) {
            return xfHeader.split(",")[0].trim();
        }
        return request.getRemoteAddr() != null ? request.getRemoteAddr() : "unknown";
    }
}
