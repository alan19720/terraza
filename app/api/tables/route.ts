import { prisma } from '@/prisma/prisma';
import { successResponse, errorResponse } from '@/lib/utils/api-response';

/**
 * GET /api/tables
 * List all tables with status
 */
export async function GET() {
    try {
        const tables = await prisma.table.findMany({
            orderBy: { number: 'asc' },
            select: {
                id: true,
                number: true,
                status: true,
            },
        });
        return successResponse({ tables });
    } catch (e) {
        console.error('GET /api/tables:', e);
        return errorResponse('Failed to fetch tables', 500);
    }
}
