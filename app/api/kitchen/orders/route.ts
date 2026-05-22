import { NextRequest } from 'next/server';
import { prisma } from '@/prisma/prisma';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { withAuth } from '@/lib/utils/with-auth';
import { startOfToday } from '@/lib/utils/date';
import { KitchenStatus, OrderStatus } from '@/app/generated/prisma/enums';

export const GET = withAuth(async (request: NextRequest) => {
    try {
        const url = new URL(request.url);
        const viewType = url.searchParams.get('type') || 'kitchen'; // 'kitchen' or 'bartender'
        const startOfDay = startOfToday();

        // Base filter: kitchen gets everything EXCEPT Bebidas, bartender gets ONLY Bebidas.
        const categoryFilter = viewType === 'bartender' ? 'Bebidas' : { not: 'Bebidas' };

        const orders = await prisma.order.findMany({
            where: {
                status: OrderStatus.OPEN,
                createdAt: { gte: startOfDay },
                orderDetails: {
                    some: { 
                        kitchenStatus: { not: KitchenStatus.DELIVERED },
                        meal: { category: { name: categoryFilter } }
                    },
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
                    where: {
                        kitchenStatus: { not: KitchenStatus.DELIVERED },
                        meal: { category: { name: categoryFilter } }
                    },
                    orderBy: { id: 'asc' },
                    select: {
                        id: true,
                        quantity: true,
                        kitchenStatus: true,
                        kitchenNotes: true,
                        meal: { select: { name: true, category: { select: { name: true } } } },
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
