import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/prisma/prisma';
import { successResponse, errorResponse } from '@/lib/utils/api-response';

export const dynamic = 'force-dynamic';

const ingredientSchema = z.object({
    ingredientId: z.string().uuid(),
    quantityUsed: z.number().positive(),
});

const createRecipeSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    dishType: z.string().min(1, 'Dish type is required'),
    preparationTime: z.number().int().min(0).default(0),
    season: z.string().optional().default('Todo el año'),
    portionSize: z.number().min(0).default(0),
    portionsYield: z.number().int().min(1).default(1),
    sellingPrice: z.number().min(0).default(0),
    ingredients: z.array(ingredientSchema).min(1, 'At least one ingredient is required'),
});

/**
 * GET /api/recipes
 * List all recipes with nested ingredients and computed costs
 */
export async function GET() {
    try {
        const recipes = await prisma.recipe.findMany({
            orderBy: { name: 'asc' },
            include: {
                ingredients: {
                    include: {
                        ingredient: {
                            select: {
                                id: true,
                                name: true,
                                unit: true,
                                unitPrice: true,
                                yieldPercent: true,
                            },
                        },
                    },
                },
            },
        });
        return successResponse({ recipes });
    } catch (e) {
        console.error('GET /api/recipes:', e);
        return errorResponse('Failed to fetch recipes', 500);
    }
}

/**
 * POST /api/recipes
 * Create a recipe with ingredients in a single transaction
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validation = createRecipeSchema.safeParse(body);
        if (!validation.success) {
            const errors = validation.error.flatten().fieldErrors;
            return errorResponse(Object.values(errors).flat().join(', '), 400);
        }

        const { name, dishType, preparationTime, season, portionSize, portionsYield, sellingPrice, ingredients } = validation.data;

        const recipe = await prisma.recipe.create({
            data: {
                name,
                dishType,
                preparationTime,
                season,
                portionSize,
                portionsYield,
                sellingPrice,
                ingredients: {
                    create: ingredients.map((ing) => ({
                        ingredientId: ing.ingredientId,
                        quantityUsed: ing.quantityUsed,
                    })),
                },
            },
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

        return successResponse({ recipe }, 'Recipe created successfully', 201);
    } catch (error) {
        console.error('POST /api/recipes:', error);
        return errorResponse('An unexpected error occurred', 500);
    }
}
