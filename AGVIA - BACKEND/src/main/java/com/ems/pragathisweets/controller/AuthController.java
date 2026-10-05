package com.ems.pragathisweets.controller;

import com.ems.pragathisweets.dto.*;
import com.ems.pragathisweets.security.UserDetailsImpl;
import com.ems.pragathisweets.service.AuthService;
import com.ems.pragathisweets.service.GoogleAuthService;
import com.ems.pragathisweets.service.MobileOtpAuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Mobile OTP signup, login, verification, and session management")
public class AuthController {

    private final AuthService authService;
    private final MobileOtpAuthService mobileOtpAuthService;
    private final GoogleAuthService googleAuthService;
    private final com.ems.pragathisweets.repository.UserRepository userRepository;

    // Helper to attach HttpOnly authentication cookie
    private void attachAuthCookie(HttpServletRequest request, HttpServletResponse response, String token) {
        if (response == null || token == null || token.isBlank()) return;
        boolean isHttps = request != null && (request.isSecure() || "https".equalsIgnoreCase(request.getHeader("X-Forwarded-Proto")));
        String sameSite = isHttps ? "None" : "Lax";

        ResponseCookie cookie = ResponseCookie.from("agvia_token", token)
                .httpOnly(true)
                .secure(isHttps)
                .sameSite(sameSite)
                .path("/")
                .maxAge(86400)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    // Helper to clear HttpOnly authentication cookie
    private void clearAuthCookie(HttpServletRequest request, HttpServletResponse response) {
        if (response == null) return;
        boolean isHttps = request != null && (request.isSecure() || "https".equalsIgnoreCase(request.getHeader("X-Forwarded-Proto")));
        String sameSite = isHttps ? "None" : "Lax";

        ResponseCookie cookie = ResponseCookie.from("agvia_token", "")
                .httpOnly(true)
                .secure(isHttps)
                .sameSite(sameSite)
                .path("/")
                .maxAge(0)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // MOBILE OTP SIGN UP
    // ─────────────────────────────────────────────────────────────────────────

    @PostMapping("/signup/request-otp")
    @Operation(summary = "Initiate sign-up by validating details and sending OTP to mobile number")
    public ResponseEntity<ApiResponse<SignupOtpResponse>> requestSignupOtp(
            @Valid @RequestBody SignupOtpRequest request,
            HttpServletRequest servletRequest) {
        SignupOtpResponse response = mobileOtpAuthService.requestSignupOtp(request, servletRequest);
        return ResponseEntity.ok(ApiResponse.success(response.getMessage(), response));
    }

    @PostMapping("/signup/verify-otp")
    @Operation(summary = "Verify sign-up OTP, create authenticated user account, and issue JWT")
    public ResponseEntity<ApiResponse<AuthResultResponse>> verifySignupOtp(
            @Valid @RequestBody VerifyOtpRequest request,
            HttpServletRequest servletRequest,
            HttpServletResponse servletResponse) {
        AuthResultResponse response = mobileOtpAuthService.verifySignupOtp(request);
        if (response.getToken() != null) {
            attachAuthCookie(servletRequest, servletResponse, response.getToken());
        }
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response.getMessage(), response));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // MOBILE OTP SIGN IN
    // ─────────────────────────────────────────────────────────────────────────

    @PostMapping("/login")
    @Operation(summary = "Verify credentials and dispatch login OTP to registered mobile number")
    public ResponseEntity<ApiResponse<LoginChallengeResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest servletRequest,
            HttpServletResponse servletResponse) {
        LoginChallengeResponse response = mobileOtpAuthService.login(request, servletRequest);
        if (!response.isRequiresOtp() && response.getToken() != null) {
            attachAuthCookie(servletRequest, servletResponse, response.getToken());
        }
        return ResponseEntity.ok(ApiResponse.success(response.getMessage(), response));
    }

    @PostMapping("/login/verify-otp")
    @Operation(summary = "Verify login OTP and issue authenticated JWT session")
    public ResponseEntity<ApiResponse<AuthResultResponse>> verifyLoginOtp(
            @Valid @RequestBody VerifyOtpRequest request,
            HttpServletRequest servletRequest,
            HttpServletResponse servletResponse) {
        AuthResultResponse response = mobileOtpAuthService.verifyLoginOtp(request);
        if (response.getToken() != null) {
            attachAuthCookie(servletRequest, servletResponse, response.getToken());
        }
        return ResponseEntity.ok(ApiResponse.success(response.getMessage(), response));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // OTP RESEND
    // ─────────────────────────────────────────────────────────────────────────

    @PostMapping("/otp/resend")
    @Operation(summary = "Resend a new OTP with 60s cooldown and previous OTP invalidation")
    public ResponseEntity<ApiResponse<SignupOtpResponse>> resendOtp(
            @Valid @RequestBody ResendOtpRequest request,
            HttpServletRequest servletRequest) {
        SignupOtpResponse response = mobileOtpAuthService.resendOtp(request, servletRequest);
        return ResponseEntity.ok(ApiResponse.success(response.getMessage(), response));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GOOGLE OAUTH SIGN IN
    // ─────────────────────────────────────────────────────────────────────────

    @PostMapping("/google")
    @Operation(summary = "Authenticate patron using verified Google Identity token")
    public ResponseEntity<ApiResponse<AuthResultResponse>> authenticateWithGoogle(
            @Valid @RequestBody GoogleAuthRequest request,
            HttpServletRequest servletRequest,
            HttpServletResponse servletResponse) {
        AuthResultResponse response = googleAuthService.authenticateWithGoogle(request);
        if (response.getToken() != null) {
            attachAuthCookie(servletRequest, servletResponse, response.getToken());
        }
        return ResponseEntity.ok(ApiResponse.success(response.getMessage(), response));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LOGOUT
    // ─────────────────────────────────────────────────────────────────────────

    @PostMapping("/logout")
    @Operation(summary = "Clear authenticated session cookie and logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            HttpServletRequest servletRequest,
            HttpServletResponse servletResponse) {
        clearAuthCookie(servletRequest, servletResponse);
        return ResponseEntity.ok(ApiResponse.success("Logged out successfully", null));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LEGACY & CURRENT USER
    // ─────────────────────────────────────────────────────────────────────────

    @PostMapping("/register")
    @Operation(summary = "Legacy direct registration endpoint")
    public ResponseEntity<ApiResponse<UserResponse>> register(@Valid @RequestBody RegisterRequest request) {
        UserResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Registration successful", response));
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
            UserResponse response = UserResponse.builder()
                    .id(user.getId())
                    .fullName(user.getFullName())
                    .email(user.getEmail())
                    .phone(user.getPhone())
                    .phoneVerified(user.isPhoneVerified())
                    .role(user.getRole() != null ? user.getRole().name() : "ROLE_CUSTOMER")
                    .enabled(user.isEnabled())
                    .build();
            return ResponseEntity.ok(ApiResponse.success(response));
        }
        UserResponse response = UserResponse.builder()
                .id(principal.getId())
                .fullName(principal.getFullName())
                .email(principal.getUsername())
                .phone(principal.getPhone())
                .phoneVerified(principal.isPhoneVerified())
                .role(principal.getAuthorities() != null && !principal.getAuthorities().isEmpty()
                        ? principal.getAuthorities().iterator().next().getAuthority()
                        : "ROLE_CUSTOMER")
                .enabled(principal.isEnabled())
                .build();
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
