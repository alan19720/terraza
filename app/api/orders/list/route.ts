import { prisma } from '@/prisma/prisma';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { withAuth } from '@/lib/utils/with-auth';
import { startOfToday } from '@/lib/utils/date';

const ADMIN_ROLE = 'ADMIN';

/**
 * GET /api/orders/list
 * Returns today's orders. Admins see all orders; other roles see only their own.
 */
export const GET = withAuth(async (_request, user) => {
    try {
        const isAdmin = user.role?.name === ADMIN_ROLE;

        const startOfDay = startOfToday();

        const orders = await prisma.order.findMany({
            where: {
                createdAt: { gte: startOfDay },
                ...(!isAdmin && { userId: user.userId }),
            },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                status: true,
                total: true,
                createdAt: true,
                table: {
                    select: { number: true },
                },
                user: {
                    select: { name: true },
                },
                orderDetails: {
                    select: {
                        quantity: true,
                        unitPrice: true,
                        kitchenStatus: true,
                        kitchenNotes: true,
                        meal: { select: { name: true } },
                    },
                },
            },
        });

        return successResponse({ orders });
    } catch (e) {
        console.error('GET /api/orders/list:', e);
        return errorResponse('Failed to fetch orders', 500);
    }
});
