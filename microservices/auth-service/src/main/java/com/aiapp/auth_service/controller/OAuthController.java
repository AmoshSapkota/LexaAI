package com.aiapp.auth_service.controller;

import com.aiapp.auth_service.entity.OAuthToken;
import com.aiapp.auth_service.entity.User;
import com.aiapp.auth_service.service.OAuthService;
import com.aiapp.auth_service.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Optional;

@Slf4j
@RestController
@RequestMapping("/api/oauth")
@RequiredArgsConstructor
public class OAuthController {

    private final OAuthService oAuthService;
    private final UserService userService;

    /**
     * Store OAuth token for a user
     */
    @PostMapping("/tokens")
    public ResponseEntity<?> storeOAuthToken(@Valid @RequestBody OAuthTokenRequest request) {
        try {
            log.info("Storing OAuth token for user: {} with provider: {}", request.getUserId(), request.getProvider());
            
            Optional<User> userOpt = userService.findById(request.getUserId());
            if (userOpt.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(new ErrorResponse("User not found with ID: " + request.getUserId()));
            }
            
            User user = userOpt.get();
            
            OAuthToken token = oAuthService.storeOAuthToken(
                user,
                request.getProvider(),
                request.getProviderUserId(),
                request.getAccessToken(),
                request.getRefreshToken(),
                request.getTokenType(),
                request.getScope(),
                request.getExpiresIn()
            );
            
            return ResponseEntity.ok(new OAuthTokenResponse(token));
            
        } catch (Exception e) {
            log.error("Error storing OAuth token", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("Failed to store OAuth token: " + e.getMessage()));
        }
    }

    /**
     * Get OAuth tokens for a user
     */
    @GetMapping("/tokens/user/{userId}")
    public ResponseEntity<?> getUserTokens(@PathVariable Long userId) {
        try {
            log.info("Fetching OAuth tokens for user: {}", userId);
            
            Optional<User> userOpt = userService.findById(userId);
            if (userOpt.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(new ErrorResponse("User not found with ID: " + userId));
            }
            
            User user = userOpt.get();
            List<OAuthToken> tokens = oAuthService.findActiveTokensByUser(user);
            
            List<OAuthTokenResponse> tokenResponses = tokens.stream()
                .map(OAuthTokenResponse::new)
                .toList();
            
            return ResponseEntity.ok(tokenResponses);
            
        } catch (Exception e) {
            log.error("Error fetching user OAuth tokens", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("Failed to fetch OAuth tokens: " + e.getMessage()));
        }
    }

    /**
     * Validate OAuth token
     */
    @PostMapping("/tokens/validate")
    public ResponseEntity<?> validateToken(@RequestBody TokenValidationRequest request) {
        try {
            log.info("Validating OAuth token");
            
            boolean isValid = oAuthService.validateAndUseToken(request.getAccessToken());
            
            return ResponseEntity.ok(new TokenValidationResponse(isValid));
            
        } catch (Exception e) {
            log.error("Error validating OAuth token", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("Failed to validate token: " + e.getMessage()));
        }
    }

