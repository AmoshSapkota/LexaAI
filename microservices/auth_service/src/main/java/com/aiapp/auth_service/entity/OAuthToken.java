package com.aiapp.auth_service.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "oauth_tokens", indexes = {
    @Index(name = "idx_oauth_user_provider", columnList = "user_id, provider"),
    @Index(name = "idx_oauth_provider", columnList = "provider"),
    @Index(name = "idx_oauth_expires_at", columnList = "expires_at")
})
@EntityListeners(AuditingEntityListener.class)
public class OAuthToken {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Relationship with User entity
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @NotNull(message = "User is required")
    private User user;

    @NotBlank(message = "OAuth provider is required")
    @Column(name = "provider", nullable = false, length = 50)
    private String provider; // google, facebook, github, etc.

    @NotBlank(message = "Provider user ID is required")
    @Column(name = "provider_user_id", nullable = false, length = 100)
    private String providerUserId; // User's ID from OAuth provider

    @NotBlank(message = "Access token is required")
    @Column(name = "access_token", nullable = false, columnDefinition = "TEXT")
    private String accessToken;

    @Column(name = "refresh_token", columnDefinition = "TEXT")
    private String refreshToken;

    @Column(name = "token_type", length = 20)
    private String tokenType = "Bearer"; // Usually "Bearer"

    @Column(name = "scope", length = 500)
    private String scope; // OAuth scopes granted

    @Column(name = "expires_in")
    private Integer expiresIn; // Token lifetime in seconds

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(name = "is_active")
    private Boolean isActive = true;

    // Audit fields
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "last_used_at")
    private LocalDateTime lastUsedAt;

    // Utility methods
    public boolean isExpired() {
        return expiresAt != null && LocalDateTime.now().isAfter(expiresAt);
    }

    public boolean isValid() {
        return isActive && !isExpired() && accessToken != null;
    }

    public void markAsUsed() {
        this.lastUsedAt = LocalDateTime.now();
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (expiresAt == null && expiresIn != null) {
            expiresAt = createdAt.plusSeconds(expiresIn);
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}