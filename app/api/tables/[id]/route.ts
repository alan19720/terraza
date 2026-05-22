import { NextRequest } from 'next/server';
import { prisma } from '@/prisma/prisma';
import { withAuth } from '@/lib/utils/with-auth';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { TableStatus } from '@prisma/client';
import { z } from 'zod';

const VALID_STATUSES = Object.values(TableStatus);

const updateTableSchema = z.object({
    number: z.string().min(1, 'Table number/name is required'),
});

export const PATCH = withAuth(async (request: NextRequest) => {
    try {
        const id = request.nextUrl.pathname.split('/').pop()!;
        const body = await request.json();
        const { status } = body;

        if (!status || !VALID_STATUSES.includes(status)) {
            return errorResponse(`Estado inválido. Valores válidos: ${VALID_STATUSES.join(', ')}`, 400);
        }

        const table = await prisma.table.findUnique({ where: { id } });
        if (!table) {
            return errorResponse('Mesa no encontrada', 404);
        }

        const updated = await prisma.table.update({
            where: { id },
            data: { status },
            select: { id: true, number: true, status: true },
        });

        return successResponse({ table: updated });
    } catch (e) {
        console.error('PATCH /api/tables/[id]:', e);
        return errorResponse('Error al actualizar mesa', 500);
    }
});

export const PUT = withAuth(async (request: NextRequest) => {
    try {
        const id = request.nextUrl.pathname.split('/').pop()!;
        const body = await request.json();
        const validation = updateTableSchema.safeParse(body);
        if (!validation.success) {
            return errorResponse('Número/Nombre de mesa requerido', 400);
        }

        const { number } = validation.data;

        const table = await prisma.table.findUnique({ where: { id } });
        if (!table) {
            return errorResponse('Mesa no encontrada', 404);
        }

        // Check duplicates
        const existing = await prisma.table.findFirst({ where: { number, id: { not: id } } });
        if (existing) {
            return errorResponse('Ya existe otra mesa con este número', 400);
        }

        const updated = await prisma.table.update({
            where: { id },
            data: { number },
        });

        return successResponse({ table: updated });
    } catch (e) {
        console.error('PUT /api/tables/[id]:', e);
        return errorResponse('Error al actualizar mesa', 500);
    }
});

export const DELETE = withAuth(async (request: NextRequest) => {
    try {
        const id = request.nextUrl.pathname.split('/').pop()!;

        const table = await prisma.table.findUnique({ where: { id } });
        if (!table) {
            return errorResponse('Mesa no encontrada', 404);
        }

        // Ensure no active orders on this table
        const activeOrders = await prisma.order.count({
            where: { tableId: id, status: 'OPEN' }
        });

        if (activeOrders > 0) {
            return errorResponse('No se puede eliminar la mesa porque tiene órdenes activas', 400);
        }

        await prisma.table.delete({ where: { id } });

        return successResponse({}, 'Mesa eliminada');
    } catch (e) {
        console.error('DELETE /api/tables/[id]:', e);
        return errorResponse('Error al eliminar mesa', 500);
    }
});
