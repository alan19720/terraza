import * as jose from 'jose';
import { JWT_SIGNING_KEY } from '@/lib/config/env';
import { TokenPayload, AuthTokens } from '@/lib/types/auth.types';

/**
 * Token expiration times
 */
const ACCESS_TOKEN_EXPIRY = '1h'; // 1 hour
const REFRESH_TOKEN_EXPIRY = '7d'; // 7 days

// Encode the secret key once
const secret = new TextEncoder().encode(JWT_SIGNING_KEY);

/**
 * Generates an access token (short-lived)
 */
export async function generateAccessToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): Promise<string> {
    return await new jose.SignJWT(payload as jose.JWTPayload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(ACCESS_TOKEN_EXPIRY)
        .sign(secret);
}

/**
 * Generates a refresh token (long-lived)
 */
export async function generateRefreshToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): Promise<string> {
    return await new jose.SignJWT(payload as jose.JWTPayload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(REFRESH_TOKEN_EXPIRY)
        .sign(secret);
}

/**
 * Generates both access and refresh tokens
 */
export async function generateTokenPair(payload: Omit<TokenPayload, 'iat' | 'exp'>): Promise<AuthTokens> {
    const [accessToken, refreshToken] = await Promise.all([
        generateAccessToken(payload),
        generateRefreshToken(payload),
    ]);

    return {
        accessToken,
        refreshToken,
    };
}

/**
 * Verifies and decodes an access token
 * @throws Error if token is invalid or expired
 */
export async function verifyAccessToken(token: string): Promise<TokenPayload> {
    try {
        const { payload } = await jose.jwtVerify(token, secret);
        return payload as unknown as TokenPayload;
    } catch (error) {
        if (error instanceof jose.errors.JWTExpired) {
            throw new Error('Access token has expired');
        }
        if (error instanceof jose.errors.JWTInvalid) {
            throw new Error('Invalid access token');
        }
        throw new Error('Token verification failed');
    }
}

/**
 * Verifies and decodes a refresh token
 * @throws Error if token is invalid or expired
 */
export async function verifyRefreshToken(token: string): Promise<TokenPayload> {
    try {
        const { payload } = await jose.jwtVerify(token, secret);
        return payload as unknown as TokenPayload;
    } catch (error) {
        if (error instanceof jose.errors.JWTExpired) {
            throw new Error('Refresh token has expired');
        }
        if (error instanceof jose.errors.JWTInvalid) {
            throw new Error('Invalid refresh token');
        }
        throw new Error('Token verification failed');
    }
}

/**
 * Decodes a token without verifying (useful for debugging)
 */
export function decodeToken(token: string): TokenPayload | null {
    try {
        return jose.decodeJwt(token) as unknown as TokenPayload;
    } catch {
        return null;
    }
}
