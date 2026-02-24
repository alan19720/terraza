import { NextRequest } from 'next/server';
import { verifyAccessToken } from '@/lib/services/token.service';
import { prisma } from '@/prisma/prisma';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { AuthUser } from '@/lib/types/auth.types';

/**
 * GET /api/auth/me
 * Retrieves current authenticated user data from session cookie
 */
export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get('accessToken')?.value;

        if (!token) {
            return errorResponse('Not authenticated', 401);
        }

        // Verify token (jose is Edge compatible)
        const payload = await verifyAccessToken(token);

        // Fetch fresh user data from DB
        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: {
                id: true,
                name: true,
                email: true,
                role: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
                active: true,
            },
        });

        if (!user || !user.active) {
            return errorResponse('User not found or inactive', 401);
        }

        return successResponse({ user }, 'User identity retrieved');
    } catch (error) {
        return errorResponse('Invalid session', 401);
    }
}
