import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/prisma/prisma';
import { successResponse, errorResponse } from '@/lib/utils/api-response';

const updateMealSchema = z.object({
    name: z.string().min(1, 'Name is required').optional(),
    description: z.string().optional(),
    price: z.number().positive('Price must be positive').optional(),
    categoryId: z.string().uuid('Invalid category ID').optional(),
    isAvailable: z.boolean().optional(),
});

/**
 * PUT /api/meals/[id]
 * Update an existing meal (including isAvailable toggle)
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const existing = await prisma.meal.findUnique({ where: { id } });
        if (!existing) return errorResponse('Meal not found', 404);

        const body = await request.json();
        const validation = updateMealSchema.safeParse(body);
        if (!validation.success) {
            const errors = validation.error.flatten().fieldErrors;
            return errorResponse(Object.values(errors).flat().join(', '), 400);
        }

        const { name, description, price, categoryId, isAvailable } = validation.data;

        if (categoryId) {
            const cat = await prisma.category.findUnique({ where: { id: categoryId } });
            if (!cat) return errorResponse('Invalid category ID', 400);
        }

        const updateData: Record<string, unknown> = {};
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description || null;
        if (price !== undefined) updateData.price = price;
        if (categoryId !== undefined) updateData.categoryId = categoryId;
        if (isAvailable !== undefined) updateData.isAvailable = isAvailable;

        const meal = await prisma.meal.update({
            where: { id },
            data: updateData,
            select: {
                id: true, name: true, description: true, price: true, isAvailable: true,
                category: { select: { id: true, name: true } },
            },
        });

        return successResponse({ meal }, 'Meal updated successfully');
    } catch (error) {
        console.error('PUT /api/meals/[id]:', error);
        return errorResponse('An unexpected error occurred', 500);
    }
}
