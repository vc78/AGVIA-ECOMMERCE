package com.ems.pragathisweets.service;

import com.ems.pragathisweets.dto.AuthResultResponse;
import com.ems.pragathisweets.dto.GoogleAuthRequest;
import com.ems.pragathisweets.dto.UserResponse;
import com.ems.pragathisweets.entity.Role;
import com.ems.pragathisweets.entity.User;
import com.ems.pragathisweets.exception.InvalidCredentialsException;
import com.ems.pragathisweets.repository.UserRepository;
import com.ems.pragathisweets.security.JwtService;
import com.ems.pragathisweets.security.UserDetailsImpl;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.Collections;
import java.util.Optional;
import java.util.Set;

@Service
@Slf4j
public class GoogleAuthService {

    private static final Set<String> ALLOWED_ISSUERS = Set.of(
            "https://accounts.google.com",
            "accounts.google.com"
    );
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthService authService;
    private GoogleIdTokenVerifier customVerifierForTest;

    @Value("${app.google.client-id:${GOOGLE_CLIENT_ID:}}")
    private String googleClientId;

    @Autowired
    public GoogleAuthService(UserRepository userRepository,
                             PasswordEncoder passwordEncoder,
                             JwtService jwtService,
                             AuthService authService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authService = authService;
    }

    // Package-private test hook for deterministic unit/integration testing without external HTTP calls
    void setVerifierForTest(GoogleIdTokenVerifier verifier, String clientId) {
        this.customVerifierForTest = verifier;
        this.googleClientId = clientId;
    }

    @Transactional
    public AuthResultResponse authenticateWithGoogle(GoogleAuthRequest request) {
        GoogleIdToken.Payload payload = verifyAndExtractPayload(request);

        String email = normalizeEmail(payload.getEmail());
        String googleId = payload.getSubject();
        String name = extractDisplayName(payload, email);

        // 1. Primary lookup by stable Google subject ID (`sub`)
        Optional<User> byGoogleId = userRepository.findByGoogleId(googleId);
        User user;

        if (byGoogleId.isPresent()) {
            user = byGoogleId.get();
            enforceCustomerOnlyGooglePolicy(user);
            user = userRepository.save(user);
            log.info("[GOOGLE_AUTH_SUCCESS] Authenticated existing Google userId={}", user.getId());
        } else {
            // 2. Check for existing account with the same verified email
            Optional<User> byEmail = userRepository.findByEmailIgnoreCase(email);
            if (byEmail.isPresent()) {
                user = byEmail.get();
                enforceCustomerOnlyGooglePolicy(user);

                if (user.getGoogleId() != null && !user.getGoogleId().isBlank() && !user.getGoogleId().equals(googleId)) {
                    log.warn("[GOOGLE_AUTH_MISMATCH] Rejected mismatched Google sub for userId={}", user.getId());
                    throw new InvalidCredentialsException("This email is already associated with a different Google account.");
                }

                // Prevent pre-hijacking ATO: unlinked LOCAL password accounts must be linked while signed in
                if (user.getGoogleId() == null || user.getGoogleId().isBlank()) {
                    log.warn("[GOOGLE_AUTH_UNLINKED_LOCAL] Blocked automatic merge onto local password account userId={}", user.getId());
                    throw new InvalidCredentialsException(
                            "An account with this email already exists with password sign-in. Sign in with your password first to use or link Google.");
                }
            } else {
                // 3. Create new verified customer account (strictly ROLE_USER, never ADMIN)
                user = User.builder()
                        .fullName(name)
                        .email(email)
                        .password(passwordEncoder.encode(generateRandomPasswordPlaceholder()))
                        .role(Role.ROLE_USER)
                        .enabled(true)
                        .phoneVerified(false)
                        .authProvider("GOOGLE")
                        .googleId(googleId)
                        .tokenVersion(0)
                        .build();

                user = userRepository.save(user);
                log.info("[GOOGLE_AUTH_CREATED] Created customer account via Google userId={}", user.getId());
            }
        }

        UserDetailsImpl userDetails = UserDetailsImpl.build(user);
        String token = jwtService.generateToken(userDetails);
        UserResponse userResponse = authService.toUserResponse(user);

        return AuthResultResponse.builder()
                .success(true)
                .message("Signed in successfully with Google")
                .token(token)
                .user(userResponse)
                .build();
    }

