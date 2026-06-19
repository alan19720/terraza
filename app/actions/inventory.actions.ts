'use server';

import prisma from '@/prisma/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const transferSchema = z.object({
    warehouseItemId: z.string().min(1, 'El ID de bodega es requerido'),
    targetIngredientId: z.string().min(1, 'El ID de destino es requerido'),
    quantity: z.number().positive('La cantidad debe ser mayor a 0')
});

export async function transferStockToKitchen(
    warehouseItemId: string,
    targetIngredientId: string,
    quantity: number
) {
    try {
        const data = transferSchema.parse({ warehouseItemId, targetIngredientId, quantity });

        const warehouseItem = await prisma.warehouseItem.findUnique({
            where: { id: data.warehouseItemId }
        });

        if (!warehouseItem) {
            return { success: false, error: 'Insumo de bodega no encontrado' };
        }

        if (Number(warehouseItem.currentStock) < data.quantity) {
            return { success: false, error: 'Stock insuficiente en bodega' };
        }

        const ingredient = await prisma.inventoryProduct.findUnique({
            where: { id: data.targetIngredientId }
        });

        if (!ingredient) {
            return { success: false, error: 'Insumo destino (Cocina/Barra) no encontrado' };
        }

        // Enforce integer for kitchen stock since currentStock is Int
        const intQuantity = Math.round(data.quantity);

        await prisma.$transaction([
            // Deduct from Warehouse
            prisma.warehouseItem.update({
                where: { id: data.warehouseItemId },
                data: {
                    currentStock: {
                        decrement: data.quantity
                    }
                }
            }),
            // Add to InventoryProduct
            prisma.inventoryProduct.update({
                where: { id: data.targetIngredientId },
                data: {
                    currentStock: {
                        increment: intQuantity
                    }
                }
            }),
            // Kardex: Transfer Out from Warehouse
            prisma.inventoryMovement.create({
                data: {
                    warehouseItemId: data.warehouseItemId,
                    type: 'TRANSFER_OUT',
                    quantity: data.quantity,
                    description: `Traspaso hacia cocina: ${ingredient.name}`
                }
            }),
            // Kardex: Transfer In to Kitchen
            prisma.inventoryMovement.create({
                data: {
                    productId: data.targetIngredientId,
                    type: 'TRANSFER_IN',
                    quantity: intQuantity,
                    description: `Traspaso desde bodega: ${warehouseItem.name}`
                }
            }),
            // Legacy StockMovement for backwards compatibility (if still relied upon anywhere else)
            prisma.stockMovement.create({
                data: {
                    productId: data.targetIngredientId,
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
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0].message };
        }
        return { success: false, error: 'Error interno en el servidor al realizar el traspaso' };
    }
}

const purchaseSchema = z.object({
    warehouseItemId: z.string().min(1, 'El ID de bodega es requerido'),
    quantity: z.number().positive('La cantidad debe ser mayor a 0'),
    unitCost: z.number().nonnegative('El costo unitario no puede ser negativo').optional()
});

export async function recordWarehousePurchase(
    warehouseItemId: string,
    quantity: number,
    unitCost?: number
) {
    try {
        const data = purchaseSchema.parse({ warehouseItemId, quantity, unitCost });

        const warehouseItem = await prisma.warehouseItem.findUnique({
            where: { id: data.warehouseItemId }
        });

        if (!warehouseItem) {
            return { success: false, error: 'Insumo de bodega no encontrado' };
        }

        const updateData: any = {
            currentStock: { increment: data.quantity }
        };

        if (data.unitCost !== undefined) {
            updateData.unitCost = data.unitCost;
        }

        await prisma.$transaction([
            prisma.warehouseItem.update({
                where: { id: data.warehouseItemId },
                data: updateData
            }),
            prisma.inventoryMovement.create({
                data: {
                    warehouseItemId: data.warehouseItemId,
                    type: 'PURCHASE_ENTRY',
                    quantity: data.quantity,
                    description: `Entrada por compra${data.unitCost !== undefined ? ` a $${data.unitCost.toFixed(2)}` : ''}`
                }
            })
        ]);

        revalidatePath('/dashboard/inventory/warehouse');

        return { success: true };
    } catch (error) {
        console.error("recordWarehousePurchase error:", error);
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0].message };
        }
        return { success: false, error: 'Error interno en el servidor al registrar la compra' };
    }
}
