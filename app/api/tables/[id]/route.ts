import { NextRequest } from 'next/server';
import { prisma } from '@/prisma/prisma';
import { withAuth } from '@/lib/utils/with-auth';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { TableStatus } from '@/app/generated/prisma/enums';

const VALID_STATUSES = Object.values(TableStatus);

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
