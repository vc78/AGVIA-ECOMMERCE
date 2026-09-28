package com.ems.pragathisweets.controller;

import com.ems.pragathisweets.dto.ApiResponse;
import com.ems.pragathisweets.dto.ProfileUpdateRequest;
import com.ems.pragathisweets.dto.UserResponse;
import com.ems.pragathisweets.entity.User;
import com.ems.pragathisweets.exception.ResourceNotFoundException;
import com.ems.pragathisweets.repository.UserRepository;
import com.ems.pragathisweets.security.UserDetailsImpl;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import java.util.Objects;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "User profile management")
public class UserController {

    private final UserRepository userRepository;
    private final com.ems.pragathisweets.service.OtpService otpService;

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<UserResponse>> updateProfile(
            @AuthenticationPrincipal UserDetailsImpl principal,
            @Valid @RequestBody ProfileUpdateRequest request) {

        User user = userRepository.findById(Objects.requireNonNull(principal.getId()))
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + principal.getId()));

        user.setFullName(request.getName());
        user.setPhone(request.getPhone());
        user.setAddress(request.getAddress());
        User saved = userRepository.save(user);

        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", toUserResponse(saved)));
    }

    @PostMapping("/email/send-otp")
    public ResponseEntity<ApiResponse<com.ems.pragathisweets.dto.OtpDispatchResponse>> sendEmailOtp(
            @AuthenticationPrincipal UserDetailsImpl principal,
            @Valid @RequestBody com.ems.pragathisweets.dto.SendEmailOtpRequest request) {
        com.ems.pragathisweets.dto.OtpDispatchResponse res = otpService.sendEmailChangeOtp(principal.getId(), request.getNewEmail());
        String msg = "Verification code sent to " + request.getNewEmail();
        return ResponseEntity.ok(ApiResponse.success(msg, res));
    }

    @PostMapping("/email/verify-otp")
    public ResponseEntity<ApiResponse<UserResponse>> verifyEmailOtp(
            @AuthenticationPrincipal UserDetailsImpl principal,
            @Valid @RequestBody com.ems.pragathisweets.dto.VerifyEmailOtpRequest request) {
        User updated = otpService.verifyEmailChangeOtp(principal.getId(), request.getNewEmail(), request.getOtp());
        return ResponseEntity.ok(ApiResponse.success("Email address updated successfully", toUserResponse(updated)));
    }

    @PostMapping("/phone/send-otp")
    public ResponseEntity<ApiResponse<com.ems.pragathisweets.dto.OtpDispatchResponse>> sendPhoneOtp(
            @AuthenticationPrincipal UserDetailsImpl principal,
            @Valid @RequestBody com.ems.pragathisweets.dto.SendPhoneOtpRequest request) {
        com.ems.pragathisweets.dto.OtpDispatchResponse res = otpService.sendPhoneChangeOtp(principal.getId(), request.getNewPhone());
        String msg = "Verification code sent to " + request.getNewPhone() + " via WhatsApp & SMS";
        return ResponseEntity.ok(ApiResponse.success(msg, res));
    }

    @PostMapping("/phone/verify-otp")
    public ResponseEntity<ApiResponse<UserResponse>> verifyPhoneOtp(
            @AuthenticationPrincipal UserDetailsImpl principal,
            @Valid @RequestBody com.ems.pragathisweets.dto.VerifyPhoneOtpRequest request) {
        User updated = otpService.verifyPhoneChangeOtp(principal.getId(), request.getNewPhone(), request.getOtp());
        return ResponseEntity.ok(ApiResponse.success("Mobile number updated successfully", toUserResponse(updated)));
    }

    private UserResponse toUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .address(user.getAddress())
                .role(user.getRole().name())
                .enabled(user.isEnabled())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
