import { NextResponse } from 'next/server';
import { successResponse } from '@/lib/utils/api-response';

/**
 * POST /api/auth/logout
 * Logs out user by clearing authentication cookies
 */
export async function POST() {
    const response = successResponse(
        { message: 'Logged out successfully' },
        'Logout successful',
        200
    );

    // Clear access token cookie
    response.cookies.set('accessToken', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
    });

    // Clear refresh token cookie
    response.cookies.set('refreshToken', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
    });

    return response;
}
