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

export async function PUT(
    req: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params;
        const { id } = params;
        const body = await req.json();
        const data = warehouseSchema.parse(body);

        const updated = await prisma.warehouseItem.update({
            where: { id },
            data
        });

        return NextResponse.json({ success: true, data: updated });
    } catch (error) {
        console.error("Update Warehouse Item Error:", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { success: false, error: error.issues[0].message },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { success: false, error: 'Failed to update warehouse item' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    req: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params;
        const { id } = params;
        await prisma.warehouseItem.delete({
            where: { id }
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete Warehouse Item Error:", error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete warehouse item' },
            { status: 500 }
        );
    }
}
