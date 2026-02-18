import bcrypt from 'bcrypt';
import { prisma } from '@/prisma/prisma';
import { generateTokenPair, verifyRefreshToken } from './token.service';
import {
    LoginCredentials,
    LoginResponse,
    AuthUser,
    RefreshTokenResponse,
    TokenPayload,
} from '@/lib/types/auth.types';

/**
 * Authenticates user with email and password
 * @returns Login response with tokens and user data
 * @throws Error if credentials are invalid
 */
export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
    const { email, password } = credentials;

    // Find user by email
    const user = await prisma.user.findUnique({
        where: { email },
        select: {
            id: true,
            name: true,
            email: true,
            password: true,
            role: {
                select: {
                    id: true,
                    name: true,
                    description: true,
                },
            },
            active: true,
        },
    });

    if (!user) {
        throw new Error('Invalid email or password');
    }

    // Check if user is active
    if (!user.active) {
        throw new Error('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        throw new Error('Invalid email or password');
    }

    // Generate token payload
    const tokenPayload: Omit<TokenPayload, 'iat' | 'exp'> = {
        userId: user.id,
        email: user.email,
        role: user.role,
    };

    // Generate tokens
    const tokens = await generateTokenPair(tokenPayload);

    // Return user data without password
    const authUser: AuthUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        active: user.active,
    };

    return {
        ...tokens,
        user: authUser,
    };
}

/**
 * Refreshes authentication tokens using a valid refresh token
 * @returns New token pair
 * @throws Error if refresh token is invalid
 */
export async function refreshTokens(refreshToken: string): Promise<RefreshTokenResponse> {
    // Verify refresh token
    const payload = await verifyRefreshToken(refreshToken);

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
            id: true,
            email: true,
            role: {
                select: {
                    id: true,
                    name: true,
                },
            },
            active: true,
        },
    });

    if (!user) {
        throw new Error('User not found');
    }

    if (!user.active) {
        throw new Error('Account is deactivated');
    }

    // Generate new token pair
    // Generate new token pair
    const tokenPayload: Omit<TokenPayload, 'iat' | 'exp'> = {
        userId: user.id,
        email: user.email,
        role: user.role,
    };

    return await generateTokenPair(tokenPayload);
}

/**
 * Validates and retrieves user data by user ID
 * Used for protected routes to get current user
 * @throws Error if user not found or inactive
 */
export async function validateUser(userId: string): Promise<AuthUser> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            email: true,
            role: {
                select: {
                    id: true,
                    name: true,
                    description: true,
                },
            },
            active: true,
        },
    });

    if (!user) {
        throw new Error('User not found');
    }

    if (!user.active) {
        throw new Error('Account is deactivated');
    }

    return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        active: user.active,
    };
}
