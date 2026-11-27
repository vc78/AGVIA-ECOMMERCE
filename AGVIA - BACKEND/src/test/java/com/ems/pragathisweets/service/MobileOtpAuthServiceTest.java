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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MobileOtpAuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private AuthOtpChallengeRepository challengeRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private OtpDeliveryService otpDeliveryService;

    @Mock
    private OtpRateLimiter otpRateLimiter;

    @Mock
    private EmailService emailService;

    @Mock
    private org.springframework.context.ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private MobileOtpAuthService mobileOtpAuthService;

    private MockHttpServletRequest httpServletRequest;

    @BeforeEach
    void setUp() {
        httpServletRequest = new MockHttpServletRequest();
        httpServletRequest.setRemoteAddr("127.0.0.1");
        httpServletRequest.addHeader("User-Agent", "JUnit-Test-Agent");
    }

    @Test
    @DisplayName("PhoneUtils: Indian mobile number normalization and masking")
    void testPhoneUtils() {
        assertEquals("+919876543210", PhoneUtils.normalize("9876543210"));
        assertEquals("+919876543210", PhoneUtils.normalize("09876543210"));
        assertEquals("+919876543210", PhoneUtils.normalize("+91 98765 43210"));
        assertEquals("+919876543210", PhoneUtils.normalize("+91-9876543210"));

        assertEquals("98******10", PhoneUtils.mask("+919876543210"));
        assertThrows(IllegalArgumentException.class, () -> PhoneUtils.normalize("12345"));
    }

    @Test
    @DisplayName("Sign-Up: Initiates challenge, hashes OTP, does NOT create final account yet")
    void testRequestSignupOtp_Success() {
        SignupOtpRequest req = SignupOtpRequest.builder()
                .fullName("Priya Sharma")
                .email("priya@example.com")
                .phone("9876543210")
                .password("agvia@secret")
                .confirmPassword("agvia@secret")
                .build();

        when(userRepository.existsByEmail("priya@example.com")).thenReturn(false);
        when(userRepository.existsByPhone("+919876543210")).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("$2a$10$hashedOtpOrPassword");

        SignupOtpResponse response = mobileOtpAuthService.requestSignupOtp(req, httpServletRequest);

        assertNotNull(response);
        assertTrue(response.isSuccess());
        assertNotNull(response.getChallengeId());
        assertEquals("98******10", response.getPhoneMasked());
        assertEquals(300, response.getExpiresIn());

        ArgumentCaptor<AuthOtpChallenge> captor = ArgumentCaptor.forClass(AuthOtpChallenge.class);
        verify(challengeRepository).save(captor.capture());
        AuthOtpChallenge savedChallenge = captor.getValue();

        assertEquals("+919876543210", savedChallenge.getPhoneNumber());
        assertEquals(AuthOtpChallenge.PURPOSE_SIGNUP, savedChallenge.getPurpose());
        assertEquals(AuthOtpChallenge.STATUS_PENDING, savedChallenge.getStatus());
        assertEquals("priya@example.com", savedChallenge.getRegistrationEmail());
        assertNotNull(savedChallenge.getRegistrationPasswordHash());

        verify(otpDeliveryService).sendOtp(eq("+919876543210"), anyString(), eq(AuthOtpChallenge.PURPOSE_SIGNUP));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Sign-Up: Rejects duplicate email")
    void testRequestSignupOtp_DuplicateEmail() {
        SignupOtpRequest req = SignupOtpRequest.builder()
                .fullName("Priya Sharma")
                .email("existing@agvia.com")
                .phone("9876543210")
                .password("agvia@secret")
                .confirmPassword("agvia@secret")
                .build();

        when(userRepository.existsByEmail("existing@agvia.com")).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () ->
                mobileOtpAuthService.requestSignupOtp(req, httpServletRequest));
        verify(challengeRepository, never()).save(any());
    }

    @Test
    @DisplayName("Sign-Up: Rejects password mismatch")
    void testRequestSignupOtp_PasswordMismatch() {
        SignupOtpRequest req = SignupOtpRequest.builder()
                .fullName("Priya Sharma")
                .email("priya@agvia.com")
                .phone("9876543210")
                .password("agvia@secret1")
                .confirmPassword("agvia@secret2")
                .build();

        assertThrows(IllegalArgumentException.class, () ->
                mobileOtpAuthService.requestSignupOtp(req, httpServletRequest));
    }

    @Test
    @DisplayName("Verify Sign-Up OTP: Valid OTP creates user with phoneVerified=true and issues JWT")
    void testVerifySignupOtp_Success() {
        String challengeId = "valid-challenge-123";
        AuthOtpChallenge challenge = AuthOtpChallenge.builder()
                .challengeId(challengeId)
                .phoneNumber("+919876543210")
                .purpose(AuthOtpChallenge.PURPOSE_SIGNUP)
                .otpHash("$2a$10$hashedOtp")
                .status(AuthOtpChallenge.STATUS_PENDING)
                .expiresAt(LocalDateTime.now().plusMinutes(4))
                .attemptCount(0)
                .maxAttempts(5)
                .registrationName("Priya Sharma")
                .registrationEmail("priya@example.com")
                .registrationPasswordHash("$2a$10$hashedPass")
                .registrationAddress("Hyderabad, India")
                .build();

        when(challengeRepository.findByChallengeId(challengeId)).thenReturn(Optional.of(challenge));
        when(passwordEncoder.matches("123456", "$2a$10$hashedOtp")).thenReturn(true);
        when(userRepository.existsByEmail("priya@example.com")).thenReturn(false);
        when(userRepository.existsByPhone("+919876543210")).thenReturn(false);

        User savedUser = User.builder()
                .id(42L)
                .fullName("Priya Sharma")
                .email("priya@example.com")
                .phone("+919876543210")
                .role(Role.ROLE_USER)
                .phoneVerified(true)
                .enabled(true)
                .build();
        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(jwtService.generateToken(any(UserDetailsImpl.class))).thenReturn("jwt-token-xyz");

        VerifyOtpRequest verifyReq = VerifyOtpRequest.builder()
                .challengeId(challengeId)
                .otp("123456")
                .build();

        AuthResultResponse response = mobileOtpAuthService.verifySignupOtp(verifyReq);

        assertNotNull(response);
        assertTrue(response.isSuccess());
        assertEquals("jwt-token-xyz", response.getToken());
        assertEquals("Priya Sharma", response.getUser().getFullName());
        assertTrue(response.getUser().isPhoneVerified());
        assertEquals(AuthOtpChallenge.STATUS_CONSUMED, challenge.getStatus());
        assertNull(challenge.getRegistrationPasswordHash());
    }

    @Test
    @DisplayName("Verify Sign-Up OTP: Incorrect OTP increments attempt count and throws OtpException")
    void testVerifySignupOtp_WrongOtp() {
        String challengeId = "challenge-wrong-otp";
        AuthOtpChallenge challenge = AuthOtpChallenge.builder()
                .challengeId(challengeId)
                .phoneNumber("+919876543210")
                .purpose(AuthOtpChallenge.PURPOSE_SIGNUP)
                .otpHash("$2a$10$hashedOtp")
                .status(AuthOtpChallenge.STATUS_PENDING)
                .expiresAt(LocalDateTime.now().plusMinutes(4))
                .attemptCount(0)
                .maxAttempts(5)
                .build();

        when(challengeRepository.findByChallengeId(challengeId)).thenReturn(Optional.of(challenge));
        when(passwordEncoder.matches("999999", "$2a$10$hashedOtp")).thenReturn(false);

        VerifyOtpRequest verifyReq = VerifyOtpRequest.builder()
                .challengeId(challengeId)
                .otp("999999")
                .build();

        OtpException ex = assertThrows(OtpException.class, () ->
                mobileOtpAuthService.verifySignupOtp(verifyReq));
        assertTrue(ex.getMessage().contains("Incorrect OTP"));
        assertEquals(1, challenge.getAttemptCount());
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Verify Sign-Up OTP: 5 incorrect attempts locks challenge")
    void testVerifySignupOtp_LocksAfter5Attempts() {
        String challengeId = "challenge-lock";
        AuthOtpChallenge challenge = AuthOtpChallenge.builder()
                .challengeId(challengeId)
                .phoneNumber("+919876543210")
                .purpose(AuthOtpChallenge.PURPOSE_SIGNUP)
                .otpHash("$2a$10$hashedOtp")
                .status(AuthOtpChallenge.STATUS_PENDING)
                .expiresAt(LocalDateTime.now().plusMinutes(4))
                .attemptCount(4)
                .maxAttempts(5)
                .build();

        when(challengeRepository.findByChallengeId(challengeId)).thenReturn(Optional.of(challenge));
        when(passwordEncoder.matches("000000", "$2a$10$hashedOtp")).thenReturn(false);

        VerifyOtpRequest verifyReq = VerifyOtpRequest.builder()
                .challengeId(challengeId)
                .otp("000000")
                .build();

        assertThrows(OtpException.class, () ->
                mobileOtpAuthService.verifySignupOtp(verifyReq));
        assertEquals(5, challenge.getAttemptCount());
        assertEquals(AuthOtpChallenge.STATUS_LOCKED, challenge.getStatus());
    }

    @Test
    @DisplayName("Sign-In: Valid credentials dispatch OTP, require OTP, but NEVER issue JWT before OTP verification")
    void testLogin_ValidCredentials_RequiresOtp() {
        LoginRequest req = new LoginRequest("priya@example.com", null, "agvia@secret");

        User existingUser = User.builder()
                .id(10L)
                .fullName("Priya Sharma")
                .email("priya@example.com")
                .password("$2a$10$hashedDbPassword")
                .phone("+919876543210")
                .role(Role.ROLE_USER)
                .enabled(true)
                .phoneVerified(true)
                .build();

        when(userRepository.findByEmail("priya@example.com")).thenReturn(Optional.of(existingUser));
        when(passwordEncoder.matches("agvia@secret", "$2a$10$hashedDbPassword")).thenReturn(true);
        when(passwordEncoder.encode(anyString())).thenReturn("$2a$10$hashedOtp");

        LoginChallengeResponse response = mobileOtpAuthService.login(req, httpServletRequest);

        assertNotNull(response);
        assertTrue(response.isRequiresOtp());
        assertNotNull(response.getChallengeId());
        assertEquals("98******10", response.getPhoneMasked());

        // CRITICAL SECURITY ASSERTION: JWT service MUST NOT be called during customer initial login
        verify(jwtService, never()).generateToken(any());
        verify(otpDeliveryService).sendOtp(eq("+919876543210"), anyString(), eq(AuthOtpChallenge.PURPOSE_LOGIN));
    }

    @Test
    @DisplayName("Sign-In: Admin authenticates directly without OTP requirement")
    void testLogin_Admin_DirectAuthentication() {
        LoginRequest req = new LoginRequest("admin@agvia.com", null, "agvia@123");

        User adminUser = User.builder()
                .id(1L)
                .fullName("AGVIA Administrator")
                .email("admin@agvia.com")
                .password("$2a$10$hashedAdminPassword")
                .role(Role.ROLE_ADMIN)
                .enabled(true)
                .build();

        when(userRepository.findByEmail("admin@agvia.com")).thenReturn(Optional.of(adminUser));
        when(passwordEncoder.matches("agvia@123", "$2a$10$hashedAdminPassword")).thenReturn(true);
        when(jwtService.generateToken(any())).thenReturn("mock.admin.jwt.token");

        LoginChallengeResponse response = mobileOtpAuthService.login(req, httpServletRequest);

        assertNotNull(response);
        assertTrue(response.isSuccess());
        assertFalse(response.isRequiresOtp());
        assertEquals("mock.admin.jwt.token", response.getToken());
        assertNotNull(response.getUser());
        assertEquals("ROLE_ADMIN", response.getUser().getRole());
        verify(jwtService).generateToken(any());
        verify(otpDeliveryService, never()).sendOtp(anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("Sign-In: Invalid password throws InvalidCredentialsException without exposing details")
    void testLogin_InvalidPassword() {
        LoginRequest req = new LoginRequest("priya@example.com", null, "wrong-pass");

        User existingUser = User.builder()
                .id(10L)
                .email("priya@example.com")
                .password("$2a$10$hashedDbPassword")
                .enabled(true)
                .build();

        when(userRepository.findByEmail("priya@example.com")).thenReturn(Optional.of(existingUser));
        when(passwordEncoder.matches("wrong-pass", "$2a$10$hashedDbPassword")).thenReturn(false);

        assertThrows(InvalidCredentialsException.class, () ->
                mobileOtpAuthService.login(req, httpServletRequest));
        verify(challengeRepository, never()).save(any());
    }

    @Test
    @DisplayName("Verify Sign-In OTP: Consumes challenge and issues JWT")
    void testVerifyLoginOtp_Success() {
        String challengeId = "login-chal-123";
        AuthOtpChallenge challenge = AuthOtpChallenge.builder()
                .challengeId(challengeId)
                .userId(10L)
                .phoneNumber("+919876543210")
                .purpose(AuthOtpChallenge.PURPOSE_LOGIN)
                .otpHash("$2a$10$hashedOtp")
                .status(AuthOtpChallenge.STATUS_PENDING)
                .expiresAt(LocalDateTime.now().plusMinutes(3))
                .attemptCount(0)
                .maxAttempts(5)
                .build();

        User user = User.builder()
                .id(10L)
                .fullName("Priya Sharma")
                .email("priya@example.com")
                .phone("+919876543210")
                .role(Role.ROLE_USER)
                .enabled(true)
                .phoneVerified(true)
                .build();

        when(challengeRepository.findByChallengeId(challengeId)).thenReturn(Optional.of(challenge));
        when(passwordEncoder.matches("654321", "$2a$10$hashedOtp")).thenReturn(true);
        when(userRepository.findById(10L)).thenReturn(Optional.of(user));
        when(jwtService.generateToken(any(UserDetailsImpl.class))).thenReturn("jwt-login-token");

        VerifyOtpRequest req = VerifyOtpRequest.builder()
                .challengeId(challengeId)
                .otp("654321")
                .build();

        AuthResultResponse response = mobileOtpAuthService.verifyLoginOtp(req);

        assertNotNull(response);
        assertTrue(response.isSuccess());
        assertEquals("jwt-login-token", response.getToken());
        assertEquals(AuthOtpChallenge.STATUS_CONSUMED, challenge.getStatus());
        verify(jwtService).generateToken(any(UserDetailsImpl.class));
    }

    @Test
    @DisplayName("Resend OTP: Enforces 60-second cooldown")
    void testResendOtp_CooldownEnforced() {
        String challengeId = "chal-resend";
        AuthOtpChallenge challenge = AuthOtpChallenge.builder()
                .challengeId(challengeId)
                .phoneNumber("+919876543210")
                .purpose(AuthOtpChallenge.PURPOSE_LOGIN)
                .status(AuthOtpChallenge.STATUS_PENDING)
                .lastSentAt(LocalDateTime.now().minusSeconds(10)) // Only 10 seconds ago!
                .resendCount(0)
                .build();

        when(challengeRepository.findByChallengeId(challengeId)).thenReturn(Optional.of(challenge));
        when(otpRateLimiter.getResendCooldownSeconds()).thenReturn(60);

        ResendOtpRequest req = ResendOtpRequest.builder().challengeId(challengeId).build();

        RateLimitExceededException ex = assertThrows(RateLimitExceededException.class, () ->
                mobileOtpAuthService.resendOtp(req, httpServletRequest));
        assertTrue(ex.getMessage().contains("Please wait"));
        verify(otpDeliveryService, never()).sendOtp(anyString(), anyString(), anyString());
    }
}
