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

export async function GET() {
    try {
        const assets = await prisma.fixedAsset.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json({ success: true, data: assets });
    } catch (error) {
        console.error("Fetch Assets Error:", error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch assets' },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const data = assetSchema.parse(body);

        const totalValue = data.quantity * data.unitCost;

        const newAsset = await prisma.fixedAsset.create({
            data: {
                ...data,
                totalValue,
                purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : undefined,
            }
        });

        return NextResponse.json({ success: true, data: newAsset }, { status: 201 });
    } catch (error) {
        console.error("Create Asset Error:", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { success: false, error: error.errors[0].message },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { success: false, error: 'Failed to create asset' },
            { status: 500 }
        );
    }
}
