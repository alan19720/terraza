import { prisma } from '@/prisma/prisma';
import { successResponse, errorResponse } from '@/lib/utils/api-response';

/**
 * GET /api/users
 * List all users with their roles
 */
export async function GET() {
    try {
        const users = await prisma.user.findMany({
            orderBy: { name: 'asc' },
            select: {
                id: true,
                name: true,
                email: true,
                active: true,
                role: {
                    select: { id: true, name: true },
                },
            },
        });
        return successResponse({ users });
    } catch (e) {
        console.error('GET /api/users:', e);
        return errorResponse('Failed to fetch users', 500);
    }
}
