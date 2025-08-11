package com.aiapp.aputh_service.entity;

import jakarta.persistence.*;

@Data
@NoArgsConstructor // satisfies jpa requirement for constructors
@Entity
@Table(name = "roles")
public class Role {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Enumerated(EnumType.STRING) // store emum as string in database
    @Column(length = 20)
    private RoleName name;

    public enum RoleName {
        ROLE_USER, // regular user
        ROLE_ADMIN, // administrator
        ROLE_PREMIUM_USER // premium user
    }
}