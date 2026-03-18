/**
 * Inventory management TypeScript types
 */

export interface InventoryProductRow {
    id: string;
    name: string;
    description: string | null;
    unit: string;
    currentStock: number;
    minimumStock: number;
    active: boolean;
    createdAt: string;
}

export interface ProductFormData {
    name: string;
    description: string;
    unit: string;
    currentStock: string;
    minimumStock: string;
    active: boolean;
}

export interface StockFormData {
    type: 'IN' | 'OUT' | 'ADJUSTMENT';
    quantity: string;
    notes: string;
}
