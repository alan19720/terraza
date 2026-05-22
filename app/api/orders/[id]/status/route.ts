import type { Prisma } from '@prisma/client';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/prisma/prisma';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { withAuth } from '@/lib/utils/with-auth';
import { OrderStatus, TableStatus } from '@prisma/client';

const ADMIN_ROLE = 'ADMIN';

const bodySchema = z.object({
    status: z.enum([OrderStatus.CLOSED, OrderStatus.CANCELED]),
});

function orderIdFromPath(pathname: string): string | null {
    const m = pathname.match(/\/api\/orders\/([^/]+)\/status$/);
    return m?.[1] ?? null;
}

/**
 * PATCH /api/orders/[id]/status
 * Close or cancel an OPEN order. Sets mesa a AVAILABLE solo si ya no queda ninguna orden OPEN en esa mesa.
 */
export const PATCH = withAuth(async (request: NextRequest, user) => {
    try {
        const orderId = orderIdFromPath(request.nextUrl.pathname);
        if (!orderId) {
            return errorResponse('Orden inválida', 400);
        }

        const parsed = bodySchema.safeParse(await request.json());
        if (!parsed.success) {
            return errorResponse('Estado debe ser CLOSED o CANCELED', 400);
        }

        const { status } = parsed.data;
        const isAdmin = user.role?.name === ADMIN_ROLE;

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: { id: true, status: true, userId: true, tableId: true },
        });

        if (!order) {
            return errorResponse('Orden no encontrada', 404);
        }

        if (order.status !== OrderStatus.OPEN) {
            return errorResponse('Solo se puede cerrar o cancelar una orden abierta', 409);
        }

        if (!isAdmin && order.userId !== user.userId) {
            return errorResponse('No autorizado', 403);
        }

        await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // If cancelling, delete any existing payment records for this order
            if (status === OrderStatus.CANCELED) {
                await tx.payment.deleteMany({
                    where: { orderId },
                });
            }

            await tx.order.update({
                where: { id: orderId },
                data: { status },
            });

            const openOnTable = await tx.order.count({
                where: {
                    tableId: order.tableId,
                    status: OrderStatus.OPEN,
                },
            });

            if (openOnTable === 0) {
                await tx.table.update({
                    where: { id: order.tableId },
                    data: { status: TableStatus.AVAILABLE },
                });
            }
        });

        return successResponse({ order: { id: orderId, status } }, 'Orden actualizada');
    } catch (e) {
        console.error('PATCH /api/orders/[id]/status:', e);
        return errorResponse('Error al actualizar la orden', 500);
    }
});
