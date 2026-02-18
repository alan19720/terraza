/**
 * Authentication-related TypeScript types
 */

/**
 * Login credentials from user input
 */
export interface LoginCredentials {
    email: string;
    password: string;
}

/**
 * JWT token pair returned after authentication
 */
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

/**
 * Payload stored in JWT tokens
 */
export interface TokenPayload {
    userId: string;
    email: string;
    role: {
        id: string;
        name: string;
    };
    iat?: number; // Issued at
    exp?: number; // Expiration
}

/**
 * User data without sensitive information
 */
export interface AuthUser {
    id: string;
    name: string;
    email: string;
    role: {
        id: string;
        name: string;
        description?: string | null;
    };
    active: boolean;
}

/**
 * Request body for token refresh
 */
export interface RefreshTokenRequest {
    refreshToken: string;
}

/**
 * Successful login response
 */
export interface LoginResponse {
    accessToken: string;
    refreshToken: string;
    user: AuthUser;
}

/**
 * Refresh token response
 */
export interface RefreshTokenResponse {
    accessToken: string;
    refreshToken: string;
}
