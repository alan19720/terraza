import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { prisma } from '@/prisma/prisma';
import { successResponse, errorResponse } from '@/lib/utils/api-response';

// Validation schema for user registration
const createUserSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    roleId: z.string().uuid('Invalid role ID'),
});

/**
 * POST /api/users/create
 * Creates a new user with hashed password
 */
export async function POST(request: NextRequest) {
    try {
        // Parse request body
        const body = await request.json();

        // Validate input
        const validation = createUserSchema.safeParse(body);

        if (!validation.success) {
            const errors = validation.error.flatten().fieldErrors;
            return errorResponse(
                Object.values(errors).flat().join(', '),
                400
            );
        }

        const { name, email, password, roleId } = validation.data;

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return errorResponse('User with this email already exists', 409);
        }

        // Verify role exists
        const role = await prisma.role.findUnique({
            where: { id: roleId },
        });

        if (!role) {
            return errorResponse('Invalid role ID', 400);
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                roleId,
                active: true,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                    },
                },
                active: true,
                createdAt: true,
            },
        });

        return successResponse(
            { user },
            'User created successfully',
            201
        );
    } catch (error) {
        console.error('User creation error:', error);

        if (error instanceof Error) {
            return errorResponse(error.message, 500);
        }

        return errorResponse('An unexpected error occurred', 500);
    }
}
