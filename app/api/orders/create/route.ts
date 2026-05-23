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

        const addedTotal = orderDetails.reduce(
            (sum, d) => sum + Number(d.unitPrice) * d.quantity,
            0
        );

        const existingOrder = await prisma.order.findFirst({
            where: { tableId, status: OrderStatus.OPEN },
        });

        let resultOrder;

        if (existingOrder) {
            // Append to existing order
            const rows = orderDetails.map((d) => ({
                orderId: existingOrder.id,
                mealId: d.mealId,
                quantity: d.quantity,
                unitPrice: d.unitPrice,
                kitchenNotes: d.kitchenNotes,
            }));

            await prisma.$transaction(async (tx) => {
                await tx.orderDetail.createMany({ data: rows });
                const allDetails = await tx.orderDetail.findMany({
                    where: { orderId: existingOrder.id },
                    select: { quantity: true, unitPrice: true },
                });
                const newTotal = allDetails.reduce(
                    (s: number, d: any) => s + Number(d.unitPrice) * d.quantity,
                    0
                );
                await tx.order.update({
                    where: { id: existingOrder.id },
                    data: { total: newTotal },
                });
            });

            resultOrder = await prisma.order.findUnique({
                where: { id: existingOrder.id },
                include: {
                    table: { select: { number: true } },
                    orderDetails: {
                        include: {
                            meal: { select: { name: true, price: true } },
                        },
                    },
                },
            });
        } else {
            // Create brand new order
            const [order] = await prisma.$transaction([
                prisma.order.create({
                    data: {
                        tableId,
                        userId: user.userId,
                        status: OrderStatus.OPEN,
                        total: addedTotal,
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
            resultOrder = order;
        }

        return successResponse(
            { order: { id: resultOrder!.id, table: resultOrder!.table.number, total: resultOrder!.total, orderDetails: resultOrder!.orderDetails } },
            'Order created or updated'
        );
    } catch (e) {
        console.error('POST /api/orders/create:', e);
        return errorResponse('Failed to create order', 500);
    }
});
