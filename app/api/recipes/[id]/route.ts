import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/prisma/prisma';
import { successResponse, errorResponse } from '@/lib/utils/api-response';

const ingredientSchema = z.object({
    ingredientId: z.string().uuid(),
    quantityUsed: z.number().positive(),
});

const updateRecipeSchema = z.object({
    name: z.string().min(1).optional(),
    dishType: z.string().min(1).optional(),
    preparationTime: z.number().int().min(0).optional(),
    season: z.string().optional(),
    portionSize: z.number().min(0).optional(),
    portionsYield: z.number().int().min(1).optional(),
    sellingPrice: z.number().min(0).optional(),
    active: z.boolean().optional(),
    ingredients: z.array(ingredientSchema).min(1).optional(),
});

/**
 * PUT /api/recipes/[id]
 * Update a recipe — if ingredients are provided, re-syncs them (delete old → create new)
 */
export async function PUT(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params;
        const { id } = params;
        const existing = await prisma.recipe.findUnique({ where: { id } });
        if (!existing) return errorResponse('Recipe not found', 404);

        const body = await request.json();
        const validation = updateRecipeSchema.safeParse(body);
        if (!validation.success) {
            const errors = validation.error.flatten().fieldErrors;
            return errorResponse(Object.values(errors).flat().join(', '), 400);
        }

        const { ingredients, ...fields } = validation.data;

        // Build update data (only defined fields)
        const data: Record<string, unknown> = {};
        if (fields.name !== undefined) data.name = fields.name;
        if (fields.dishType !== undefined) data.dishType = fields.dishType;
        if (fields.preparationTime !== undefined) data.preparationTime = fields.preparationTime;
        if (fields.season !== undefined) data.season = fields.season;
        if (fields.portionSize !== undefined) data.portionSize = fields.portionSize;
        if (fields.portionsYield !== undefined) data.portionsYield = fields.portionsYield;
        if (fields.sellingPrice !== undefined) data.sellingPrice = fields.sellingPrice;
        if (fields.active !== undefined) data.active = fields.active;

        if (ingredients) {
            // Re-sync: delete old → create new
            await prisma.$transaction([
                prisma.recipeIngredient.deleteMany({ where: { recipeId: id } }),
                prisma.recipe.update({
                    where: { id },
                    data: {
                        ...data,
                        ingredients: {
                            create: ingredients.map((ing) => ({
                                ingredientId: ing.ingredientId,
                                quantityUsed: ing.quantityUsed,
                            })),
                        },
                    },
                }),
            ]);
        } else {
            await prisma.recipe.update({ where: { id }, data });
        }

        // Re-fetch with full relations
        const recipe = await prisma.recipe.findUnique({
            where: { id },
            include: {
                ingredients: {
                    include: {
                        ingredient: {
                            select: { id: true, name: true, unit: true, unitPrice: true, yieldPercent: true },
                        },
                    },
                },
            },
        });

        return successResponse({ recipe }, 'Recipe updated successfully');
    } catch (error) {
        console.error('PUT /api/recipes/[id]:', error);
        return errorResponse('An unexpected error occurred', 500);
    }
}

/**
 * DELETE /api/recipes/[id]
 * Delete a recipe (cascades to RecipeIngredient)
 */
export async function DELETE(
    _request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params;
        const { id } = params;
        const existing = await prisma.recipe.findUnique({ where: { id } });
        if (!existing) return errorResponse('Recipe not found', 404);

        await prisma.recipe.delete({ where: { id } });
        return successResponse(null, 'Recipe deleted successfully');
    } catch (error) {
        console.error('DELETE /api/recipes/[id]:', error);
        return errorResponse('An unexpected error occurred', 500);
    }
}
