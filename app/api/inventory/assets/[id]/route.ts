import { NextResponse } from 'next/server';
import prisma from '@/prisma/prisma';
import * as z from 'zod';

const assetSchema = z.object({
    name: z.string().min(1, 'El nombre es requerido'),
    description: z.string().optional(),
    quantity: z.number().int().min(1),
    unitCost: z.number().min(0),
    purchaseDate: z.string().optional(),
});

export async function PUT(
    req: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params;
        const { id } = params;
        const body = await req.json();
        const data = assetSchema.parse(body);

        const totalValue = data.quantity * data.unitCost;

        const updated = await prisma.fixedAsset.update({
            where: { id },
            data: {
                ...data,
                totalValue,
                purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : undefined,
            }
        });

        return NextResponse.json({ success: true, data: updated });
    } catch (error) {
        console.error("Update Asset Error:", error);
        return NextResponse.json(
            { success: false, error: 'Failed to update asset' },
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
        await prisma.fixedAsset.delete({
            where: { id }
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete Asset Error:", error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete asset' },
            { status: 500 }
        );
    }
}
