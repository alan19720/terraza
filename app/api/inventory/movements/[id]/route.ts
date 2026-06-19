import { NextResponse } from 'next/server';
import prisma from '@/prisma/prisma';

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
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
