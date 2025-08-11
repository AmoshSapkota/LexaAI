package com.aiapp.api_gateway.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class GatewayConfig {

    @Value("${app.services.auth-service.url:http://localhost:8081}")
    private String authServiceUrl;

    @Value("${app.services.payment-service.url:http://localhost:8082}")
    private String paymentServiceUrl;

    @Value("${app.services.ai-content-service.url:http://localhost:8083}")
    private String aiContentServiceUrl;

    @Value("${app.services.notification-service.url:http://localhost:8084}")
    private String notificationServiceUrl;

    @Value("${app.services.analytics-service.url:http://localhost:8085}")
    private String analyticsServiceUrl;

    @Bean
    public RouteLocator customRouteLocator(RouteLocatorBuilder builder) {
        return builder.routes()
                // Auth Service Routes
                .route("auth-service", r -> r
                        .path("/api/auth/**", "/api/users/**", "/api/oauth/**")
                        .uri(authServiceUrl))
                
                // Payment Service Routes
                .route("payment-service", r -> r
                        .path("/api/payments/**", "/api/orders/**", "/api/billing/**")
                        .uri(paymentServiceUrl))
                
                // AI Content Service Routes
                .route("ai-content-service", r -> r
                        .path("/api/ai/**", "/api/content/**", "/api/teleprompter/**")
                        .uri(aiContentServiceUrl))
                
                // Notification Service Routes
                .route("notification-service", r -> r
                        .path("/api/notifications/**", "/api/emails/**", "/api/receipts/**")
                        .uri(notificationServiceUrl))
                
                // Analytics Service Routes
                .route("analytics-service", r -> r
                        .path("/api/analytics/**", "/api/metrics/**", "/api/tracking/**")
                        .uri(analyticsServiceUrl))
                
                // Health checks
                .route("auth-health", r -> r
                        .path("/api/auth/actuator/health")
                        .uri(authServiceUrl))
                .route("payment-health", r -> r
                        .path("/api/payments/actuator/health")
                        .uri(paymentServiceUrl))
                .route("ai-content-health", r -> r
                        .path("/api/ai/actuator/health")
                        .uri(aiContentServiceUrl))
                .route("notification-health", r -> r
                        .path("/api/notifications/actuator/health")
                        .uri(notificationServiceUrl))
                .route("analytics-health", r -> r
                        .path("/api/analytics/actuator/health")
                        .uri(analyticsServiceUrl))
                
                .build();
    }
}