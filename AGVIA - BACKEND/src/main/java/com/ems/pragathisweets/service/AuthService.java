package com.ems.pragathisweets.service;

import com.ems.pragathisweets.dto.JwtResponse;
import com.ems.pragathisweets.dto.LoginRequest;
import com.ems.pragathisweets.dto.RegisterRequest;
import com.ems.pragathisweets.dto.UserResponse;
import com.ems.pragathisweets.entity.Role;
import com.ems.pragathisweets.entity.User;
import com.ems.pragathisweets.exception.DuplicateResourceException;
import com.ems.pragathisweets.exception.InvalidCredentialsException;
import com.ems.pragathisweets.repository.UserRepository;
import com.ems.pragathisweets.security.JwtService;
import com.ems.pragathisweets.security.UserDetailsImpl;
import com.ems.pragathisweets.entity.NotificationType;
import com.ems.pragathisweets.event.AdminNotificationEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final EmailService emailService;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public UserResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("An account with this email already exists");
        }

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail().toLowerCase())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .address(request.getAddress())
                .role(Role.ROLE_USER)
                .enabled(true)
                .build();

        User saved = userRepository.save(user);
        emailService.sendWelcomeEmail(saved.getEmail(), saved.getFullName());

        eventPublisher.publishEvent(new AdminNotificationEvent(
                NotificationType.NEW_CUSTOMER,
                "New Customer Registered",
                saved.getFullName() + " has created an account (" + saved.getEmail() + ")",
                String.valueOf(saved.getId()),
                "USER",
                Map.of(
                        "userId", saved.getId(),
                        "customerName", saved.getFullName() != null ? saved.getFullName() : "",
                        "email", saved.getEmail()
                )
        ));

        return toUserResponse(saved);
    }

    public JwtResponse login(LoginRequest request) {
        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail().toLowerCase(), request.getPassword())
            );
        } catch (BadCredentialsException ex) {
            throw new InvalidCredentialsException("Invalid email or password");
        }

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        String token = jwtService.generateToken(userDetails);

        return JwtResponse.builder()
                .accessToken(token)
                .tokenType("Bearer")
                .userId(userDetails.getId())
                .fullName(userDetails.getFullName())
                .email(userDetails.getUsername())
                .role(userDetails.getAuthorities().iterator().next().getAuthority())
                .expiresIn(jwtService.getExpirationMs())
                .build();
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
