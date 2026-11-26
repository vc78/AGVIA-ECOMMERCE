package com.ems.pragathisweets.service;

import com.ems.pragathisweets.dto.*;
import com.ems.pragathisweets.entity.NotificationType;
import com.ems.pragathisweets.entity.PasswordResetToken;
import com.ems.pragathisweets.entity.Role;
import com.ems.pragathisweets.entity.User;
import com.ems.pragathisweets.event.AdminNotificationEvent;
import com.ems.pragathisweets.exception.DuplicateResourceException;
import com.ems.pragathisweets.exception.InvalidCredentialsException;
import com.ems.pragathisweets.exception.ResourceNotFoundException;
import com.ems.pragathisweets.repository.PasswordResetTokenRepository;
import com.ems.pragathisweets.repository.UserRepository;
import com.ems.pragathisweets.security.JwtService;
import com.ems.pragathisweets.security.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private static final int RESET_TOKEN_TTL_MINUTES = 15;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final EmailService emailService;
    private final ApplicationEventPublisher eventPublisher;

    @Value("${app.frontend.url:https://agvia-ecommerce.vercel.app}")
    private String frontendUrl;

    @Transactional
    public AuthResultResponse register(RegisterRequest request) {
        String cleanEmail = request.getEmail().trim().toLowerCase();

        if (request.getConfirmPassword() == null || !request.getPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("Passwords do not match.");
        }

        validatePasswordStrength(request.getPassword());

        if (Boolean.FALSE.equals(request.getTermsAccepted())) {
            throw new IllegalArgumentException("Please accept the Terms & Privacy Policy to create an account.");
        }

        if (userRepository.existsByEmailIgnoreCase(cleanEmail)) {
            throw new DuplicateResourceException("An account with this email already exists.");
        }

        User user = User.builder()
                .fullName(request.getFullName().trim())
                .email(cleanEmail)
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone() != null && !request.getPhone().isBlank() ? request.getPhone().trim() : null)
                .address(request.getAddress() != null && !request.getAddress().isBlank() ? request.getAddress().trim() : null)
                .role(Role.ROLE_USER)
                .authProvider("LOCAL")
                .enabled(true)
                .phoneVerified(false)
                .tokenVersion(0)
                .build();

        User saved = userRepository.save(user);
        UserDetailsImpl userDetails = UserDetailsImpl.build(saved);
        String token = jwtService.generateToken(userDetails);

        try {
            emailService.sendWelcomeEmail(saved.getEmail(), saved.getFullName());
        } catch (Exception ex) {
            log.warn("[AUTH_WELCOME_EMAIL_WARN] Failed to queue welcome email for userId={}", saved.getId());
        }

        eventPublisher.publishEvent(new AdminNotificationEvent(
                NotificationType.NEW_CUSTOMER,
                "New Customer Registered",
                saved.getFullName() + " has created an account.",
                String.valueOf(saved.getId()),
                "USER",
                Map.of(
                        "userId", saved.getId(),
                        "customerName", saved.getFullName() != null ? saved.getFullName() : "",
                        "email", saved.getEmail()
                )
        ));

        log.info("[AUTH_REGISTER_SUCCESS] userId={}, role={}", saved.getId(), saved.getRole());

        return AuthResultResponse.builder()
                .success(true)
                .message("Account created successfully")
                .token(token)
                .user(toUserResponse(saved))
                .build();
    }

    @Transactional(readOnly = true)
    public AuthResultResponse login(LoginRequest request) {
        String identifier = request.getEffectiveIdentifier().trim().toLowerCase();
        if (identifier.isEmpty() || request.getPassword() == null || request.getPassword().isEmpty()) {
            throw new InvalidCredentialsException("Invalid email or password");
        }

        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(identifier, request.getPassword())
            );
        } catch (AuthenticationException ex) {
            log.warn("[AUTH_LOGIN_FAILURE] Failed login attempt for identifier={}", maskEmail(identifier));
            throw new InvalidCredentialsException("Invalid email or password");
        }

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        if (!userDetails.isEnabled()) {
            log.warn("[AUTH_LOGIN_DISABLED] Blocked disabled userId={}", userDetails.getId());
            throw new InvalidCredentialsException("Invalid email or password");
        }

        User user = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new InvalidCredentialsException("Invalid email or password"));

        String token = jwtService.generateToken(userDetails);
        log.info("[AUTH_LOGIN_SUCCESS] userId={}, role={}", user.getId(), user.getRole());

        return AuthResultResponse.builder()
                .success(true)
                .message("Signed in successfully")
                .token(token)
                .user(toUserResponse(user))
                .build();
    }

    @Transactional
    public void requestPasswordReset(ForgotPasswordRequest request, String clientIp) {
        if (request == null || request.getEmail() == null || request.getEmail().isBlank()) {
            return;
        }
        String cleanEmail = request.getEmail().trim().toLowerCase();
        userRepository.findByEmailIgnoreCase(cleanEmail).ifPresent(user -> {
            if (!user.isEnabled()) {
                return;
            }
            LocalDateTime now = LocalDateTime.now();
            passwordResetTokenRepository.invalidateAllActiveByUserId(user.getId(), now);

            String rawToken = generateSecureResetToken();
            String tokenHash = sha256Hex(rawToken);

            PasswordResetToken resetToken = PasswordResetToken.builder()
                    .user(user)
                    .tokenHash(tokenHash)
                    .expiresAt(now.plusMinutes(RESET_TOKEN_TTL_MINUTES))
                    .used(false)
                    .requestIp(clientIp != null && clientIp.length() > 64 ? clientIp.substring(0, 64) : clientIp)
                    .build();
            passwordResetTokenRepository.save(resetToken);

            String baseUrl = frontendUrl != null ? frontendUrl.replaceAll("/+$", "") : "https://agvia-ecommerce.vercel.app";
            String resetLink = baseUrl + "/reset-password?token=" + rawToken;
            try {
                emailService.sendPasswordResetEmail(user.getEmail(), user.getFullName(), resetLink);
            } catch (Exception ex) {
                log.warn("[PASSWORD_RESET_EMAIL_WARN] Failed sending reset link for userId={}", user.getId());
            }
            log.info("[PASSWORD_RESET_REQUESTED] Issued reset token for userId={}", user.getId());
        });
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        if (request.getToken() == null || request.getToken().isBlank()) {
            throw new IllegalArgumentException("Invalid or expired password reset link.");
        }
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("Passwords do not match.");
        }
        validatePasswordStrength(request.getNewPassword());

        String tokenHash = sha256Hex(request.getToken().trim());
        PasswordResetToken resetToken = passwordResetTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new IllegalArgumentException("This password reset link is invalid or has expired."));

        if (resetToken.isUsed() || resetToken.isExpired()) {
            throw new IllegalArgumentException("This password reset link is invalid or has expired.");
        }

        User user = resetToken.getUser();
        if (user == null || !user.isEnabled()) {
            throw new IllegalArgumentException("Unable to reset password for this account.");
        }

        LocalDateTime now = LocalDateTime.now();
        resetToken.setUsed(true);
        resetToken.setUsedAt(now);
        passwordResetTokenRepository.save(resetToken);
        passwordResetTokenRepository.invalidateAllActiveByUserId(user.getId(), now);

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        if (user.getAuthProvider() == null || "GOOGLE".equalsIgnoreCase(user.getAuthProvider())) {
            user.setAuthProvider(user.getGoogleId() != null ? "GOOGLE_LINKED" : "LOCAL");
        }
        user.incrementTokenVersion();
        userRepository.save(user);

        log.info("[PASSWORD_RESET_COMPLETED] Password reset and active sessions revoked for userId={}", user.getId());
    }

    @Transactional
    public AuthResultResponse changePassword(Long userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new InvalidCredentialsException("Current password is incorrect.");
        }
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("New passwords do not match.");
        }
        validatePasswordStrength(request.getNewPassword());
        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new IllegalArgumentException("New password must be different from your current password.");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.incrementTokenVersion();
        User saved = userRepository.save(user);

        UserDetailsImpl updatedPrincipal = UserDetailsImpl.build(saved);
        String newToken = jwtService.generateToken(updatedPrincipal);
        log.info("[PASSWORD_CHANGE_SUCCESS] Updated password and rotated tokenVersion for userId={}", saved.getId());

        return AuthResultResponse.builder()
                .success(true)
                .message("Password updated successfully")
                .token(newToken)
                .user(toUserResponse(saved))
                .build();
    }

    @Transactional
    public void logoutUser(Long userId) {
        if (userId == null) return;
        userRepository.findById(userId).ifPresent(user -> {
            user.incrementTokenVersion();
            userRepository.save(user);
            log.info("[AUTH_LOGOUT] Revoked active JWT sessions for userId={}", userId);
        });
    }

    public void validatePasswordStrength(String password) {
        if (password == null || password.length() < 8 || password.length() > 128) {
            throw new IllegalArgumentException("Password must be between 8 and 128 characters.");
        }
        boolean hasLower = false;
        boolean hasUpper = false;
        boolean hasDigit = false;
        for (int i = 0; i < password.length(); i++) {
            char c = password.charAt(i);
            if (Character.isLowerCase(c)) hasLower = true;
            else if (Character.isUpperCase(c)) hasUpper = true;
            else if (Character.isDigit(c)) hasDigit = true;
        }
        if (!hasLower || !hasUpper || !hasDigit) {
            throw new IllegalArgumentException("Password must contain at least one uppercase letter, one lowercase letter, and one number.");
        }
    }

    private String generateSecureResetToken() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    public static String sha256Hex(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 unavailable", ex);
        }
    }

    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) return "***";
        int at = email.indexOf('@');
        if (at <= 2) return "***" + email.substring(at);
        return email.substring(0, 2) + "***" + email.substring(at);
    }

    public UserResponse toUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .address(user.getAddress())
                .role(user.getRole().name())
                .enabled(user.isEnabled())
                .phoneVerified(user.isPhoneVerified())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
