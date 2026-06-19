'use server';

import prisma from '@/prisma/prisma';
import { revalidatePath } from 'next/cache';

export async function transferStockToKitchen(
    warehouseItemId: string,
    targetIngredientId: string,
    quantity: number
) {
    if (quantity <= 0) {
        return { success: false, error: 'La cantidad debe ser mayor a 0' };
    }

    try {
        const warehouseItem = await prisma.warehouseItem.findUnique({
            where: { id: warehouseItemId }
        });

        if (!warehouseItem) {
            return { success: false, error: 'Insumo de bodega no encontrado' };
        }

        if (Number(warehouseItem.currentStock) < quantity) {
            return { success: false, error: 'Stock insuficiente en bodega' };
        }

        const ingredient = await prisma.inventoryProduct.findUnique({
            where: { id: targetIngredientId }
        });

        if (!ingredient) {
            return { success: false, error: 'Insumo destino (Cocina/Barra) no encontrado' };
        }

        // Enforce integer for kitchen stock since currentStock is Int
        const intQuantity = Math.round(quantity);

        await prisma.$transaction([
            // Deduct from Warehouse (currentStock is Decimal)
            prisma.warehouseItem.update({
                where: { id: warehouseItemId },
                data: {
                    currentStock: {
                        decrement: quantity
                    }
                }
            }),
            // Add to InventoryProduct (currentStock is Int)
            prisma.inventoryProduct.update({
                where: { id: targetIngredientId },
                data: {
                    currentStock: {
                        increment: intQuantity
                    }
                }
            }),
            // Create StockMovement
            prisma.stockMovement.create({
                data: {
                    productId: targetIngredientId,
                    type: 'IN',
                    quantity: intQuantity,
                    notes: `Traspaso desde bodega: ${warehouseItem.name}`
                }
            })
        ]);

        revalidatePath('/dashboard/inventory');
        revalidatePath('/dashboard/inventory/warehouse');

        return { success: true };
    } catch (error) {
        console.error("transferStockToKitchen error:", error);
        return { success: false, error: 'Error interno en el servidor al realizar el traspaso' };
    }
}
