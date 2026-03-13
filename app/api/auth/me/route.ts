import { prisma } from '@/prisma/prisma';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { withAuth } from '@/lib/utils/with-auth';

/**
 * GET /api/auth/me
 * Retrieves current authenticated user data from session cookie
 */
export const GET = withAuth(async (_request, user) => {
    const dbUser = await prisma.user.findUnique({
        where: { id: user.userId },
        select: {
            id: true,
            name: true,
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

    if (!dbUser || !dbUser.active) {
        return errorResponse('User not found or inactive', 401);
    }

    return successResponse({ user: dbUser }, 'User identity retrieved');
});
