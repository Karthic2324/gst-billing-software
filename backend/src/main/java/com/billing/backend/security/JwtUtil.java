package com.billing.backend.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;
import java.nio.charset.StandardCharsets;

@Component
public class JwtUtil {

    // Stable 256-bit secret key string
    private static final String SECRET_KEY_STRING = "GST_BILLING_SOFTWARE_SECRET_KEY_2026_SECURE_JWT_TOKEN_123456";
    private final long expirationMs = 86400000; // 24 hours

    private Key getSigningKey() {
        byte[] keyBytes = SECRET_KEY_STRING.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    // Single argument method
    public String generateToken(String username) {
        return generateToken(username, "ROLE_VENDOR");
    }

    // Overloaded method handling role claims and authority prefix
    public String generateToken(String username, String role) {
        String formattedRole = (role != null && role.startsWith("ROLE_")) ? role : "ROLE_" + (role != null ? role : "ADMIN");
        
        return Jwts.builder()
                .setSubject(username)
                .claim("role", formattedRole)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expirationMs))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }
}