'use server';

import prisma from '@/prisma/prisma';
import { revalidatePath } from 'next/cache';

export async function createInventoryCategory(name: string) {
    if (!name || name.trim() === '') {
        return { success: false, error: 'El nombre es requerido' };
    }

    try {
        const category = await prisma.inventoryCategory.create({
            data: { name: name.trim() }
        });
        
        revalidatePath('/dashboard/inventory');
        revalidatePath('/dashboard/inventory/warehouse');
        return { success: true, data: category };
    } catch (error: any) {
        console.error("CATEGORY CREATION ERROR: ", error);
        if (error.code === 'P2002') {
            return { success: false, error: 'Esta categoría ya existe' };
        }
        return { success: false, error: error.message || 'Error al crear la categoría' };
    }
}

export async function deleteInventoryCategory(id: string) {
    if (!id) return { success: false, error: 'ID es requerido' };

    try {
        // First, optionally check if it has products linked and prevent deletion, or set them to null.
        // In our schema, the relation is optional and onDelete is not CASCADE, so deleting it might fail if constrained,
        // or we can just try to delete it and handle the foreign key constraint error.
        await prisma.inventoryCategory.delete({
            where: { id }
        });

        revalidatePath('/dashboard/inventory');
        revalidatePath('/dashboard/inventory/warehouse');
        return { success: true };
    } catch (error: any) {
        console.error("Delete InventoryCategory Error:", error);
        if (error.code === 'P2003') {
             return { success: false, error: 'No se puede eliminar porque hay productos o insumos usando esta categoría' };
        }
        return { success: false, error: 'Error al eliminar la categoría' };
    }
}
