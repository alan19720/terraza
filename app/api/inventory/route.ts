import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/prisma/prisma';
import { successResponse, errorResponse } from '@/lib/utils/api-response';

const createProductSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional().default(''),
    unit: z.string().min(1, 'Unit is required'),
    currentStock: z.number().int().min(0).default(0),
    minimumStock: z.number().int().min(0).default(0),
    yieldPercent: z.number().min(0).max(100).default(100),
    grossWeight: z.number().min(0).default(0),
    unitPrice: z.number().min(0).default(0),
    supplier: z.string().optional().default(''),
    active: z.boolean().optional().default(true),
    categoryId: z.string().optional(),
});

/**
 * GET /api/inventory
 * List all inventory products
 */
export async function GET() {
    try {
        const products = await prisma.inventoryProduct.findMany({
            orderBy: { name: 'asc' },
        });
        return successResponse({ products });
    } catch (e) {
        console.error('GET /api/inventory:', e);
        return errorResponse('Failed to fetch inventory', 500);
    }
}

/**
 * POST /api/inventory
 * Create a new inventory product
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validation = createProductSchema.safeParse(body);
        if (!validation.success) {
            const errors = validation.error.flatten().fieldErrors;
            return errorResponse(Object.values(errors).flat().join(', '), 400);
        }

        const { name, description, unit, currentStock, minimumStock, yieldPercent, grossWeight, unitPrice, supplier, active, categoryId } = validation.data;

        const product = await prisma.inventoryProduct.create({
            data: { name, description: description || null, unit, currentStock, minimumStock, yieldPercent, grossWeight, unitPrice, supplier: supplier || null, active, categoryId },
        });

        // Record initial stock if > 0
        if (currentStock > 0) {
            await prisma.stockMovement.create({
                data: { productId: product.id, type: 'IN', quantity: currentStock, notes: 'Stock inicial' },
            });
        }

        return successResponse({ product }, 'Product created successfully', 201);
    } catch (error) {
        console.error('POST /api/inventory:', error);
        return errorResponse('An unexpected error occurred', 500);
    }
}
