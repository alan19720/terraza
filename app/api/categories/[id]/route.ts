import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/prisma/prisma';
import { successResponse, errorResponse } from '@/lib/utils/api-response';

const updateCategorySchema = z.object({
    name: z.string().min(1, 'Name is required').optional(),
});

/**
 * PUT /api/categories/[id]
 * Update an existing category
 */
export async function PUT(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params;
        const { id } = params;
        const existing = await prisma.category.findUnique({ where: { id } });
        if (!existing) return errorResponse('Category not found', 404);

        const body = await request.json();
        const validation = updateCategorySchema.safeParse(body);
        if (!validation.success) {
            const errors = validation.error.flatten().fieldErrors;
            return errorResponse(Object.values(errors).flat().join(', '), 400);
        }

        const { name } = validation.data;
        if (name && name !== existing.name) {
            const nameTaken = await prisma.category.findFirst({ where: { name } });
            if (nameTaken) return errorResponse('A category with this name already exists', 409);
        }

        const category = await prisma.category.update({
            where: { id },
            data: { ...(name !== undefined && { name }) },
            include: { _count: { select: { meals: true } } },
        });

        return successResponse({ category }, 'Category updated successfully');
    } catch (error) {
        console.error('PUT /api/categories/[id]:', error);
        return errorResponse('An unexpected error occurred', 500);
    }
}
