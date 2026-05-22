import { z } from 'zod';
import { prisma } from '@/prisma/prisma';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { withAuth } from '@/lib/utils/with-auth';
import { OrderStatus, TableStatus } from '@prisma/client';

const createOrderSchema = z.object({
    tableId: z.string().uuid('Invalid table ID'),
    items: z.array(
        z.object({
            mealId: z.string().uuid('Invalid meal ID'),
            quantity: z.number().int().min(1, 'Quantity must be at least 1'),
            kitchenNotes: z.string().optional(),
        })
    ).min(1, 'Add at least one item'),
});

/**
 * POST /api/orders/create
 * Create a new order (authenticated). Sets table to OCCUPIED.
 */
export const POST = withAuth(async (request, user) => {
    try {
        const body = await request.json();
        const validation = createOrderSchema.safeParse(body);
        if (!validation.success) {
            const msg = validation.error.flatten().fieldErrors;
            return errorResponse(
                Object.values(msg).flat().join(', ') || 'Invalid input',
                400
            );
        }

        const { tableId, items } = validation.data;

        const mealIds = [...new Set(items.map((i) => i.mealId))];
        const meals = await prisma.meal.findMany({
            where: { id: { in: mealIds }, isAvailable: true },
            select: { id: true, price: true },
        });
        const mealMap = new Map(meals.map((m) => [m.id, m]));
        for (const item of items) {
            if (!mealMap.has(item.mealId)) {
                return errorResponse(`Meal ${item.mealId} not found or not available`, 400);
            }
        }

        const table = await prisma.table.findUnique({ where: { id: tableId } });
        if (!table) {
            return errorResponse('Table not found', 400);
        }

        const orderDetails = items.map((item) => {
            const meal = mealMap.get(item.mealId)!;
            return {
                mealId: item.mealId,
                quantity: item.quantity,
                unitPrice: meal.price,
                kitchenNotes: item.kitchenNotes || null,
            };
        });

        const total = orderDetails.reduce(
            (sum, d) => sum + Number(d.unitPrice) * d.quantity,
            0
        );

        const [order] = await prisma.$transaction([
            prisma.order.create({
                data: {
                    tableId,
                    userId: user.userId,
                    status: OrderStatus.OPEN,
                    total,
                    orderDetails: {
                        create: orderDetails,
                    },
                },
                include: {
                    table: { select: { number: true } },
                    orderDetails: {
                        include: {
                            meal: { select: { name: true, price: true } },
                        },
                    },
                },
            }),
            prisma.table.update({
                where: { id: tableId },
                data: { status: TableStatus.OCCUPIED },
            }),
        ]);

        return successResponse(
            { order: { id: order.id, table: order.table.number, total: order.total, orderDetails: order.orderDetails } },
            'Order created'
        );
    } catch (e) {
        console.error('POST /api/orders/create:', e);
        return errorResponse('Failed to create order', 500);
    }
});
