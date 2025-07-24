package com.aiapp.auth_service.repository;

import com.aiapp.auth_service.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    /**
     * Find user by email
     */
    @Query("SELECT u FROM User u WHERE u.email = :email")
    Optional<User> findByEmail(@Param("email") String email);
    
    /**
     * Find user by username
     */
    @Query("SELECT u FROM User u WHERE u.username = :username")
    Optional<User> findByUsername(@Param("username") String username);
    
    /**
     * Find user by OAuth provider and provider user ID
     */
    @Query("SELECT u FROM User u WHERE u.oauthProvider = :provider AND u.oauthId = :oauthId")
    Optional<User> findByOAuthProviderAndOAuthId(@Param("provider") String provider, @Param("oauthId") String oauthId);
    
    /**
     * Check if user exists by email
     */
    boolean existsByEmail(String email);
    
    /**
     * Check if user exists by username
     */
    boolean existsByUsername(String username);
    
    /**
     * Check if OAuth user exists
     */
    boolean existsByOauthProviderAndOauthId(String oauthProvider, String oauthId);
}