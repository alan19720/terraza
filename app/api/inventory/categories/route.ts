import { NextResponse } from 'next/server';
import prisma from '@/prisma/prisma';
import * as z from 'zod';

export async function GET() {
    try {
        const categories = await prisma.inventoryCategory.findMany({
            orderBy: { name: 'asc' }
        });
        return NextResponse.json({ success: true, data: categories });
    } catch (error) {
        console.error("Fetch InventoryCategories Error:", error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch categories' },
            { status: 500 }
        );
    }
}

const categorySchema = z.object({
    name: z.string().min(1, 'El nombre es requerido'),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const data = categorySchema.parse(body);

        const newCategory = await prisma.inventoryCategory.create({
            data
        });

        return NextResponse.json({ success: true, data: newCategory }, { status: 201 });
    } catch (error) {
        console.error("Create InventoryCategory Error:", error);
        return NextResponse.json(
            { success: false, error: 'Failed to create category' },
            { status: 500 }
        );
    }
}
