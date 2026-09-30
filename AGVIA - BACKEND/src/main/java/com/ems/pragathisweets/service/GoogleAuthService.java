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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class GoogleAuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthService authService;

    @Value("${app.google.client-id:${GOOGLE_CLIENT_ID:}}")
    private String googleClientId;

    @Transactional
    public AuthResultResponse authenticateWithGoogle(GoogleAuthRequest request) {
        String idTokenString = request.getCredential();
        if (idTokenString == null || idTokenString.trim().isEmpty()) {
            throw new InvalidCredentialsException("Google ID token credential must not be empty");
        }

        GoogleIdToken.Payload payload = verifyGoogleIdToken(idTokenString.trim());
        if (payload == null) {
            throw new InvalidCredentialsException("Invalid or expired Google authentication credential");
        }

        String email = payload.getEmail();
        if (email == null || email.trim().isEmpty()) {
            throw new InvalidCredentialsException("Google account did not provide a valid email address");
        }
        email = email.trim().toLowerCase();

        boolean emailVerified = Boolean.TRUE.equals(payload.getEmailVerified());
        if (!emailVerified) {
            throw new InvalidCredentialsException("Google email address is not verified by Google");
        }

        String googleId = payload.getSubject();
        String name = (String) payload.get("name");
        if (name == null || name.trim().isEmpty()) {
            name = (String) payload.get("given_name");
        }
        if (name == null || name.trim().isEmpty()) {
            name = email.split("@")[0];
        }

        // Safe account linking:
        // 1. Look for existing user by email
        Optional<User> existingUserOpt = userRepository.findByEmail(email);
        User user;

        if (existingUserOpt.isPresent()) {
            user = existingUserOpt.get();
            if (!user.isEnabled()) {
                throw new InvalidCredentialsException("Your account has been deactivated. Please contact concierge support.");
            }
            // Link Google identity if not already linked
            if (user.getGoogleId() == null && googleId != null) {
                user.setGoogleId(googleId);
            }
            if (user.getAuthProvider() == null || "LOCAL".equalsIgnoreCase(user.getAuthProvider())) {
                user.setAuthProvider("GOOGLE_LINKED");
            }
            user = userRepository.save(user);
            log.info("Existing user [{}] authenticated via Google OAuth", user.getEmail());
        } else {
            // Create a brand new local customer account
            user = User.builder()
                    .fullName(name.trim())
                    .email(email)
                    .password(passwordEncoder.encode(UUID.randomUUID().toString())) // secure random placeholder
                    .role(Role.ROLE_USER) // Strictly customer role, never admin
                    .enabled(true)
                    .phoneVerified(false)
                    .authProvider("GOOGLE")
                    .googleId(googleId)
                    .build();

            user = userRepository.save(user);
            log.info("New customer user [{}] created via Google OAuth", user.getEmail());
        }

        // Issue application JWT
        UserDetailsImpl userDetails = UserDetailsImpl.build(user);
        String token = jwtService.generateToken(userDetails);

        UserResponse userResponse = authService.toUserResponse(user);

        return AuthResultResponse.builder()
                .success(true)
                .message("Authenticated successfully with Google")
                .token(token)
                .user(userResponse)
                .build();
    }

    private GoogleIdToken.Payload verifyGoogleIdToken(String idTokenString) {
        try {
            NetHttpTransport transport = new NetHttpTransport();
            GsonFactory jsonFactory = GsonFactory.getDefaultInstance();

            GoogleIdTokenVerifier.Builder verifierBuilder = new GoogleIdTokenVerifier.Builder(transport, jsonFactory);

            if (googleClientId != null && !googleClientId.trim().isEmpty()) {
                verifierBuilder.setAudience(Collections.singletonList(googleClientId.trim()));
            }

            GoogleIdTokenVerifier verifier = verifierBuilder.build();
            GoogleIdToken idToken = verifier.verify(idTokenString);

            if (idToken != null) {
                return idToken.getPayload();
            }
            log.warn("GoogleIdTokenVerifier returned null for provided ID token");
            return null;
        } catch (Exception e) {
            log.error("Google ID token cryptographic verification failed: {}", e.getMessage());
            return null;
        }
    }
}
