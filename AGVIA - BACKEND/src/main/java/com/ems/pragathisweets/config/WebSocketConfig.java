package com.ems.pragathisweets.config;

import com.ems.pragathisweets.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.List;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
@Slf4j
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Enable in-memory message broker with prefixes for broadcast and targeted user channels
        config.enableSimpleBroker("/topic", "/queue");
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Standard WebSocket endpoint (supports native WebSockets and SockJS fallback)
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*");

        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

                if (accessor != null) {
                    if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                        String authHeader = accessor.getFirstNativeHeader("Authorization");
                        if (authHeader == null || authHeader.isBlank()) {
                            authHeader = accessor.getFirstNativeHeader("token");
                        }

                        if (authHeader != null && authHeader.startsWith("Bearer ")) {
                            authHeader = authHeader.substring(7).trim();
                        }

                        if (authHeader != null && !authHeader.isBlank()) {
                            try {
                                String username = jwtService.extractUsername(authHeader);
                                if (username != null) {
                                    UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                                    if (jwtService.isTokenValid(authHeader, userDetails)) {
                                        UsernamePasswordAuthenticationToken authentication =
                                                new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                                        accessor.setUser(authentication);
                                        log.info("[WebSocket] Authenticated client connected: {} with authorities: {}", username, userDetails.getAuthorities());
                                    }
                                }
                            } catch (Exception ex) {
                                log.warn("[WebSocket] Handshake authentication rejected: {}", ex.getMessage());
                                throw new AccessDeniedException("Invalid or expired authentication credentials.");
                            }
                        }
                    } else if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
                        String destination = accessor.getDestination();
                        // Enforce ROLE_ADMIN authorization on administrative channels
                        if (destination != null && (destination.startsWith("/topic/admin") || destination.startsWith("/queue/admin"))) {
                            if (accessor.getUser() == null || !(accessor.getUser() instanceof UsernamePasswordAuthenticationToken auth)) {
                                log.warn("[WebSocket] Unauthorized attempt to subscribe to admin channel: destination={}", destination);
                                throw new AccessDeniedException("Access denied: Unauthenticated user cannot subscribe to admin notifications.");
                            }

                            boolean isAdmin = auth.getAuthorities().stream()
                                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

                            if (!isAdmin) {
                                log.warn("[WebSocket] Access denied for user {} to admin destination {}", auth.getName(), destination);
                                throw new AccessDeniedException("Access denied: ROLE_ADMIN authority required.");
                            }

                            log.info("[WebSocket] Admin subscribed successfully to: destination={}, user={}", destination, auth.getName());
                        }
                    }
                }

                return message;
            }
        });
    }
}
