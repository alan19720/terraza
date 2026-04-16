import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/prisma/prisma';
import { successResponse, errorResponse } from '@/lib/utils/api-response';

/**
 * GET /api/inventory/stock
 * List all stock movements with product info
 */
export async function GET() {
    try {
        const movements = await prisma.stockMovement.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                product: {
                    select: { id: true, name: true, unit: true, currentStock: true },
                },
            },
        });
        return successResponse({ movements });
    } catch (e) {
        console.error('GET /api/inventory/stock:', e);
        return errorResponse('Failed to fetch movements', 500);
    }
}

const stockSchema = z.object({
    productId: z.string().uuid('Invalid product ID'),
    type: z.enum(['IN', 'OUT', 'ADJUSTMENT']),
    quantity: z.number().int().positive('Quantity must be positive'),
    notes: z.string().optional().default(''),
});

/**
 * POST /api/inventory/stock
 * Record a stock movement and update currentStock atomically
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validation = stockSchema.safeParse(body);
        if (!validation.success) {
            const errors = validation.error.flatten().fieldErrors;
            return errorResponse(Object.values(errors).flat().join(', '), 400);
        }

        const { productId, type, quantity, notes } = validation.data;

        const product = await prisma.inventoryProduct.findUnique({ where: { id: productId } });
        if (!product) return errorResponse('Product not found', 404);

        let newStock: number;
        if (type === 'IN') {
            newStock = product.currentStock + quantity;
        } else if (type === 'OUT') {
            if (product.currentStock < quantity) {
                return errorResponse('Insufficient stock', 400);
            }
            newStock = product.currentStock - quantity;
        } else {
            // ADJUSTMENT — quantity is the new absolute value
            newStock = quantity;
        }

        const [, movement] = await prisma.$transaction([
            prisma.inventoryProduct.update({
                where: { id: productId },
                data: { currentStock: newStock },
            }),
            prisma.stockMovement.create({
                data: { productId, type, quantity, notes: notes || null },
            }),
        ]);

        return successResponse(
            { movement: { id: movement.id, type: movement.type, quantity: movement.quantity, notes: movement.notes, createdAt: movement.createdAt }, newStock },
            'Stock updated successfully',
            201
        );
    } catch (error) {
        console.error('POST /api/inventory/stock:', error);
        return errorResponse('An unexpected error occurred', 500);
    }
}
