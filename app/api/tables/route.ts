import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/prisma/prisma';
import { successResponse, errorResponse } from '@/lib/utils/api-response';

export const dynamic = 'force-dynamic';

const createTableSchema = z.object({
    number: z.string().min(1, 'Table number/name is required'),
});

/**
 * GET /api/tables
 * List all tables with status
 */
export async function GET() {
    try {
        const tables = await prisma.table.findMany({
            orderBy: { number: 'asc' },
            select: {
                id: true,
                number: true,
                status: true,
            },
        });
        return successResponse({ tables });
    } catch (e) {
        console.error('GET /api/tables:', e);
        return errorResponse('Failed to fetch tables', 500);
    }
}

/**
 * POST /api/tables
 * Create a new table
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validation = createTableSchema.safeParse(body);
        if (!validation.success) {
            return errorResponse('Table number/name is required', 400);
        }

        const { number } = validation.data;

        // Check for duplicates
        const existing = await prisma.table.findFirst({ where: { number } });
        if (existing) {
            return errorResponse('A table with this number/name already exists', 400);
        }

        const table = await prisma.table.create({
            data: { number },
        });

        return successResponse({ table }, 'Table created successfully', 201);
    } catch (e) {
        console.error('POST /api/tables:', e);
        return errorResponse('An unexpected error occurred', 500);
    }
}
