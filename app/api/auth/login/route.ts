import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { login } from '@/lib/services/auth.service';
import { successResponse, errorResponse } from '@/lib/utils/api-response';

// Validation schema for login request
const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

/**
 * POST /api/auth/login
 * Authenticates user and sets JWT tokens in httpOnly cookies
 */
export async function POST(request: NextRequest) {
    try {
        // Parse request body
        const body = await request.json();

        // Validate input
        const validation = loginSchema.safeParse(body);

        if (!validation.success) {
            const errors = validation.error.flatten().fieldErrors;
            return errorResponse(
                Object.values(errors).flat().join(', '),
                400
            );
        }

        const { email, password } = validation.data;

        // Attempt login
        const result = await login({ email, password });

        // Create response with user data only (tokens in cookies)
        const response = successResponse(
            { user: result.user },
            'Login successful',
            200
        );

        // Set access token in httpOnly cookie
        response.cookies.set('accessToken', result.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60, // 1 hour
            path: '/',
        });

        // Set refresh token in httpOnly cookie
        response.cookies.set('refreshToken', result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/',
        });

        return response;
    } catch (error) {
        // Handle authentication errors
        if (error instanceof Error) {
            return errorResponse(error.message, 401);
        }

        return errorResponse('An unexpected error occurred', 500);
    }
}
