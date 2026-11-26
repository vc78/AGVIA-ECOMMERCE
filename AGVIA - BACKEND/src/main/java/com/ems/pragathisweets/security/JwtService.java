package com.ems.pragathisweets.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Service
@Slf4j
public class JwtService {

    private static final String KNOWN_INSECURE_PLACEHOLDER =
            "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWYwMTIzNDU2Nzg5YWJjZGVm";

    private final Environment environment;

    @Value("${jwt.secret:}")
    private String secret;

    @Value("${jwt.expiration-ms:86400000}")
    private long expirationMs;

    private volatile SecretKey cachedSigningKey;

    public JwtService(Environment environment) {
        this.environment = environment;
    }

    @PostConstruct
    void initSigningKey() {
        boolean isProd = environment != null && Arrays.stream(environment.getActiveProfiles())
                .anyMatch(p -> "prod".equalsIgnoreCase(p) || "production".equalsIgnoreCase(p));

        String clean = secret != null ? secret.trim() : "";
        if (clean.startsWith("\"") && clean.endsWith("\"") && clean.length() >= 2) {
            clean = clean.substring(1, clean.length() - 1).trim();
        }

        if (clean.isEmpty() || KNOWN_INSECURE_PLACEHOLDER.equals(clean)) {
            if (isProd) {
                throw new IllegalStateException(
                        "SECURITY HALT: JWT_SECRET must be explicitly configured with a unique Base64 >= 256-bit key in production.");
            }
            byte[] randomBytes = new byte[48];
            new SecureRandom().nextBytes(randomBytes);
            this.cachedSigningKey = Keys.hmacShaKeyFor(randomBytes);
            log.warn("[JwtService] Using ephemeral in-memory signing key for non-production runtime. Configure JWT_SECRET in production.");
            return;
        }

        byte[] keyBytes = Decoders.BASE64.decode(clean);
        if (keyBytes.length < 32) {
            if (isProd) {
                throw new IllegalStateException(
                        "SECURITY HALT: Configured JWT_SECRET is shorter than 256 bits.");
            }
            byte[] padded = new byte[32];
            System.arraycopy(keyBytes, 0, padded, 0, Math.min(keyBytes.length, 32));
            this.cachedSigningKey = Keys.hmacShaKeyFor(padded);
            return;
        }
        this.cachedSigningKey = Keys.hmacShaKeyFor(keyBytes);
    }

    private SecretKey getSigningKey() {
        if (cachedSigningKey == null) {
            initSigningKey();
        }
        return cachedSigningKey;
    }

    public String generateToken(UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();
        if (userDetails instanceof UserDetailsImpl impl) {
            claims.put("uid", impl.getId());
            claims.put("role", impl.getAuthorities().iterator().next().getAuthority());
            claims.put("name", impl.getFullName());
            claims.put("tv", impl.getTokenVersion());
        }
        return buildToken(claims, userDetails.getUsername());
    }

    private String buildToken(Map<String, Object> claims, String subject) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationMs);
        return Jwts.builder()
                .claims(claims)
                .subject(subject)
                .issuedAt(now)
                .expiration(expiry)
                .signWith(getSigningKey())
                .compact();
    }

    public long getExpirationMs() {
        return expirationMs;
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public Long extractUserId(String token) {
        Object uid = extractAllClaims(token).get("uid");
        if (uid == null) return null;
        return Long.valueOf(uid.toString());
    }

    public Integer extractTokenVersion(String token) {
        Object tv = extractAllClaims(token).get("tv");
        if (tv == null) return 0;
        if (tv instanceof Number num) {
            return num.intValue();
        }
        try {
            return Integer.parseInt(tv.toString());
        } catch (NumberFormatException ex) {
            return -1;
        }
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        if (userDetails == null || !userDetails.isEnabled()) {
            return false;
        }
        final String username = extractUsername(token);
        if (username == null || !username.equalsIgnoreCase(userDetails.getUsername()) || isTokenExpired(token)) {
            return false;
        }
        if (userDetails instanceof UserDetailsImpl impl) {
            Integer tokenTv = extractTokenVersion(token);
            return tokenTv != null && tokenTv == impl.getTokenVersion();
        }
        return true;
    }

    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }
}
