package com.aiapp.api_gateway.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;

@Service
public class JwtValidationService {

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    public Mono<Claims> validateToken(String token) {
        return Mono.fromCallable(() -> {
            try {
                SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
                return Jwts.parserBuilder()
                        .setSigningKey(key)
                        .build()
                        .parseClaimsJws(token)
                        .getBody();
            } catch (Exception e) {
                return null;
            }
        });
    }

    public Mono<String> extractUsername(String token) {
        return validateToken(token)
                .map(Claims::getSubject);
    }
}