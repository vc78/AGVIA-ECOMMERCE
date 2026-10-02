package com.ems.pragathisweets.service;

import com.ems.pragathisweets.dto.*;
import com.ems.pragathisweets.entity.AuthOtpChallenge;
import com.ems.pragathisweets.entity.Role;
import com.ems.pragathisweets.entity.User;
import com.ems.pragathisweets.exception.DuplicateResourceException;
import com.ems.pragathisweets.exception.InvalidCredentialsException;
import com.ems.pragathisweets.exception.OtpException;
import com.ems.pragathisweets.exception.RateLimitExceededException;
import com.ems.pragathisweets.repository.AuthOtpChallengeRepository;
import com.ems.pragathisweets.repository.UserRepository;
import com.ems.pragathisweets.security.JwtService;
import com.ems.pragathisweets.security.UserDetailsImpl;
import com.ems.pragathisweets.service.otp.OtpDeliveryService;
import com.ems.pragathisweets.service.otp.OtpRateLimiter;
import com.ems.pragathisweets.util.PhoneUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.ems.pragathisweets.entity.NotificationType;
import com.ems.pragathisweets.event.AdminNotificationEvent;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class MobileOtpAuthService {

    private final UserRepository userRepository;
    private final AuthOtpChallengeRepository challengeRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final OtpDeliveryService otpDeliveryService;
    private final OtpRateLimiter otpRateLimiter;
    private final EmailService emailService;
    private final ApplicationEventPublisher eventPublisher;

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final int OTP_EXPIRY_SECONDS = 300;
    private static final int MAX_ATTEMPTS = 5;

    // ─────────────────────────────────────────────────────────────────────────
    // SIGN UP FLOW
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    public SignupOtpResponse requestSignupOtp(SignupOtpRequest req, HttpServletRequest servletRequest) {
        if (!req.getPassword().equals(req.getConfirmPassword())) {
            throw new IllegalArgumentException("Passwords do not match.");
        }

        String cleanEmail = req.getEmail().trim().toLowerCase();
        String normalizedPhone = PhoneUtils.normalize(req.getPhone());
        String clientIp = extractClientIp(servletRequest);
        String userAgent = servletRequest.getHeader("User-Agent");

        // Validate duplicates
        if (userRepository.existsByEmail(cleanEmail)) {
            throw new DuplicateResourceException("An account with this email already exists.");
        }
        if (userRepository.existsByPhone(normalizedPhone)) {
            throw new DuplicateResourceException("An account with this mobile number already exists.");
        }

        // Apply rate limits
        otpRateLimiter.checkAndRecordPhone(normalizedPhone);
        otpRateLimiter.checkAndRecordIp(clientIp);

        // Generate 6-digit cryptographic OTP
        String rawOtp = generateSecure6DigitOtp();
        String otpHash = passwordEncoder.encode(rawOtp);
        String challengeId = UUID.randomUUID().toString().replace("-", "");

        // Securely hash password for pending temporary state
        String passwordHash = passwordEncoder.encode(req.getPassword());

        AuthOtpChallenge challenge = AuthOtpChallenge.builder()
                .challengeId(challengeId)
                .phoneNumber(normalizedPhone)
                .purpose(AuthOtpChallenge.PURPOSE_SIGNUP)
                .otpHash(otpHash)
                .status(AuthOtpChallenge.STATUS_PENDING)
                .expiresAt(LocalDateTime.now().plusSeconds(OTP_EXPIRY_SECONDS))
                .attemptCount(0)
                .maxAttempts(MAX_ATTEMPTS)
                .resendCount(0)
                .lastSentAt(LocalDateTime.now())
                .requestIp(clientIp)
                .userAgent(userAgent != null && userAgent.length() > 300 ? userAgent.substring(0, 300) : userAgent)
                .registrationName(req.getFullName().trim())
                .registrationEmail(cleanEmail)
                .registrationPasswordHash(passwordHash)
                .registrationAddress(req.getAddress() != null ? req.getAddress().trim() : "India")
                .build();

        challengeRepository.save(challenge);

        // Dispatch OTP via configured delivery service (Twilio/Mock)
        otpDeliveryService.sendOtp(normalizedPhone, rawOtp, AuthOtpChallenge.PURPOSE_SIGNUP);

        // Also dispatch OTP directly to user's email for verification
        try {
            emailService.sendOtpEmail(cleanEmail, req.getFullName(), rawOtp, "SIGNUP");
        } catch (Exception e) {
            log.warn("[SIGNUP_OTP_EMAIL_WARN] Could not dispatch OTP email to {}: {}", cleanEmail, e.getMessage());
        }

        log.info("[OTP_SIGNUP_INIT] Challenge created: challengeId={}, phone={}", challengeId, PhoneUtils.mask(normalizedPhone));

        return SignupOtpResponse.builder()
                .success(true)
                .message("OTP sent to your mobile number and email successfully")
                .challengeId(challengeId)
                .phoneMasked(PhoneUtils.mask(normalizedPhone))
                .expiresIn(OTP_EXPIRY_SECONDS)
                .devOtp(rawOtp)
                .build();
    }

    @Transactional
    public AuthResultResponse verifySignupOtp(VerifyOtpRequest req) {
        AuthOtpChallenge challenge = challengeRepository.findByChallengeId(req.getChallengeId())
                .orElseThrow(() -> new OtpException("Invalid authentication challenge. Please request a new OTP."));

        if (!AuthOtpChallenge.PURPOSE_SIGNUP.equalsIgnoreCase(challenge.getPurpose())) {
            throw new OtpException("Invalid challenge purpose.");
        }

        validateChallengeState(challenge);

        // Check OTP match
        if (!passwordEncoder.matches(req.getOtp(), challenge.getOtpHash())) {
            challenge.setAttemptCount(challenge.getAttemptCount() + 1);
            if (challenge.getAttemptCount() >= challenge.getMaxAttempts()) {
                challenge.setStatus(AuthOtpChallenge.STATUS_LOCKED);
            }
            challengeRepository.save(challenge);

            if (challenge.isLocked()) {
                throw new OtpException("Too many incorrect attempts. Please request a new OTP.");
            }
            int remaining = challenge.getMaxAttempts() - challenge.getAttemptCount();
            throw new OtpException("Incorrect OTP. Please check the code and try again. (" + remaining + " attempts remaining)");
        }

        // Concurrency guard: double-check user existence right before saving
        if (userRepository.existsByEmail(challenge.getRegistrationEmail())) {
            throw new DuplicateResourceException("An account with this email already exists.");
        }
        if (userRepository.existsByPhone(challenge.getPhoneNumber())) {
            throw new DuplicateResourceException("An account with this mobile number already exists.");
        }

        // Create user account with verified mobile number
        User user = User.builder()
                .fullName(challenge.getRegistrationName())
                .email(challenge.getRegistrationEmail())
                .password(challenge.getRegistrationPasswordHash())
                .phone(challenge.getPhoneNumber())
                .address(challenge.getRegistrationAddress())
                .role(Role.ROLE_USER)
                .enabled(true)
                .phoneVerified(true)
                .build();

        User savedUser = userRepository.save(user);

        // Mark challenge consumed
        challenge.setStatus(AuthOtpChallenge.STATUS_CONSUMED);
        challenge.setVerifiedAt(LocalDateTime.now());
        challenge.setConsumedAt(LocalDateTime.now());
        challenge.setUserId(savedUser.getId());
        // Wipe sensitive temporary registration state
        challenge.setRegistrationPasswordHash(null);
        challengeRepository.save(challenge);

        // Issue JWT token
        UserDetailsImpl userDetails = UserDetailsImpl.build(savedUser);
        String token = jwtService.generateToken(userDetails);

        // Background welcome email (silent failure so registration completes)
        try {
            emailService.sendWelcomeEmail(savedUser.getEmail(), savedUser.getFullName());
        } catch (Exception e) {
            log.warn("[SIGNUP_EMAIL_WARN] Could not send welcome email to {}: {}", savedUser.getEmail(), e.getMessage());
        }

        // Publish real-time event to Admin dashboard
        eventPublisher.publishEvent(new AdminNotificationEvent(
                NotificationType.NEW_CUSTOMER,
                "New Customer Registered",
                savedUser.getFullName() + " registered via Mobile OTP (" + PhoneUtils.mask(savedUser.getPhone()) + ")",
                String.valueOf(savedUser.getId()),
                "USER",
                Map.of(
                        "userId", savedUser.getId(),
                        "customerName", savedUser.getFullName() != null ? savedUser.getFullName() : "",
                        "phone", savedUser.getPhone()
                )
        ));

        log.info("[OTP_SIGNUP_SUCCESS] User created successfully: id={}, phone={}", savedUser.getId(), PhoneUtils.mask(savedUser.getPhone()));

        return AuthResultResponse.builder()
                .success(true)
                .message("Account created successfully")
                .token(token)
                .user(toUserResponse(savedUser))
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SIGN IN FLOW
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    public LoginChallengeResponse login(LoginRequest req, HttpServletRequest servletRequest) {
        String identifier = req.getEffectiveIdentifier();
        if (identifier == null || identifier.isBlank()) {
            throw new IllegalArgumentException("Email or mobile number is required.");
        }
        String clientIp = extractClientIp(servletRequest);
        String userAgent = servletRequest.getHeader("User-Agent");

        // Find user by Email OR Mobile Number
        Optional<User> userOpt;
        if (identifier.contains("@")) {
            userOpt = userRepository.findByEmail(identifier.toLowerCase());
        } else {
            try {
                String normalized = PhoneUtils.normalize(identifier);
                userOpt = userRepository.findByPhone(normalized);
            } catch (Exception e) {
                userOpt = Optional.empty();
            }
        }

        if (userOpt.isEmpty()) {
            throw new InvalidCredentialsException("Invalid email/phone or password");
        }

        User user = userOpt.get();

        if (!user.isEnabled()) {
            throw new InvalidCredentialsException("Account is disabled. Please contact support.");
        }

        // Verify BCrypt password
        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new InvalidCredentialsException("Invalid email/phone or password");
        }

        // Allow atelier administrators to sign in directly with their secure credentials
        if (user.getRole() == Role.ROLE_ADMIN) {
            UserDetailsImpl userDetails = UserDetailsImpl.build(user);
            String token = jwtService.generateToken(userDetails);
            log.info("[ADMIN_LOGIN_SUCCESS] Administrator logged in successfully: id={}, email={}", user.getId(), user.getEmail());
            return LoginChallengeResponse.builder()
                    .success(true)
                    .requiresOtp(false)
                    .token(token)
                    .user(toUserResponse(user))
                    .message("Administrator authenticated successfully")
                    .build();
        }

        // Verify customer has a mobile number
        if (user.getPhone() == null || user.getPhone().isBlank()) {
            throw new OtpException("No mobile number linked with this account. Please contact support.");
        }

        String userPhone = PhoneUtils.normalize(user.getPhone());

        // Apply rate limits
        otpRateLimiter.checkAndRecordPhone(userPhone);
        otpRateLimiter.checkAndRecordIp(clientIp);

        // Generate Login OTP Challenge
        String rawOtp = generateSecure6DigitOtp();
        String otpHash = passwordEncoder.encode(rawOtp);
        String challengeId = UUID.randomUUID().toString().replace("-", "");

        AuthOtpChallenge challenge = AuthOtpChallenge.builder()
                .challengeId(challengeId)
                .userId(user.getId())
                .phoneNumber(userPhone)
                .purpose(AuthOtpChallenge.PURPOSE_LOGIN)
                .otpHash(otpHash)
                .status(AuthOtpChallenge.STATUS_PENDING)
                .expiresAt(LocalDateTime.now().plusSeconds(OTP_EXPIRY_SECONDS))
                .attemptCount(0)
                .maxAttempts(MAX_ATTEMPTS)
                .resendCount(0)
                .lastSentAt(LocalDateTime.now())
                .requestIp(clientIp)
                .userAgent(userAgent != null && userAgent.length() > 300 ? userAgent.substring(0, 300) : userAgent)
                .build();

        challengeRepository.save(challenge);

        // Dispatch OTP to mobile number
        otpDeliveryService.sendOtp(userPhone, rawOtp, AuthOtpChallenge.PURPOSE_LOGIN);

        // Also dispatch OTP to user's registered email
        if (user.getEmail() != null && !user.getEmail().isBlank()) {
            try {
                emailService.sendOtpEmail(user.getEmail(), user.getFullName(), rawOtp, "LOGIN");
            } catch (Exception e) {
                log.warn("[LOGIN_OTP_EMAIL_WARN] Could not dispatch OTP email to {}: {}", user.getEmail(), e.getMessage());
            }
        }

        log.info("[OTP_LOGIN_INIT] Login challenge created for userId={}, phone={}", user.getId(), PhoneUtils.mask(userPhone));

        return LoginChallengeResponse.builder()
                .success(true)
                .requiresOtp(true)
                .challengeId(challengeId)
                .phoneMasked(PhoneUtils.mask(userPhone))
                .expiresIn(OTP_EXPIRY_SECONDS)
                .devOtp(rawOtp)
                .message("OTP sent to your verified mobile number and registered email")
                .build();
    }

    @Transactional
    public AuthResultResponse verifyLoginOtp(VerifyOtpRequest req) {
        AuthOtpChallenge challenge = challengeRepository.findByChallengeId(req.getChallengeId())
                .orElseThrow(() -> new OtpException("Invalid authentication challenge. Please request a new OTP."));

        if (!AuthOtpChallenge.PURPOSE_LOGIN.equalsIgnoreCase(challenge.getPurpose())) {
            throw new OtpException("Invalid challenge purpose.");
        }

        validateChallengeState(challenge);

        // Compare OTP
        if (!passwordEncoder.matches(req.getOtp(), challenge.getOtpHash())) {
            challenge.setAttemptCount(challenge.getAttemptCount() + 1);
            if (challenge.getAttemptCount() >= challenge.getMaxAttempts()) {
                challenge.setStatus(AuthOtpChallenge.STATUS_LOCKED);
            }
            challengeRepository.save(challenge);

            if (challenge.isLocked()) {
                throw new OtpException("Too many incorrect attempts. Please request a new OTP.");
            }
            int remaining = challenge.getMaxAttempts() - challenge.getAttemptCount();
            throw new OtpException("Incorrect OTP. Please check the code and try again. (" + remaining + " attempts remaining)");
        }

        // Mark challenge consumed
        challenge.setStatus(AuthOtpChallenge.STATUS_CONSUMED);
        challenge.setVerifiedAt(LocalDateTime.now());
        challenge.setConsumedAt(LocalDateTime.now());
        challengeRepository.save(challenge);

        // Load authenticated user
        User user = userRepository.findById(challenge.getUserId())
                .orElseThrow(() -> new OtpException("User account not found."));

        if (!user.isPhoneVerified()) {
            user.setPhoneVerified(true);
            userRepository.save(user);
        }

        // Issue JWT token ONLY NOW after successful OTP
        UserDetailsImpl userDetails = UserDetailsImpl.build(user);
        String token = jwtService.generateToken(userDetails);

        log.info("[OTP_LOGIN_SUCCESS] User authenticated successfully: id={}, phone={}", user.getId(), PhoneUtils.mask(user.getPhone()));

        return AuthResultResponse.builder()
                .success(true)
                .message("Login successful")
                .token(token)
                .user(toUserResponse(user))
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RESEND OTP
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    public SignupOtpResponse resendOtp(ResendOtpRequest req, HttpServletRequest servletRequest) {
        AuthOtpChallenge challenge = challengeRepository.findByChallengeId(req.getChallengeId())
                .orElseThrow(() -> new OtpException("Challenge not found. Please start authentication again."));

        if (!AuthOtpChallenge.STATUS_PENDING.equalsIgnoreCase(challenge.getStatus())) {
            throw new OtpException("This verification session is no longer active. Please request a new OTP.");
        }

        // Enforce 60-second backend cooldown
        LocalDateTime lastSent = challenge.getLastSentAt() != null ? challenge.getLastSentAt() : challenge.getCreatedAt();
        long elapsedSeconds = Duration.between(lastSent, LocalDateTime.now()).getSeconds();
        int cooldown = otpRateLimiter.getResendCooldownSeconds();

        if (elapsedSeconds < cooldown) {
            long remaining = cooldown - elapsedSeconds;
            throw new RateLimitExceededException("Please wait " + remaining + " seconds before requesting another OTP.");
        }

        if (challenge.getResendCount() >= 5) {
            throw new RateLimitExceededException("Maximum resend limit reached for this session. Please start over.");
        }

        // Rate limit check
        String clientIp = extractClientIp(servletRequest);
        otpRateLimiter.checkAndRecordPhone(challenge.getPhoneNumber());
        otpRateLimiter.checkAndRecordIp(clientIp);

        // Generate NEW OTP — strictly invalidates old OTP
        String newOtp = generateSecure6DigitOtp();
        challenge.setOtpHash(passwordEncoder.encode(newOtp));
        challenge.setExpiresAt(LocalDateTime.now().plusSeconds(OTP_EXPIRY_SECONDS));
        challenge.setAttemptCount(0); // Reset incorrect attempt count for new OTP
        challenge.setResendCount(challenge.getResendCount() + 1);
        challenge.setLastSentAt(LocalDateTime.now());
        challengeRepository.save(challenge);

        // Send new OTP to mobile number
        otpDeliveryService.sendOtp(challenge.getPhoneNumber(), newOtp, challenge.getPurpose());

        // Also send new OTP to email (either registration email or linked user email)
        String targetEmail = challenge.getRegistrationEmail();
        String recipientName = challenge.getRegistrationName();
        if ((targetEmail == null || targetEmail.isBlank()) && challenge.getUserId() != null) {
            Optional<User> uOpt = userRepository.findById(challenge.getUserId());
            if (uOpt.isPresent()) {
                targetEmail = uOpt.get().getEmail();
                recipientName = uOpt.get().getFullName();
            }
        }
        if (targetEmail != null && !targetEmail.isBlank()) {
            try {
                emailService.sendOtpEmail(targetEmail, recipientName != null ? recipientName : "Patron", newOtp, challenge.getPurpose());
            } catch (Exception e) {
                log.warn("[RESEND_OTP_EMAIL_WARN] Could not dispatch OTP email to {}: {}", targetEmail, e.getMessage());
            }
        }

        log.info("[OTP_RESENT] New OTP sent for challengeId={}, resendCount={}", challenge.getChallengeId(), challenge.getResendCount());

        return SignupOtpResponse.builder()
                .success(true)
                .message("New OTP sent to your mobile number and email successfully")
                .challengeId(challenge.getChallengeId())
                .phoneMasked(PhoneUtils.mask(challenge.getPhoneNumber()))
                .expiresIn(OTP_EXPIRY_SECONDS)
                .devOtp(newOtp)
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    private void validateChallengeState(AuthOtpChallenge challenge) {
        if (AuthOtpChallenge.STATUS_CONSUMED.equalsIgnoreCase(challenge.getStatus())) {
            throw new OtpException("This OTP has already been used. Please request a new OTP.");
        }
        if (AuthOtpChallenge.STATUS_LOCKED.equalsIgnoreCase(challenge.getStatus()) || challenge.isLocked()) {
            throw new OtpException("Too many incorrect attempts. Please request a new OTP.");
        }
        if (AuthOtpChallenge.STATUS_EXPIRED.equalsIgnoreCase(challenge.getStatus()) || challenge.isExpired()) {
            challenge.setStatus(AuthOtpChallenge.STATUS_EXPIRED);
            challengeRepository.save(challenge);
            throw new OtpException("Your OTP has expired. Please request a new code.");
        }
        if (!AuthOtpChallenge.STATUS_PENDING.equalsIgnoreCase(challenge.getStatus())) {
            throw new OtpException("Invalid OTP challenge state.");
        }
    }

    private String generateSecure6DigitOtp() {
        int code = 100000 + SECURE_RANDOM.nextInt(900000);
        return String.valueOf(code);
    }

    private String extractClientIp(HttpServletRequest request) {
        if (request == null) return "unknown";
        String xf = request.getHeader("X-Forwarded-For");
        if (xf != null && !xf.isBlank() && !"unknown".equalsIgnoreCase(xf)) {
            return xf.split(",")[0].trim();
        }
        return request.getRemoteAddr() != null ? request.getRemoteAddr() : "unknown";
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
                .phoneVerified(user.isPhoneVerified())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
