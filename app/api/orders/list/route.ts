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
                    select: { id: true, name: true },
                },
                orderDetails: {
                    select: {
                        id: true,
                        quantity: true,
                        unitPrice: true,
                        kitchenStatus: true,
                        kitchenNotes: true,
                        meal: { select: { name: true, category: { select: { name: true } } } },
                    },
                },
                payments: {
                    select: {
                        id: true,
                        amount: true,
                        discountPercent: true,
                        tipAmount: true,
                        totalCharged: true,
                        paymentMethod: true,
                    },
                    take: 1,
                },
            },
        });

        return successResponse({ orders });
    } catch (e) {
        console.error('GET /api/orders/list:', e);
        return errorResponse('Failed to fetch orders', 500);
    }
});
