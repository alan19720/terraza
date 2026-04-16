import { prisma } from '@/prisma/prisma';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { withAuth } from '@/lib/utils/with-auth';
import { startOfToday } from '@/lib/utils/date';
import { KitchenStatus, OrderStatus } from '@/app/generated/prisma/enums';

/**
 * GET /api/kitchen/orders
 * Today's open orders that still have work for kitchen (at least one line not ENTREGADO).
 * Fully delivered lines remain on the order but the card drops off the queue once all are ENTREGADO.
 */
export const GET = withAuth(async () => {
    try {
        const startOfDay = startOfToday();

        const orders = await prisma.order.findMany({
            where: {
                status: OrderStatus.OPEN,
                createdAt: { gte: startOfDay },
                orderDetails: {
                    some: { kitchenStatus: { not: KitchenStatus.DELIVERED } },
                },
            },
            orderBy: { createdAt: 'asc' },
            select: {
                id: true,
                status: true,
                createdAt: true,
                table: { select: { number: true } },
                user: { select: { name: true } },
                orderDetails: {
                    orderBy: { id: 'asc' },
                    select: {
                        id: true,
                        quantity: true,
                        kitchenStatus: true,
                        kitchenNotes: true,
                        meal: { select: { name: true } },
                    },
                },
            },
        });

        return successResponse({ orders });
    } catch (e) {
        console.error('GET /api/kitchen/orders:', e);
        return errorResponse('Error al cargar cocina', 500);
    }
});
