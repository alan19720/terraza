import { prisma } from '@/prisma/prisma';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { withAuth } from '@/lib/utils/with-auth';
import { startOfToday } from '@/lib/utils/date';
import { OrderStatus } from '@prisma/client';

/**
 * GET /api/orders/tips-today
 * Returns the total tip amount collected today (from CLOSED orders only).
 */
export const GET = withAuth(async () => {
    try {
        const dayStart = startOfToday();

        const result = await prisma.payment.aggregate({
            where: {
                order: {
                    status: OrderStatus.CLOSED,
                    createdAt: { gte: dayStart },
                },
            },
            _sum: { tipAmount: true },
            _count: { id: true },
        });

        return successResponse({
            totalTips: Number(result._sum.tipAmount ?? 0),
            paymentsCount: result._count.id,
        });
    } catch (e) {
        console.error('GET /api/orders/tips-today:', e);
        return errorResponse('Error al obtener propinas', 500);
    }
});
