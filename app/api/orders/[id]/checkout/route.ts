import type { Prisma } from '@prisma/client';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/prisma/prisma';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { withAuth } from '@/lib/utils/with-auth';
import { OrderStatus, TableStatus } from '@prisma/client';

const ADMIN_ROLE = 'ADMIN';

const bodySchema = z.object({
    tipAmount: z.number().min(0).default(0),
    discountPercent: z.number().min(0).max(100).default(0),
    paymentMethod: z.enum(['CASH', 'CARD', 'TRANSFER']).default('CASH'),
});

function orderIdFromPath(pathname: string): string | null {
    const m = pathname.match(/\/api\/orders\/([^/]+)\/checkout$/);
    return m?.[1] ?? null;
}

/**
 * POST /api/orders/[id]/checkout
 * Creates the Payment record and closes the Order + frees the Table in one transaction.
 * Prices already include 16% IVA — the breakdown is cosmetic (reverse calculation).
 */
export const POST = withAuth(async (request: NextRequest, user) => {
    try {
        const orderId = orderIdFromPath(request.nextUrl.pathname);
        if (!orderId) return errorResponse('Orden inválida', 400);

        const parsed = bodySchema.safeParse(await request.json());
        if (!parsed.success) return errorResponse('Datos inválidos', 400);

        const { tipAmount, paymentMethod, discountPercent } = parsed.data;
        const isAdmin = user.role?.name === ADMIN_ROLE;

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: {
                id: true,
                status: true,
                userId: true,
                tableId: true,
                total: true,
                orderDetails: {
                    select: { quantity: true, unitPrice: true },
                },
            },
        });

        if (!order) return errorResponse('Orden no encontrada', 404);
        if (order.status !== OrderStatus.OPEN) {
            return errorResponse('La orden ya está cerrada o cancelada', 409);
        }
        if (!isAdmin && order.userId !== user.userId) {
            return errorResponse('No autorizado', 403);
        }

        // Compute the total from order details (source of truth)
        const grossTotal = order.orderDetails.reduce(
            (sum: number, d: any) => sum + Number(d.unitPrice) * d.quantity,
            0
        );
        const discountAmount = grossTotal * (discountPercent / 100);
        const netFoodTotal = grossTotal - discountAmount;
        
        const amount = netFoodTotal;
        const totalCharged = parseFloat((amount + tipAmount).toFixed(2));

        const payment = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            const pay = await tx.payment.create({
                data: {
                    orderId,
                    paymentMethod,
                    amount: parseFloat(amount.toFixed(2)),
                    discountPercent,
                    tipAmount: parseFloat(tipAmount.toFixed(2)),
                    totalCharged,
                },
            });

            await tx.order.update({
                where: { id: orderId },
                data: { status: OrderStatus.CLOSED },
            });

            const stillOpen = await tx.order.count({
                where: { tableId: order.tableId, status: OrderStatus.OPEN },
            });

            if (stillOpen === 0) {
                await tx.table.update({
                    where: { id: order.tableId },
                    data: { status: TableStatus.AVAILABLE },
                });
            }

            return pay;
        });

        return successResponse(
            {
                payment: {
                    id: payment.id,
                    amount: Number(payment.amount),
                    discountPercent: Number(payment.discountPercent),
                    tipAmount: Number(payment.tipAmount),
                    totalCharged: Number(payment.totalCharged),
                },
                order: { id: orderId, status: OrderStatus.CLOSED },
            },
            'Orden cerrada correctamente'
        );
    } catch (e) {
        console.error('POST /api/orders/[id]/checkout:', e);
        return errorResponse('Error al procesar el pago', 500);
    }
});
