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
 * Thread-safe sliding window rate limiter for login attempts per client IP.
 * Restricts brute-force attempts on /api/auth/login to max 15 requests per 60 seconds per IP.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 1)
public class LoginRateLimiterFilter extends OncePerRequestFilter {

    private static final int MAX_REQUESTS_PER_MINUTE = 15;
    private static final long WINDOW_MILLIS = 60_000L;

    private static class RequestTracker {
        long windowStartTime;
        int requestCount;

        RequestTracker(long windowStartTime) {
            this.windowStartTime = windowStartTime;
            this.requestCount = 1;
        }
    }

    private final Map<String, RequestTracker> ipTrackers = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String uri = request.getRequestURI();
        boolean isProtectedAuthEndpoint = "POST".equalsIgnoreCase(request.getMethod()) && (
                uri.endsWith("/api/auth/login") ||
                uri.endsWith("/api/auth/send-login-otp") ||
                uri.endsWith("/api/auth/signup-otp") ||
                uri.endsWith("/api/auth/verify-login-otp") ||
                uri.endsWith("/api/auth/verify-signup-otp")
        );

        if (isProtectedAuthEndpoint) {
            String clientIp = getClientIp(request);
            long now = System.currentTimeMillis();

            RequestTracker tracker = ipTrackers.compute(clientIp, (key, existing) -> {
                if (existing == null || (now - existing.windowStartTime) > WINDOW_MILLIS) {
                    return new RequestTracker(now);
                } else {
                    existing.requestCount++;
                    return existing;
                }
            });

            if (tracker.requestCount > MAX_REQUESTS_PER_MINUTE) {
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                response.getWriter().write("{\"success\":false,\"message\":\"Too many authentication attempts. Please wait 1 minute before retrying.\",\"data\":null}");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null || xfHeader.isEmpty() || "unknown".equalsIgnoreCase(xfHeader)) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0].trim();
    }
}
