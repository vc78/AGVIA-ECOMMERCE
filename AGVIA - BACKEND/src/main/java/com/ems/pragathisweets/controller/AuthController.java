package com.ems.pragathisweets.controller;

import com.ems.pragathisweets.dto.*;
import com.ems.pragathisweets.security.UserDetailsImpl;
import com.ems.pragathisweets.service.AuthService;
import com.ems.pragathisweets.service.MobileOtpAuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
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
    private final com.ems.pragathisweets.repository.UserRepository userRepository;

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
            @Valid @RequestBody VerifyOtpRequest request) {
        AuthResultResponse response = mobileOtpAuthService.verifySignupOtp(request);
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
            HttpServletRequest servletRequest) {
        LoginChallengeResponse response = mobileOtpAuthService.login(request, servletRequest);
        return ResponseEntity.ok(ApiResponse.success(response.getMessage(), response));
    }

    @PostMapping("/login/verify-otp")
    @Operation(summary = "Verify login OTP and issue authenticated JWT session")
    public ResponseEntity<ApiResponse<AuthResultResponse>> verifyLoginOtp(
            @Valid @RequestBody VerifyOtpRequest request) {
        AuthResultResponse response = mobileOtpAuthService.verifyLoginOtp(request);
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
