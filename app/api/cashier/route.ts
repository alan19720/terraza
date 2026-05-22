import { prisma } from '@/prisma/prisma';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { withAuth } from '@/lib/utils/with-auth';
import { startOfToday } from '@/lib/utils/date';

export const GET = withAuth(async () => {
    try {
        const startOfDay = startOfToday();

        const payments = await prisma.payment.findMany({
            where: {
                order: {
                    createdAt: { gte: startOfDay },
                },
            },
            include: {
                order: {
                    select: {
                        id: true,
                        createdAt: true,
                        table: { select: { number: true } },
                        user: { select: { name: true } },
                        orderDetails: {
                            select: { quantity: true, meal: { select: { name: true } } }
                        }
                    }
                }
            },
            orderBy: {
                order: { createdAt: 'desc' }
            }
        });

        // Aggregations
        let totalBruto = 0;
        let totalVentas = 0;
        let totalPropinas = 0;
        let totalEfectivo = 0;
        let totalTarjeta = 0;
        let totalTransferencia = 0;

        for (const p of payments) {
            const charged = Number(p.totalCharged);
            const amount = Number(p.amount);
            const tip = Number(p.tipAmount);

            totalBruto += charged;
            totalVentas += amount;
            totalPropinas += tip;

            if (p.paymentMethod === 'CASH') totalEfectivo += charged;
            if (p.paymentMethod === 'CARD') totalTarjeta += charged;
            if (p.paymentMethod === 'TRANSFER') totalTransferencia += charged;
        }

        const ordersCount = new Set(payments.map(p => p.orderId)).size;

        return successResponse({
            summary: {
                totalBruto,
                totalVentas,
                totalPropinas,
                totalEfectivo,
                totalTarjeta,
                totalTransferencia,
                ordersCount,
            },
            payments: payments.map(p => ({
                id: p.id,
                amount: Number(p.amount),
                tipAmount: Number(p.tipAmount),
                totalCharged: Number(p.totalCharged),
                paymentMethod: p.paymentMethod,
                order: {
                    tableNumber: p.order.table.number,
                    waiterName: p.order.user.name,
                    createdAt: p.order.createdAt,
                    summary: p.order.orderDetails.map(d => `${d.quantity}× ${d.meal.name}`).join(', '),
                }
            }))
        });
    } catch (e) {
        console.error('GET /api/cashier:', e);
        return errorResponse('Error al obtener el corte de caja', 500);
    }
});
