import { NextResponse } from 'next/server';
import prisma from '@/prisma/prisma';

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        const { id } = params;
        
        const movements = await prisma.inventoryMovement.findMany({
            where: {
                OR: [
                    { warehouseItemId: id },
                    { productId: id }
                ]
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json({ success: true, data: movements });
    } catch (error) {
        console.error("Fetch Movements Error:", error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch movements' },
            { status: 500 }
        );
    }
}
