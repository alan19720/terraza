import { prisma } from '@/prisma/prisma';
import { successResponse, errorResponse } from '@/lib/utils/api-response';

/**
 * GET /api/roles
 * List all roles
 */
export async function GET() {
    try {
        const roles = await prisma.role.findMany({
            orderBy: { name: 'asc' },
            select: { id: true, name: true },
        });
        return successResponse({ roles }, 'Roles retrieved successfully');
    } catch (e) {
        console.error('GET /api/roles:', e);
        return errorResponse('Failed to fetch roles', 500);
    }
}
