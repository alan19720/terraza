import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/prisma/prisma';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { withAuth } from '@/lib/utils/with-auth';
import { OrderStatus } from '@/app/generated/prisma/enums';

const ADMIN_ROLE = 'ADMIN';

const bodySchema = z.object({
    items: z
        .array(
            z.object({
                mealId: z.string().uuid(),
                quantity: z.number().int().min(1),
                kitchenNotes: z.string().optional(),
            })
        )
        .min(1, 'Agrega al menos un platillo'),
});

function orderIdFromPath(pathname: string): string | null {
    const m = pathname.match(/\/api\/orders\/([^/]+)\/items$/);
    return m?.[1] ?? null;
}

/**
 * POST /api/orders/[id]/items
 * Append items to an OPEN order. Recalculates total. Admin or order owner only.
 */
export const POST = withAuth(async (request: NextRequest, user) => {
    try {
        const orderId = orderIdFromPath(request.nextUrl.pathname);
        if (!orderId) {
            return errorResponse('Orden inválida', 400);
        }

        const parsed = bodySchema.safeParse(await request.json());
        if (!parsed.success) {
            const msg = parsed.error.flatten().fieldErrors;
            return errorResponse(
                Object.values(msg).flat().join(', ') || 'Datos inválidos',
                400
            );
        }

        const { items } = parsed.data;
        const isAdmin = user.role?.name === ADMIN_ROLE;

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: { id: true, status: true, userId: true },
        });

        if (!order) {
            return errorResponse('Orden no encontrada', 404);
        }

        if (order.status !== OrderStatus.OPEN) {
            return errorResponse('Solo se pueden agregar platillos a órdenes abiertas', 409);
        }

        if (!isAdmin && order.userId !== user.userId) {
            return errorResponse('No autorizado', 403);
        }

        const mealIds = [...new Set(items.map((i) => i.mealId))];
        const meals = await prisma.meal.findMany({
            where: { id: { in: mealIds }, isAvailable: true },
            select: { id: true, price: true },
        });
        const mealMap = new Map(meals.map((m) => [m.id, m]));
        for (const item of items) {
            if (!mealMap.has(item.mealId)) {
                return errorResponse('Platillo no disponible', 400);
            }
        }

        const rows = items.map((item) => ({
            orderId,
            mealId: item.mealId,
            quantity: item.quantity,
            unitPrice: mealMap.get(item.mealId)!.price,
            kitchenNotes: item.kitchenNotes || null,
        }));

        await prisma.$transaction(async (tx) => {
            await tx.orderDetail.createMany({ data: rows });
            const allDetails = await tx.orderDetail.findMany({
                where: { orderId },
                select: {
                    quantity: true,
                    unitPrice: true,
                    kitchenStatus: true,
                    kitchenNotes: true,
                    meal: { select: { name: true } },
                },
            });
            const total = allDetails.reduce(
                (s, d) => s + Number(d.unitPrice) * d.quantity,
                0
            );
            await tx.order.update({
                where: { id: orderId },
                data: { total },
            });
        });

        const updated = await prisma.order.findUnique({
            where: { id: orderId },
            select: {
                id: true,
                status: true,
                total: true,
                createdAt: true,
                table: { select: { number: true } },
                user: { select: { id: true, name: true } },
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

        return successResponse({ order: updated }, 'Platillos agregados');
    } catch (e) {
        console.error('POST /api/orders/[id]/items:', e);
        return errorResponse('Error al agregar platillos', 500);
    }
});
