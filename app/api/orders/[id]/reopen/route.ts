import type { Prisma } from '@prisma/client';
import { NextRequest } from 'next/server';
import { prisma } from '@/prisma/prisma';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { withAuth } from '@/lib/utils/with-auth';
import { OrderStatus, TableStatus } from '@prisma/client';

const ADMIN_ROLE = 'ADMIN';

function orderIdFromPath(pathname: string): string | null {
    const m = pathname.match(/\/api\/orders\/([^/]+)\/reopen$/);
    return m?.[1] ?? null;
}

/**
 * POST /api/orders/[id]/reopen
 * Reopens a CLOSED order, deleting its payment records and setting the table back to OCCUPIED.
 */
export const POST = withAuth(async (request: NextRequest, user) => {
    try {
        const orderId = orderIdFromPath(request.nextUrl.pathname);
        if (!orderId) {
            return errorResponse('Orden inválida', 400);
        }

        const isAdmin = user.role?.name === ADMIN_ROLE;

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: { id: true, status: true, userId: true, tableId: true },
        });

        if (!order) {
            return errorResponse('Orden no encontrada', 404);
        }

        if (order.status !== OrderStatus.CLOSED) {
            return errorResponse('Solo se pueden reabrir órdenes que ya están cerradas', 409);
        }

        if (!isAdmin && order.userId !== user.userId) {
            return errorResponse('No autorizado para reabrir esta orden', 403);
        }

        const table = await prisma.table.findUnique({
            where: { id: order.tableId },
        });

        // Safe check: if the table is currently occupied by ANOTHER open order,
        // it might cause confusion, but technically it's possible for a table to have multiple open orders now.
        // We will just proceed.

        await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // Delete associated payments to prevent inflated daily totals
            await tx.payment.deleteMany({
                where: { orderId },
            });

            // Revert Order status to OPEN
            await tx.order.update({
                where: { id: orderId },
                data: { status: OrderStatus.OPEN },
            });

            // Mark Table as OCCUPIED again
            await tx.table.update({
                where: { id: order.tableId },
                data: { status: TableStatus.OCCUPIED },
            });
        });

        return successResponse({ order: { id: orderId, status: OrderStatus.OPEN } }, 'Orden reabierta con éxito');
    } catch (e) {
        console.error('POST /api/orders/[id]/reopen:', e);
        return errorResponse('Error al reabrir la orden', 500);
    }
});
