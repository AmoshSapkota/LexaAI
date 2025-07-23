export interface User {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    subscriptionStatus?: 'active' | 'inactive' | 'trial' | 'expired';
    subscriptionPlan?: 'free' | 'basic' | 'premium' | 'enterprise';
    createdAt?: string;
    lastLoginAt?: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    confirmPassword?: string;
}

export interface AuthResponse {
    user: User;
    token: string;
    refreshToken?: string;
    expiresIn: number;
}

export interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (credentials: LoginCredentials) => Promise<void>;
    register: (data: RegisterData) => Promise<void>;
    logout: () => void;
    isLoading: boolean;
    isAuthenticated: boolean;
}

export interface OAuthProvider {
    name: 'google' | 'github';
    displayName: string;
    icon: string;
}