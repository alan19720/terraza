import { prisma } from '@/prisma/prisma';
import { successResponse, errorResponse } from '@/lib/utils/api-response';

/**
 * GET /api/categories
 * List all categories with their meals (for order modal)
 */
export async function GET() {
    try {
        const categories = await prisma.category.findMany({
            orderBy: { name: 'asc' },
            include: {
                meals: {
                    where: { isAvailable: true },
                    orderBy: { name: 'asc' },
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        price: true,
                    },
                },
            },
        });
        return successResponse({ categories });
    } catch (e) {
        console.error('GET /api/categories:', e);
        return errorResponse('Failed to fetch categories', 500);
    }
}
