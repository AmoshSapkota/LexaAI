package com.aiapp.auth_service.repository;

import com.aiapp.auth_service.entity.OAuthToken;
import com.aiapp.auth_service.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OAuthTokenRepository extends JpaRepository<OAuthToken, Long> {

    /**
     * Find an active OAuth token by provider and provider user ID
     */
    @Query("SELECT t FROM OAuthToken t WHERE t.provider = :provider AND t.providerUserId = :providerUserId AND t.isActive = true")
    Optional<OAuthToken> findActiveTokenByProviderAndProviderUserId(
            @Param("provider") String provider, 
            @Param("providerUserId") String providerUserId);

    /**
     * Find all active OAuth tokens for a user
     */
    @Query("SELECT t FROM OAuthToken t WHERE t.user = :user AND t.isActive = true")
    List<OAuthToken> findActiveTokensByUser(@Param("user") User user);

    /**
     * Find OAuth token by user and provider
     */
    @Query("SELECT t FROM OAuthToken t WHERE t.user = :user AND t.provider = :provider AND t.isActive = true")
    Optional<OAuthToken> findActiveTokenByUserAndProvider(
            @Param("user") User user, 
            @Param("provider") String provider);

    /**
     * Find OAuth tokens by provider
     */
    @Query("SELECT t FROM OAuthToken t WHERE t.provider = :provider AND t.isActive = true")
    List<OAuthToken> findActiveTokensByProvider(@Param("provider") String provider);

    /**
     * Find expired tokens
     */
    @Query("SELECT t FROM OAuthToken t WHERE t.expiresAt < :currentTime AND t.isActive = true")
    List<OAuthToken> findExpiredTokens(@Param("currentTime") LocalDateTime currentTime);

    /**
     * Find tokens that haven't been used for a specific period
     */
    @Query("SELECT t FROM OAuthToken t WHERE t.lastUsedAt < :cutoffTime AND t.isActive = true")
    List<OAuthToken> findUnusedTokensSince(@Param("cutoffTime") LocalDateTime cutoffTime);

    /**
     * Deactivate expired tokens
     */
    @Modifying
    @Query("UPDATE OAuthToken t SET t.isActive = false, t.updatedAt = :currentTime WHERE t.expiresAt < :currentTime AND t.isActive = true")
    int deactivateExpiredTokens(@Param("currentTime") LocalDateTime currentTime);

    /**
     * Deactivate all tokens for a user (useful for logout)
     */
    @Modifying
    @Query("UPDATE OAuthToken t SET t.isActive = false, t.updatedAt = :currentTime WHERE t.user = :user AND t.isActive = true")
    int deactivateUserTokens(@Param("user") User user, @Param("currentTime") LocalDateTime currentTime);

    /**
     * Deactivate tokens by provider and provider user ID
     */
    @Modifying
    @Query("UPDATE OAuthToken t SET t.isActive = false, t.updatedAt = :currentTime WHERE t.provider = :provider AND t.providerUserId = :providerUserId AND t.isActive = true")
    int deactivateTokensByProviderAndProviderUserId(
            @Param("provider") String provider, 
            @Param("providerUserId") String providerUserId, 
            @Param("currentTime") LocalDateTime currentTime);

    /**
     * Update last used timestamp
     */
    @Modifying
    @Query("UPDATE OAuthToken t SET t.lastUsedAt = :lastUsedAt, t.updatedAt = :currentTime WHERE t.id = :tokenId")
    int updateLastUsedTime(
            @Param("tokenId") Long tokenId, 
            @Param("lastUsedAt") LocalDateTime lastUsedAt, 
            @Param("currentTime") LocalDateTime currentTime);

    /**
     * Count active tokens by provider
     */
    @Query("SELECT COUNT(t) FROM OAuthToken t WHERE t.provider = :provider AND t.isActive = true")
    long countActiveTokensByProvider(@Param("provider") String provider);

    /**
     * Find tokens by access token (for validation)
     */
    @Query("SELECT t FROM OAuthToken t WHERE t.accessToken = :accessToken AND t.isActive = true")
    Optional<OAuthToken> findByAccessToken(@Param("accessToken") String accessToken);

    /**
     * Clean up old inactive tokens (for maintenance)
     */
    @Modifying
    @Query("DELETE FROM OAuthToken t WHERE t.isActive = false AND t.updatedAt < :cutoffTime")
    int deleteOldInactiveTokens(@Param("cutoffTime") LocalDateTime cutoffTime);
}