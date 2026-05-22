import { NextRequest, NextResponse } from 'next/server';
import { refreshTokens } from '@/lib/services/auth.service';
import { successResponse, errorResponse } from '@/lib/utils/api-response';

/**
 * POST /api/auth/refresh
 * Refreshes access and refresh tokens using cookie
 */
export async function POST(request: NextRequest) {
    try {
        // Get refresh token from cookie
        const refreshToken = request.cookies.get('refreshToken')?.value;

        if (!refreshToken) {
            return errorResponse('Refresh token not found', 401);
        }

        // Refresh tokens
        const result = await refreshTokens(refreshToken);

        // Create response
        const response = successResponse(
            { message: 'Tokens refreshed successfully' },
            'Tokens refreshed successfully',
            200
        );

        // Set new access token in httpOnly cookie
        response.cookies.set('accessToken', result.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60, // 1 hour
            path: '/',
        });

        // Set new refresh token in httpOnly cookie
        response.cookies.set('refreshToken', result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 30, // 30 days
            path: '/',
        });

        return response;
    } catch (error) {
        // Handle token refresh errors
        if (error instanceof Error) {
            return errorResponse(error.message, 401);
        }

        return errorResponse('An unexpected error occurred', 500);
    }
}
