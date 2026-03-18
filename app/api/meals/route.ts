import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/prisma/prisma';
import { successResponse, errorResponse } from '@/lib/utils/api-response';

const createMealSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional().default(''),
    price: z.number().positive('Price must be positive'),
    categoryId: z.string().uuid('Invalid category ID'),
    isAvailable: z.boolean().optional().default(true),
});

/**
 * GET /api/meals
 * List all meals with category info
 */
export async function GET() {
    try {
        const meals = await prisma.meal.findMany({
            orderBy: [{ category: { name: 'asc' } }, { name: 'asc' }],
            select: {
                id: true, name: true, description: true, price: true, isAvailable: true,
                category: { select: { id: true, name: true } },
            },
        });
        return successResponse({ meals });
    } catch (e) {
        console.error('GET /api/meals:', e);
        return errorResponse('Failed to fetch meals', 500);
    }
}

/**
 * POST /api/meals
 * Create a new meal
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validation = createMealSchema.safeParse(body);
        if (!validation.success) {
            const errors = validation.error.flatten().fieldErrors;
            return errorResponse(Object.values(errors).flat().join(', '), 400);
        }

        const { name, description, price, categoryId, isAvailable } = validation.data;

        const category = await prisma.category.findUnique({ where: { id: categoryId } });
        if (!category) return errorResponse('Invalid category ID', 400);

        const meal = await prisma.meal.create({
            data: { name, description: description || null, price, categoryId, isAvailable },
            select: {
                id: true, name: true, description: true, price: true, isAvailable: true,
                category: { select: { id: true, name: true } },
            },
        });

        return successResponse({ meal }, 'Meal created successfully', 201);
    } catch (error) {
        console.error('POST /api/meals:', error);
        return errorResponse('An unexpected error occurred', 500);
    }
}
