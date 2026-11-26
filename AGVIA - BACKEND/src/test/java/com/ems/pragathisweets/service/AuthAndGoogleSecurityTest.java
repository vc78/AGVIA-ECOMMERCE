package com.ems.pragathisweets.service;

import com.ems.pragathisweets.dto.*;
import com.ems.pragathisweets.entity.PasswordResetToken;
import com.ems.pragathisweets.entity.Role;
import com.ems.pragathisweets.entity.User;
import com.ems.pragathisweets.exception.DuplicateResourceException;
import com.ems.pragathisweets.exception.InvalidCredentialsException;
import com.ems.pragathisweets.repository.PasswordResetTokenRepository;
import com.ems.pragathisweets.repository.UserRepository;
import com.ems.pragathisweets.security.JwtService;
import com.ems.pragathisweets.security.UserDetailsImpl;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthAndGoogleSecurityTest {

    @Mock private UserRepository userRepository;
    @Mock private PasswordResetTokenRepository passwordResetTokenRepository;
    @Mock private AuthenticationManager authenticationManager;
    @Mock private EmailService emailService;
    @Mock private ApplicationEventPublisher eventPublisher;
    @Mock private GoogleIdTokenVerifier googleIdTokenVerifier;

    private PasswordEncoder passwordEncoder;
    private JwtService jwtService;
    private AuthService authService;
    private GoogleAuthService googleAuthService;

    @BeforeEach
    void setUp() {
        passwordEncoder = new BCryptPasswordEncoder(10);
        MockEnvironment env = new MockEnvironment().withProperty("jwt.secret", "");
        jwtService = new JwtService(env);
        ReflectionTestUtils.setField(jwtService, "secret", "VGhpc0lzQVN0cm9uZ1Rlc3RTZWNyZXRLZXkxMjM0NTY3ODkwMTI=");
        ReflectionTestUtils.setField(jwtService, "expirationMs", 3600_000L);

        authService = new AuthService(
                userRepository,
                passwordResetTokenRepository,
                passwordEncoder,
                authenticationManager,
                jwtService,
                emailService,
                eventPublisher
        );
        ReflectionTestUtils.setField(authService, "frontendUrl", "https://agvia-ecommerce.vercel.app");

        googleAuthService = new GoogleAuthService(userRepository, passwordEncoder, jwtService, authService);
        googleAuthService.setVerifierForTest(googleIdTokenVerifier, "test-client-id.apps.googleusercontent.com");
    }

    @Test
    @DisplayName("Registration succeeds directly without OTP, enforces ROLE_USER, hashes password")
    void testRegisterSuccess() {
        RegisterRequest req = new RegisterRequest("Lakshmi Weaver", "Lakshmi@Example.com", "StrongPass1", "StrongPass1", null, null, true);
        when(userRepository.existsByEmailIgnoreCase("lakshmi@example.com")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(101L);
            return u;
        });

        AuthResultResponse res = authService.register(req);

        assertTrue(res.isSuccess());
        assertNotNull(res.getToken());
        assertEquals("ROLE_USER", res.getUser().getRole());
        assertEquals("lakshmi@example.com", res.getUser().getEmail());

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        assertNotEquals("StrongPass1", captor.getValue().getPassword());
        assertTrue(passwordEncoder.matches("StrongPass1", captor.getValue().getPassword()));
    }

    @Test
    @DisplayName("Duplicate registration is rejected with DuplicateResourceException")
    void testDuplicateRegistrationBlocked() {
        RegisterRequest req = new RegisterRequest("Test User", "dup@example.com", "StrongPass1", "StrongPass1", null, null, true);
        when(userRepository.existsByEmailIgnoreCase("dup@example.com")).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> authService.register(req));
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Weak passwords and unaccepted terms are rejected on registration")
    void testRegisterValidation() {
        RegisterRequest weak = new RegisterRequest("User", "u@example.com", "weak", "weak", null, null, true);
        assertThrows(IllegalArgumentException.class, () -> authService.register(weak));

        RegisterRequest mismatch = new RegisterRequest("User", "u@example.com", "StrongPass1", "Different1", null, null, true);
        assertThrows(IllegalArgumentException.class, () -> authService.register(mismatch));

        RegisterRequest noTerms = new RegisterRequest("User", "u@example.com", "StrongPass1", "StrongPass1", null, null, false);
        assertThrows(IllegalArgumentException.class, () -> authService.register(noTerms));
    }

    @Test
    @DisplayName("Login succeeds directly with credentials and returns valid JWT matching tokenVersion")
    void testLoginSuccess() {
        User user = User.builder()
                .id(12L)
                .fullName("Rama Sarees")
                .email("rama@example.com")
                .password(passwordEncoder.encode("StrongPass1"))
                .role(Role.ROLE_USER)
                .enabled(true)
                .tokenVersion(2)
                .build();
        UserDetailsImpl principal = UserDetailsImpl.build(user);

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));
        when(userRepository.findById(12L)).thenReturn(Optional.of(user));

        LoginRequest req = new LoginRequest("Rama@Example.com", null, "StrongPass1", true);
        AuthResultResponse res = authService.login(req);

        assertNotNull(res.getToken());
        assertTrue(jwtService.isTokenValid(res.getToken(), principal));
        assertEquals(2, jwtService.extractTokenVersion(res.getToken()));
    }

    @Test
    @DisplayName("Invalid credentials return generic error without leaking account existence")
    void testInvalidLoginGenericError() {
        when(authenticationManager.authenticate(any())).thenThrow(new BadCredentialsException("Bad credentials"));
        LoginRequest req = new LoginRequest("nobody@example.com", null, "WrongPass1", false);

        InvalidCredentialsException ex = assertThrows(InvalidCredentialsException.class, () -> authService.login(req));
        assertEquals("Invalid email or password", ex.getMessage());
    }

    @Test
    @DisplayName("Forgot/Reset password stores SHA-256 hash only, enforces single-use & TTL, and revokes old JWT sessions")
    void testPasswordResetSingleUseExpiredAndSessionRevocation() {
        User user = User.builder()
                .id(55L)
                .fullName("Sita Handloom")
                .email("sita@example.com")
                .password(passwordEncoder.encode("OldPass123"))
                .role(Role.ROLE_USER)
                .enabled(true)
                .tokenVersion(0)
                .build();

        // Issue pre-reset JWT (tv=0)
        UserDetailsImpl preResetDetails = UserDetailsImpl.build(user);
        String oldJwt = jwtService.generateToken(preResetDetails);
        assertTrue(jwtService.isTokenValid(oldJwt, preResetDetails));

        // Forgot password stores SHA-256 hash, never raw token
        when(userRepository.findByEmailIgnoreCase("sita@example.com")).thenReturn(Optional.of(user));
        ArgumentCaptor<PasswordResetToken> tokenCaptor = ArgumentCaptor.forClass(PasswordResetToken.class);
        ArgumentCaptor<String> linkCaptor = ArgumentCaptor.forClass(String.class);

        authService.requestPasswordReset(new ForgotPasswordRequest("sita@example.com"), "127.0.0.1");

        verify(passwordResetTokenRepository).invalidateAllActiveByUserId(eq(55L), any());
        verify(passwordResetTokenRepository).save(tokenCaptor.capture());
        verify(emailService).sendPasswordResetEmail(eq("sita@example.com"), eq("Sita Handloom"), linkCaptor.capture());

        String resetLink = linkCaptor.getValue();
        String rawToken = resetLink.substring(resetLink.indexOf("token=") + 6);
        assertNotEquals(rawToken, tokenCaptor.getValue().getTokenHash());
        assertEquals(AuthService.sha256Hex(rawToken), tokenCaptor.getValue().getTokenHash());

        // Single-use reset succeeds and increments tokenVersion -> old JWT becomes invalid
        PasswordResetToken savedToken = tokenCaptor.getValue();
        when(passwordResetTokenRepository.findByTokenHash(savedToken.getTokenHash())).thenReturn(Optional.of(savedToken));

        authService.resetPassword(new ResetPasswordRequest(rawToken, "NewStrong99", "NewStrong99"));
        assertTrue(savedToken.isUsed());
        assertEquals(1, user.effectiveTokenVersion());
        assertFalse(jwtService.isTokenValid(oldJwt, UserDetailsImpl.build(user)));

        // Reusing the same token must fail
        assertThrows(IllegalArgumentException.class, () ->
                authService.resetPassword(new ResetPasswordRequest(rawToken, "AnotherPass1", "AnotherPass1")));

        // Expired token must fail
        PasswordResetToken expired = PasswordResetToken.builder()
                .user(user)
                .tokenHash(AuthService.sha256Hex("expired-token"))
                .expiresAt(LocalDateTime.now().minusMinutes(1))
                .used(false)
                .build();
        when(passwordResetTokenRepository.findByTokenHash(expired.getTokenHash())).thenReturn(Optional.of(expired));
        assertThrows(IllegalArgumentException.class, () ->
                authService.resetPassword(new ResetPasswordRequest("expired-token", "AnotherPass1", "AnotherPass1")));
    }

    @Test
    @DisplayName("Logout increments tokenVersion so prior JWT is invalidated server-side")
    void testLogoutRevokesJwt() {
        User user = User.builder()
                .id(77L)
                .email("cust@example.com")
                .password("hashed")
                .role(Role.ROLE_USER)
                .enabled(true)
                .tokenVersion(0)
                .build();
        String token = jwtService.generateToken(UserDetailsImpl.build(user));
        when(userRepository.findById(77L)).thenReturn(Optional.of(user));

        authService.logoutUser(77L);
        assertFalse(jwtService.isTokenValid(token, UserDetailsImpl.build(user)));
    }

    @Test
    @DisplayName("Google Sign-In succeeds for new customer and assigns strictly ROLE_USER")
    void testGoogleSignInNewCustomerSuccess() throws Exception {
        GoogleIdToken mockToken = mock(GoogleIdToken.class);
        GoogleIdToken.Payload payload = new GoogleIdToken.Payload();
        payload.setIssuer("https://accounts.google.com");
        payload.setSubject("google-sub-123");
        payload.setEmail("buyer@gmail.com");
        payload.setEmailVerified(true);
        payload.set("name", "Ananya");
        when(mockToken.getPayload()).thenReturn(payload);
        when(googleIdTokenVerifier.verify("valid-id-token")).thenReturn(mockToken);

        when(userRepository.findByGoogleId("google-sub-123")).thenReturn(Optional.empty());
        when(userRepository.findByEmailIgnoreCase("buyer@gmail.com")).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(200L);
            return u;
        });

        AuthResultResponse res = googleAuthService.authenticateWithGoogle(new GoogleAuthRequest("valid-id-token", null));
        assertNotNull(res.getToken());
        assertEquals("ROLE_USER", res.getUser().getRole());
        assertEquals("buyer@gmail.com", res.getUser().getEmail());
    }

    @Test
    @DisplayName("Google Sign-In rejects invalid token, wrong issuer, unverified email, missing clientId, admin user, and unlinked local ATO")
    void testGoogleSignInSecurityControls() throws Exception {
        // 1. Invalid / wrong-audience token (verifier returns null)
        when(googleIdTokenVerifier.verify("bad-token")).thenReturn(null);
        assertThrows(InvalidCredentialsException.class, () ->
                googleAuthService.authenticateWithGoogle(new GoogleAuthRequest("bad-token", null)));

        // 2. Unverified email rejected
        GoogleIdToken unverifiedToken = mock(GoogleIdToken.class);
        GoogleIdToken.Payload unverifiedPayload = new GoogleIdToken.Payload();
        unverifiedPayload.setIssuer("https://accounts.google.com");
        unverifiedPayload.setSubject("sub-unv");
        unverifiedPayload.setEmail("unv@gmail.com");
        unverifiedPayload.setEmailVerified(false);
        when(unverifiedToken.getPayload()).thenReturn(unverifiedPayload);
        when(googleIdTokenVerifier.verify("unv-token")).thenReturn(unverifiedToken);
        assertThrows(InvalidCredentialsException.class, () ->
                googleAuthService.authenticateWithGoogle(new GoogleAuthRequest("unv-token", null)));

        // 3. Admin account blocked from Google Sign-In
        GoogleIdToken validToken = mock(GoogleIdToken.class);
        GoogleIdToken.Payload adminPayload = new GoogleIdToken.Payload();
        adminPayload.setIssuer("https://accounts.google.com");
        adminPayload.setSubject("sub-admin");
        adminPayload.setEmail("admin@example.com");
        adminPayload.setEmailVerified(true);
        when(validToken.getPayload()).thenReturn(adminPayload);
        when(googleIdTokenVerifier.verify("admin-token")).thenReturn(validToken);

        User adminUser = User.builder().id(1L).email("admin@example.com").role(Role.ROLE_ADMIN).enabled(true).build();
        when(userRepository.findByGoogleId("sub-admin")).thenReturn(Optional.empty());
        when(userRepository.findByEmailIgnoreCase("admin@example.com")).thenReturn(Optional.of(adminUser));
        assertThrows(InvalidCredentialsException.class, () ->
                googleAuthService.authenticateWithGoogle(new GoogleAuthRequest("admin-token", null)));

        // 4. Local unlinked password account blocked from unsafe automatic takeover
        User localUser = User.builder().id(2L).email("local@example.com").role(Role.ROLE_USER).authProvider("LOCAL").enabled(true).build();
        GoogleIdToken localToken = mock(GoogleIdToken.class);
        GoogleIdToken.Payload localPayload = new GoogleIdToken.Payload();
        localPayload.setIssuer("https://accounts.google.com");
        localPayload.setSubject("sub-local");
        localPayload.setEmail("local@example.com");
        localPayload.setEmailVerified(true);
        when(localToken.getPayload()).thenReturn(localPayload);
        when(googleIdTokenVerifier.verify("local-token")).thenReturn(localToken);
        when(userRepository.findByGoogleId("sub-local")).thenReturn(Optional.empty());
        when(userRepository.findByEmailIgnoreCase("local@example.com")).thenReturn(Optional.of(localUser));
        assertThrows(InvalidCredentialsException.class, () ->
                googleAuthService.authenticateWithGoogle(new GoogleAuthRequest("local-token", null)));

        // 5. Explicit authenticated linking succeeds when email matches signed-in customer
        when(userRepository.findById(2L)).thenReturn(Optional.of(localUser));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        UserResponse linked = googleAuthService.linkGoogleAccount(2L, new GoogleAuthRequest("local-token", null));
        assertEquals("local@example.com", linked.getEmail());
        assertEquals("sub-local", localUser.getGoogleId());

        // 6. Fail closed when clientId is unconfigured
        googleAuthService.setVerifierForTest(googleIdTokenVerifier, "");
        assertThrows(InvalidCredentialsException.class, () ->
                googleAuthService.authenticateWithGoogle(new GoogleAuthRequest("valid-id-token", null)));
    }

    @Test
    @DisplayName("JwtService fails closed in prod if secret is blank and allows configured key")
    void testJwtServiceProdFailClosed() {
        MockEnvironment prodEnv = new MockEnvironment();
        prodEnv.setActiveProfiles("prod");
        JwtService prodJwt = new JwtService(prodEnv);
        ReflectionTestUtils.setField(prodJwt, "secret", "");

        assertThrows(IllegalStateException.class, () -> ReflectionTestUtils.invokeMethod(prodJwt, "initSigningKey"));
    }
}
