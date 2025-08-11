package com.aiapp.auth_service.service;

import com.aiapp.auth_service.entity.OAuthToken;
import com.aiapp.auth_service.entity.User;
import com.aiapp.auth_service.repository.OAuthTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class OAuthService {
    private final OAuthTokenRepository tokenRepository;
    public OAuthToken storeAccessToken(User user, String provider, String providerUserId, String accessToken, String refreshToken, String tokenType, String scope, LocalDateTime expiresAt) {
        log.info("Storing OAuth token for user: {}, provider: {}", user.getUsername(), provider);
        
        OAuthToken token = OAuthToken.builder()
                .user(user)
                .provider(provider)
                .providerUserId(providerUserId)
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType(tokenType)
                .scope(scope)
                .expiresAt(expiresAt)
                .build();
        
        return tokenRepository.save(token);
    } 