    /**
     * Find user by OAuth provider
     */
    @GetMapping("/users/provider/{provider}/user/{providerUserId}")
    public ResponseEntity<?> findUserByProvider(@PathVariable String provider, 
                                              @PathVariable String providerUserId) {
        try {
            log.info("Finding user by OAuth provider: {} and providerUserId: {}", provider, providerUserId);
            
            Optional<User> userOpt = oAuthService.findUserByOAuthProvider(provider, providerUserId);
            
            if (userOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            return ResponseEntity.ok(new UserResponse(userOpt.get()));
            
        } catch (Exception e) {
            log.error("Error finding user by OAuth provider", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("Failed to find user: " + e.getMessage()));
        }
    }

    /**
     * Deactivate all tokens for a user (logout)
     */
    @DeleteMapping("/tokens/user/{userId}")
    public ResponseEntity<?> deactivateUserTokens(@PathVariable Long userId) {
        try {
            log.info("Deactivating OAuth tokens for user: {}", userId);
            
            Optional<User> userOpt = userService.findById(userId);
            if (userOpt.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(new ErrorResponse("User not found with ID: " + userId));
            }
            
            User user = userOpt.get();
            oAuthService.deactivateUserTokens(user);
            
            return ResponseEntity.ok(new SuccessResponse("All OAuth tokens deactivated successfully"));
            
        } catch (Exception e) {
            log.error("Error deactivating user OAuth tokens", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("Failed to deactivate tokens: " + e.getMessage()));
        }
    }

    /**
     * Cleanup expired tokens (admin endpoint)
     */
    @PostMapping("/tokens/cleanup")
    public ResponseEntity<?> cleanupExpiredTokens() {
        try {
            log.info("Starting OAuth token cleanup");
            
            oAuthService.cleanupExpiredTokens();
            
            return ResponseEntity.ok(new SuccessResponse("Token cleanup completed successfully"));
            
        } catch (Exception e) {
            log.error("Error during OAuth token cleanup", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("Failed to cleanup tokens: " + e.getMessage()));
        }
    }

    // DTOs and Response classes
    
    public static class OAuthTokenRequest {
        private Long userId;
        private String provider;
        private String providerUserId;
        private String accessToken;
        private String refreshToken;
        private String tokenType;
        private String scope;
        private Integer expiresIn;
        
        // Getters and setters
        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }
        
        public String getProvider() { return provider; }
        public void setProvider(String provider) { this.provider = provider; }
        
        public String getProviderUserId() { return providerUserId; }
        public void setProviderUserId(String providerUserId) { this.providerUserId = providerUserId; }
        
        public String getAccessToken() { return accessToken; }
        public void setAccessToken(String accessToken) { this.accessToken = accessToken; }
        
        public String getRefreshToken() { return refreshToken; }
        public void setRefreshToken(String refreshToken) { this.refreshToken = refreshToken; }
        
        public String getTokenType() { return tokenType; }
        public void setTokenType(String tokenType) { this.tokenType = tokenType; }
        
        public String getScope() { return scope; }
        public void setScope(String scope) { this.scope = scope; }
        
        public Integer getExpiresIn() { return expiresIn; }
        public void setExpiresIn(Integer expiresIn) { this.expiresIn = expiresIn; }
    }
    
    public static class OAuthTokenResponse {
        private Long id;
        private String provider;
        private String providerUserId;
        private String tokenType;
        private String scope;
        private boolean isActive;
        private boolean isExpired;
        
        public OAuthTokenResponse(OAuthToken token) {
            this.id = token.getId();
            this.provider = token.getProvider();
            this.providerUserId = token.getProviderUserId();
            this.tokenType = token.getTokenType();
            this.scope = token.getScope();
            this.isActive = token.getIsActive();
            this.isExpired = token.isExpired();
        }
        
        // Getters
        public Long getId() { return id; }
        public String getProvider() { return provider; }
        public String getProviderUserId() { return providerUserId; }
        public String getTokenType() { return tokenType; }
        public String getScope() { return scope; }
        public boolean isActive() { return isActive; }
        public boolean isExpired() { return isExpired; }
    }
    
    public static class TokenValidationRequest {
        private String accessToken;
        
        public String getAccessToken() { return accessToken; }
        public void setAccessToken(String accessToken) { this.accessToken = accessToken; }
    }
    
    public static class TokenValidationResponse {
        private boolean valid;
        
        public TokenValidationResponse(boolean valid) {
            this.valid = valid;
        }
        
        public boolean isValid() { return valid; }
    }
    
    public static class UserResponse {
        private Long id;
        private String username;
        private String email;
        private String firstName;
        private String lastName;
        
        public UserResponse(User user) {
            this.id = user.getId();
            this.username = user.getUsername();
            this.email = user.getEmail();
            this.firstName = user.getFirstName();
            this.lastName = user.getLastName();
        }
        
        // Getters
        public Long getId() { return id; }
        public String getUsername() { return username; }
        public String getEmail() { return email; }
        public String getFirstName() { return firstName; }
        public String getLastName() { return lastName; }
    }
    
    public static class ErrorResponse {
        private String error;
        private long timestamp;
        
        public ErrorResponse(String error) {
            this.error = error;
            this.timestamp = System.currentTimeMillis();
        }
        
        public String getError() { return error; }
        public long getTimestamp() { return timestamp; }
    }
    
    public static class SuccessResponse {
        private String message;
        private long timestamp;
        
        public SuccessResponse(String message) {
            this.message = message;
            this.timestamp = System.currentTimeMillis();
        }
        
        public String getMessage() { return message; }
        public long getTimestamp() { return timestamp; }
    }
}
