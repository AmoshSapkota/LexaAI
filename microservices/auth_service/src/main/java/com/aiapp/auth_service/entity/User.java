package com.aiapp.auth_service.entity;

import jakarta.persistence.*;
import jakarta.validation.constants.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.lang.annotation.Inherited;
import java.time.LocalDateTime;
import java.uitil.HashSet;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor // jpa constructor requirement
@Entity
@Table(name = "users", uniqueConstraints = { // db level unique constraints
        @UniqueConstraint(columnNames = "email"),
        @UniqueConstraint(columnNames = "username")
})
@EntityListeners(AuditingEntityListener.class) // automatic timestamp updates
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // auto-increment ID
    private Long id;

    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 20, message = "Username must be between 3 and 20 characters")
    private String username;

    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    @Size(max = 50, message = "Email must be less than 50 characters")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6, max = 100, message = "Password must be between 6 and 100 characters")
    private String password;

    @Column(name = "first_name") // maps to database column "first_name"
    private String firstName;

    @Column(name = "last_name") // maps to database column "last_name"
    private String lastName;

    @Column(name = "phone_numbe")
    private String phoneNumber;

    // These booleans implement Spring Security's UserDetails interface
    // requirements.
    @Column(name = "is_enabled")
    private Boolean isEnabled = true; // can user login?

    @Column(name = "is_account_non_expired")
    private Boolean isAccountNonExpired = true; // is account still valid?

    @Column(name = "is_account_non_locked")
    private Boolean isAccountNonLocked = true; // is account not locked?

    @Column(name = "is_credentials_non_expired")
    private Boolean isCredentialsNonExpired = true; // are credentials not expired?

    // OAuth fields for google/facebook login
    @Column(name = "oauth_provider")
    private String oauthProvider; // e.g. google, facebook

    @Column(name = "oauth_id")
    private String oauthId; // User's ID from OAuth provider

    @ManyToMany(fetch = FetchType.LAZY) // load roles only when requested
    @JoinTable(name = "user_roles", joinColumns = @JoinColumn(name = "user_id"), inverseJoinColumns = @JoinColumn(name = "role_id"))
    private Set<Role> roles = new HashSet<>();

    @CreatedDate // automatically set on creation
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @LastModifiedDate // automatically set on update
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
