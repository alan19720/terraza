import { NextRequest } from 'next/server';
import { prisma } from '@/prisma/prisma';
import { withAuth } from '@/lib/utils/with-auth';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { KitchenStatus, OrderStatus } from '@/app/generated/prisma/enums';

const VALID = Object.values(KitchenStatus);

/**
 * PATCH /api/kitchen/items/[id]
 * Body: { kitchenStatus: KitchenStatus }
 */
export const PATCH = withAuth(async (request: NextRequest) => {
    try {
        const id = request.nextUrl.pathname.split('/').pop()!;
        const body = await request.json();
        const { kitchenStatus } = body;

        if (!kitchenStatus || !VALID.includes(kitchenStatus)) {
            return errorResponse(`Estado inválido. Use: ${VALID.join(', ')}`, 400);
        }

        const detail = await prisma.orderDetail.findUnique({
            where: { id },
            select: {
                id: true,
                kitchenStatus: true,
                order: { select: { id: true, status: true } },
            },
        });

        if (!detail) {
            return errorResponse('Platillo no encontrado', 404);
        }

        if (detail.order.status !== OrderStatus.OPEN) {
            return errorResponse('La orden está cerrada; no se puede cambiar cocina', 409);
        }

        const updated = await prisma.orderDetail.update({
            where: { id },
            data: { kitchenStatus },
            select: {
                id: true,
                quantity: true,
                kitchenStatus: true,
                kitchenNotes: true,
                meal: { select: { name: true } },
            },
        });

        return successResponse({ item: updated });
    } catch (e) {
        console.error('PATCH /api/kitchen/items/[id]:', e);
        return errorResponse('Error al actualizar platillo', 500);
    }
});
