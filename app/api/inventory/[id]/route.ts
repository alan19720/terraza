import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/prisma/prisma';
import { successResponse, errorResponse } from '@/lib/utils/api-response';

const updateProductSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    unit: z.string().min(1).optional(),
    minimumStock: z.number().int().min(0).optional(),
    yieldPercent: z.number().min(0).max(100).optional(),
    grossWeight: z.number().min(0).optional(),
    unitPrice: z.number().min(0).optional(),
    supplier: z.string().optional(),
    active: z.boolean().optional(),
});

/**
 * PUT /api/inventory/[id]
 * Update an inventory product
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const existing = await prisma.inventoryProduct.findUnique({ where: { id } });
        if (!existing) return errorResponse('Product not found', 404);

        const body = await request.json();
        const validation = updateProductSchema.safeParse(body);
        if (!validation.success) {
            const errors = validation.error.flatten().fieldErrors;
            return errorResponse(Object.values(errors).flat().join(', '), 400);
        }

        const { name, description, unit, minimumStock, yieldPercent, grossWeight, unitPrice, supplier, active } = validation.data;
        const data: Record<string, unknown> = {};
        if (name !== undefined) data.name = name;
        if (description !== undefined) data.description = description || null;
        if (unit !== undefined) data.unit = unit;
        if (minimumStock !== undefined) data.minimumStock = minimumStock;
        if (yieldPercent !== undefined) data.yieldPercent = yieldPercent;
        if (grossWeight !== undefined) data.grossWeight = grossWeight;
        if (unitPrice !== undefined) data.unitPrice = unitPrice;
        if (supplier !== undefined) data.supplier = supplier || null;
        if (active !== undefined) data.active = active;

        const product = await prisma.inventoryProduct.update({ where: { id }, data });
        return successResponse({ product }, 'Product updated successfully');
    } catch (error) {
        console.error('PUT /api/inventory/[id]:', error);
        return errorResponse('An unexpected error occurred', 500);
    }
}

/**
 * DELETE /api/inventory/[id]
 * Delete an inventory product and its movements
 */
export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const existing = await prisma.inventoryProduct.findUnique({ where: { id } });
        if (!existing) return errorResponse('Product not found', 404);

        await prisma.inventoryProduct.delete({ where: { id } });
        return successResponse(null, 'Product deleted successfully');
    } catch (error) {
        console.error('DELETE /api/inventory/[id]:', error);
        return errorResponse('An unexpected error occurred', 500);
    }
}