    /**
     * Explicit, authenticated Google account linking for an already-signed-in customer.
     */
    @Transactional
    public UserResponse linkGoogleAccount(Long authenticatedUserId, GoogleAuthRequest request) {
        User currentUser = userRepository.findById(authenticatedUserId)
                .orElseThrow(() -> new InvalidCredentialsException("Authentication required."));

        if (currentUser.getRole() == Role.ROLE_ADMIN) {
            throw new InvalidCredentialsException("Administrator accounts cannot be linked to Google Sign-In.");
        }

        GoogleIdToken.Payload payload = verifyAndExtractPayload(request);
        String verifiedEmail = normalizeEmail(payload.getEmail());
        String googleId = payload.getSubject();

        if (!verifiedEmail.equalsIgnoreCase(currentUser.getEmail())) {
            throw new IllegalArgumentException("Google account email does not match your signed-in account email.");
        }

        Optional<User> duplicateGoogle = userRepository.findByGoogleId(googleId);
        if (duplicateGoogle.isPresent() && !duplicateGoogle.get().getId().equals(currentUser.getId())) {
            throw new IllegalArgumentException("This Google account is already linked to another user.");
        }

        currentUser.setGoogleId(googleId);
        currentUser.setAuthProvider("GOOGLE_LINKED");
        User saved = userRepository.save(currentUser);
        log.info("[GOOGLE_ACCOUNT_LINKED] Customer userId={} explicitly linked Google identity", saved.getId());
        return authService.toUserResponse(saved);
    }

    private GoogleIdToken.Payload verifyAndExtractPayload(GoogleAuthRequest request) {
        if (googleClientId == null || googleClientId.trim().isEmpty()) {
            log.error("[GOOGLE_AUTH_MISCONFIGURED] GOOGLE_CLIENT_ID is missing; failing closed.");
            throw new InvalidCredentialsException("Google Sign-In is not configured on this server.");
        }

        String idTokenString = request != null ? request.getCredential() : null;
        if (idTokenString == null || idTokenString.trim().isEmpty()) {
            throw new InvalidCredentialsException("Google authentication credential must not be empty.");
        }

        GoogleIdToken.Payload payload = verifyGoogleIdToken(idTokenString.trim());
        if (payload == null) {
            throw new InvalidCredentialsException("Invalid or expired Google authentication credential.");
        }

        String issuer = payload.getIssuer();
        if (issuer == null || !ALLOWED_ISSUERS.contains(issuer)) {
            log.warn("[GOOGLE_AUTH_ISSUER_REJECTED] Unexpected issuer={}", issuer);
            throw new InvalidCredentialsException("Invalid Google token issuer.");
        }

        if (!Boolean.TRUE.equals(payload.getEmailVerified())) {
            throw new InvalidCredentialsException("Your Google email address is not verified.");
        }

        String email = payload.getEmail();
        String subject = payload.getSubject();
        if (email == null || email.isBlank() || subject == null || subject.isBlank()) {
            throw new InvalidCredentialsException("Google account did not supply verified identity claims.");
        }

        if (request.getNonce() != null && !request.getNonce().isBlank()) {
            String tokenNonce = payload.getNonce();
            if (tokenNonce == null || !request.getNonce().equals(tokenNonce)) {
                log.warn("[GOOGLE_AUTH_NONCE_MISMATCH] Nonce validation failed");
                throw new InvalidCredentialsException("Google authentication nonce verification failed.");
            }
        }

        return payload;
    }

    private void enforceCustomerOnlyGooglePolicy(User user) {
        if (user.getRole() == Role.ROLE_ADMIN) {
            log.warn("[GOOGLE_AUTH_ADMIN_BLOCKED] Blocked Google Sign-In attempt onto admin userId={}", user.getId());
            throw new InvalidCredentialsException("Administrator accounts must sign in using administrator credentials.");
        }
        if (!user.isEnabled()) {
            throw new InvalidCredentialsException("Your account is currently disabled.");
        }
    }

    private GoogleIdToken.Payload verifyGoogleIdToken(String idTokenString) {
        try {
            GoogleIdTokenVerifier verifier = customVerifierForTest != null
                    ? customVerifierForTest
                    : new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), GsonFactory.getDefaultInstance())
                    .setAudience(Collections.singletonList(googleClientId.trim()))
                    .setIssuers(ALLOWED_ISSUERS)
                    .build();

            GoogleIdToken idToken = verifier.verify(idTokenString);
            if (idToken != null) {
                return idToken.getPayload();
            }
            log.warn("[GOOGLE_AUTH_INVALID_TOKEN] Signature/audience/expiration verification returned null");
            return null;
        } catch (Exception ex) {
            log.warn("[GOOGLE_AUTH_VERIFY_ERROR] Cryptographic verification failed: {}", ex.getMessage());
            return null;
        }
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }

    private String extractDisplayName(GoogleIdToken.Payload payload, String email) {
        Object nameObj = payload.get("name");
        if (nameObj instanceof String s && !s.isBlank()) {
            return s.trim();
        }
        Object givenObj = payload.get("given_name");
        if (givenObj instanceof String s && !s.isBlank()) {
            return s.trim();
        }
        return email.split("@")[0];
    }

    private String generateRandomPasswordPlaceholder() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
