import { NextRequest } from 'next/server';
import { prisma } from '@/prisma/prisma';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { withAuth } from '@/lib/utils/with-auth';
import { OrderStatus } from '@prisma/client';

const ADMIN_ROLE = 'ADMIN';

function getIdsFromPath(pathname: string) {
    const m = pathname.match(/\/api\/orders\/([^/]+)\/items\/([^/]+)$/);
    if (!m) return null;
    return { orderId: m[1], itemId: m[2] };
}

/**
 * DELETE /api/orders/[id]/items/[itemId]
 * Removes an item from an OPEN order and recalculates the order total.
 * Only ADMIN or the waiter who owns the order can delete items.
 */
export const DELETE = withAuth(async (request: NextRequest, user) => {
    try {
        const match = getIdsFromPath(request.nextUrl.pathname);
        if (!match) {
            return errorResponse('Ruta inválida', 400);
        }
        const { orderId, itemId } = match;
        const isAdmin = user.role?.name === ADMIN_ROLE;

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: { id: true, status: true, userId: true },
        });

        if (!order) {
            return errorResponse('Orden no encontrada', 404);
        }

        if (order.status !== OrderStatus.OPEN) {
            return errorResponse('Solo se pueden eliminar platillos de órdenes abiertas', 409);
        }

        if (!isAdmin && order.userId !== user.userId) {
            return errorResponse('No autorizado para modificar esta orden', 403);
        }

        const detail = await prisma.orderDetail.findUnique({
            where: { id: itemId },
        });

        if (!detail || detail.orderId !== orderId) {
            return errorResponse('El platillo no existe en esta orden', 404);
        }

        await prisma.$transaction(async (tx) => {
            // Delete the item
            await tx.orderDetail.delete({
                where: { id: itemId },
            });

            // Recalculate total
            const remainingDetails = await tx.orderDetail.findMany({
                where: { orderId },
                select: { quantity: true, unitPrice: true },
            });

            const newTotal = remainingDetails.reduce(
                (sum, d) => sum + Number(d.unitPrice) * d.quantity,
                0
            );

            // Update order
            await tx.order.update({
                where: { id: orderId },
                data: { total: newTotal },
            });
        });

        return successResponse(null, 'Platillo eliminado correctamente');
    } catch (e) {
        console.error('DELETE /api/orders/[id]/items/[itemId]:', e);
        return errorResponse('Error al eliminar el platillo', 500);
    }
});
