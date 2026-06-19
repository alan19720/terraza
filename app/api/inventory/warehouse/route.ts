import { NextResponse } from 'next/server';
import prisma from '@/prisma/prisma';
import * as z from 'zod';

const warehouseSchema = z.object({
    name: z.string().min(1, 'El nombre es requerido'),
    unit: z.string().min(1),
    currentStock: z.number().min(0),
    minStockAlert: z.number().min(0).optional().default(0),
    unitCost: z.number().min(0),
    categoryId: z.string().optional(),
});

export async function GET() {
    try {
        const items = await prisma.warehouseItem.findMany({
            orderBy: { name: 'asc' }
        });
        return NextResponse.json({ success: true, data: items });
    } catch (error) {
        console.error("Fetch Warehouse Error:", error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch warehouse items' },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const data = warehouseSchema.parse(body);

        const newItem = await prisma.warehouseItem.create({
            data
        });

        return NextResponse.json({ success: true, data: newItem }, { status: 201 });
    } catch (error) {
        console.error("Create Warehouse Item Error:", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { success: false, error: error.issues[0].message },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { success: false, error: 'Failed to create warehouse item' },
            { status: 500 }
        );
    }
}
