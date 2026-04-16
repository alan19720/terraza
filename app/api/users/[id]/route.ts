import { NextRequest } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { prisma } from '@/prisma/prisma';
import { successResponse, errorResponse } from '@/lib/utils/api-response';

const updateUserSchema = z.object({
    name: z.string().min(1, 'Name is required').optional(),
    email: z.string().email('Invalid email address').optional(),
    password: z.string().min(6, 'Password must be at least 6 characters').optional(),
    roleId: z.string().uuid('Invalid role ID').optional(),
    active: z.boolean().optional(),
});

/**
 * PUT /api/users/[id]
 * Update an existing user (including active field for soft delete)
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const existing = await prisma.user.findUnique({ where: { id } });
        if (!existing) {
            return errorResponse('User not found', 404);
        }

        const body = await request.json();
        const validation = updateUserSchema.safeParse(body);

        if (!validation.success) {
            const errors = validation.error.flatten().fieldErrors;
            return errorResponse(Object.values(errors).flat().join(', '), 400);
        }

        const { name, email, password, roleId, active } = validation.data;

        if (email && email !== existing.email) {
            const emailTaken = await prisma.user.findUnique({ where: { email } });
            if (emailTaken) {
                return errorResponse('Email is already in use', 409);
            }
        }

        if (roleId) {
            const role = await prisma.role.findUnique({ where: { id: roleId } });
            if (!role) {
                return errorResponse('Invalid role ID', 400);
            }
        }

        const updateData: Record<string, unknown> = {};
        if (name !== undefined) updateData.name = name;
        if (email !== undefined) updateData.email = email;
        if (roleId !== undefined) updateData.roleId = roleId;
        if (active !== undefined) updateData.active = active;
        if (password) updateData.password = await bcrypt.hash(password, 10);

        const user = await prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                active: true,
                role: { select: { id: true, name: true } },
            },
        });

        return successResponse({ user }, 'User updated successfully');
    } catch (error) {
        console.error('PUT /api/users/[id]:', error);
        return errorResponse('An unexpected error occurred', 500);
    }
}
