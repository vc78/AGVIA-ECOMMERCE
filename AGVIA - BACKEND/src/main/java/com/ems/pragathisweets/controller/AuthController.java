package com.ems.pragathisweets.controller;

import com.ems.pragathisweets.dto.*;
import com.ems.pragathisweets.security.UserDetailsImpl;
import com.ems.pragathisweets.service.AuthService;
import com.ems.pragathisweets.service.GoogleAuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Credentials login, registration, Google Sign-In, password recovery, and session management")
public class AuthController {

    private final AuthService authService;
    private final GoogleAuthService googleAuthService;
    private final com.ems.pragathisweets.repository.UserRepository userRepository;

    private void attachAuthCookie(HttpServletRequest request, HttpServletResponse response, String token, boolean persistent) {
        if (response == null || token == null || token.isBlank()) return;
        boolean isHttps = request != null && (request.isSecure() || "https".equalsIgnoreCase(request.getHeader("X-Forwarded-Proto")));
        String sameSite = isHttps ? "None" : "Lax";
        long maxAge = persistent ? 86400 : -1;

        ResponseCookie cookie = ResponseCookie.from("llw_token", token)
                .httpOnly(true)
                .secure(isHttps)
                .sameSite(sameSite)
                .path("/")
                .maxAge(maxAge)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private void clearAuthCookie(HttpServletRequest request, HttpServletResponse response) {
        if (response == null) return;
        boolean isHttps = request != null && (request.isSecure() || "https".equalsIgnoreCase(request.getHeader("X-Forwarded-Proto")));
        String sameSite = isHttps ? "None" : "Lax";

        for (String name : new String[]{"llw_token", "chitrika_token", "agvia_token"}) {
            ResponseCookie cookie = ResponseCookie.from(name, "")
                    .httpOnly(true)
                    .secure(isHttps)
                    .sameSite(sameSite)
                    .path("/")
                    .maxAge(0)
                    .build();
            response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
        }
    }

    @PostMapping("/register")
    @Operation(summary = "Register a new customer account with email and password")
    public ResponseEntity<ApiResponse<AuthResultResponse>> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletRequest servletRequest,
            HttpServletResponse servletResponse) {
        AuthResultResponse response = authService.register(request);
        if (response.getToken() != null) {
            attachAuthCookie(servletRequest, servletResponse, response.getToken(), true);
        }
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Registration successful", response));
    }

    @PostMapping("/login")
    @Operation(summary = "Sign in with email and password")
    public ResponseEntity<ApiResponse<AuthResultResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest servletRequest,
            HttpServletResponse servletResponse) {
        AuthResultResponse response = authService.login(request);
        boolean persistent = !Boolean.FALSE.equals(request.getRememberMe());
        if (response.getToken() != null) {
            attachAuthCookie(servletRequest, servletResponse, response.getToken(), persistent);
        }
        return ResponseEntity.ok(ApiResponse.success(response.getMessage(), response));
    }

    @PostMapping("/google")
    @Operation(summary = "Authenticate customer using verified Google Identity token")
    public ResponseEntity<ApiResponse<AuthResultResponse>> authenticateWithGoogle(
            @Valid @RequestBody GoogleAuthRequest request,
            HttpServletRequest servletRequest,
            HttpServletResponse servletResponse) {
        AuthResultResponse response = googleAuthService.authenticateWithGoogle(request);
        if (response.getToken() != null) {
            attachAuthCookie(servletRequest, servletResponse, response.getToken(), true);
        }
        return ResponseEntity.ok(ApiResponse.success(response.getMessage(), response));
    }

    @PostMapping("/google/link")
    @Operation(summary = "Explicitly link verified Google account to authenticated customer profile")
    public ResponseEntity<ApiResponse<UserResponse>> linkGoogleAccount(
            @AuthenticationPrincipal UserDetailsImpl principal,
            @Valid @RequestBody GoogleAuthRequest request) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Authentication required"));
        }
        UserResponse updated = googleAuthService.linkGoogleAccount(principal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Google account linked successfully", updated));
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Request a single-use password reset link via email")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request,
            HttpServletRequest servletRequest) {
        String ip = servletRequest != null ? servletRequest.getRemoteAddr() : null;
        authService.requestPasswordReset(request, ip);
        return ResponseEntity.ok(ApiResponse.success(
                "If an account exists for that email address, a password reset link has been sent.", null));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Reset password using a valid single-use email token and revoke existing sessions")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request,
            HttpServletRequest servletRequest,
            HttpServletResponse servletResponse) {
        authService.resetPassword(request);
        clearAuthCookie(servletRequest, servletResponse);
        return ResponseEntity.ok(ApiResponse.success(
                "Password has been reset successfully. Please sign in with your new password.", null));
    }

    @PostMapping("/change-password")
    @Operation(summary = "Change password for authenticated user and rotate session tokens")
    public ResponseEntity<ApiResponse<AuthResultResponse>> changePassword(
            @AuthenticationPrincipal UserDetailsImpl principal,
            @Valid @RequestBody ChangePasswordRequest request,
            HttpServletRequest servletRequest,
            HttpServletResponse servletResponse) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Authentication required"));
        }
        AuthResultResponse response = authService.changePassword(principal.getId(), request);
        if (response.getToken() != null) {
            attachAuthCookie(servletRequest, servletResponse, response.getToken(), true);
        }
        return ResponseEntity.ok(ApiResponse.success("Password updated successfully", response));
    }

    @PostMapping("/logout")
    @Operation(summary = "Revoke active token sessions, clear authenticated cookie, and logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @AuthenticationPrincipal UserDetailsImpl principal,
            HttpServletRequest servletRequest,
            HttpServletResponse servletResponse) {
        if (principal != null) {
            authService.logoutUser(principal.getId());
        }
        clearAuthCookie(servletRequest, servletResponse);
        return ResponseEntity.ok(ApiResponse.success("Logged out successfully", null));
    }

    @GetMapping("/me")
    @Operation(summary = "Get current authenticated user profile")
    public ResponseEntity<ApiResponse<UserResponse>> currentUser(@AuthenticationPrincipal UserDetailsImpl principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Authentication required"));
        }
        com.ems.pragathisweets.entity.User user = userRepository.findById(principal.getId()).orElse(null);
        if (user != null) {
            return ResponseEntity.ok(ApiResponse.success(authService.toUserResponse(user)));
        }
        UserResponse response = UserResponse.builder()
                .id(principal.getId())
                .fullName(principal.getFullName())
                .email(principal.getUsername())
                .phone(principal.getPhone())
                .phoneVerified(principal.isPhoneVerified())
                .role(principal.getAuthorities() != null && !principal.getAuthorities().isEmpty()
                        ? principal.getAuthorities().iterator().next().getAuthority()
                        : "ROLE_USER")
                .enabled(principal.isEnabled())
                .build();
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
