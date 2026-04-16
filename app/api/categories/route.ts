import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/prisma/prisma';
import { successResponse, errorResponse } from '@/lib/utils/api-response';

const createCategorySchema = z.object({
    name: z.string().min(1, 'Name is required'),
});

/**
 * GET /api/categories
 * List all categories with their available meals and total meal count
 */
export async function GET() {
    try {
        const categories = await prisma.category.findMany({
            orderBy: { name: 'asc' },
            include: {
                meals: {
                    where: { isAvailable: true },
                    orderBy: { name: 'asc' },
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        price: true,
                    },
                },
                _count: { select: { meals: true } },
            },
        });
        return successResponse({ categories });
    } catch (e) {
        console.error('GET /api/categories:', e);
        return errorResponse('Failed to fetch categories', 500);
    }
}

/**
 * POST /api/categories
 * Create a new category
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validation = createCategorySchema.safeParse(body);
        if (!validation.success) {
            const errors = validation.error.flatten().fieldErrors;
            return errorResponse(Object.values(errors).flat().join(', '), 400);
        }

        const { name } = validation.data;

        const existing = await prisma.category.findFirst({ where: { name } });
        if (existing) return errorResponse('A category with this name already exists', 409);

        const category = await prisma.category.create({
            data: { name },
            include: { _count: { select: { meals: true } } },
        });

        return successResponse({ category }, 'Category created successfully', 201);
    } catch (error) {
        console.error('POST /api/categories:', error);
        return errorResponse('An unexpected error occurred', 500);
    }
}
