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
    yieldPercent: number;
    grossWeight: number;
    unitPrice: string;
    supplier: string | null;
    active: boolean;
    createdAt: string;
}

export interface ProductFormData {
    name: string;
    description: string;
    categoryId?: string;
    unit: string;
    currentStock: string;
    minimumStock: string;
    yieldPercent: string;
    grossWeight: string;
    unitPrice: string;
    supplier: string;
    active: boolean;
}

export interface StockFormData {
    type: 'IN' | 'OUT' | 'ADJUSTMENT';
    quantity: string;
    notes: string;
}

export interface FixedAssetRow {
    id: string;
    name: string;
    description: string | null;
    quantity: number;
    unitCost: string;
    totalValue: string;
    purchaseDate: string;
    createdAt: string;
}

export interface AssetFormData {
    name: string;
    description: string;
    quantity: string;
    unitCost: string;
    purchaseDate: string;
}

export interface WarehouseItemRow {
    id: string;
    name: string;
    unit: string;
    currentStock: string;
    minStockAlert: string;
    unitCost: string;
    createdAt: string;
}

export interface WarehouseFormData {
    name: string;
    unit: string;
    currentStock: string;
    minStockAlert: string;
    unitCost: string;
}
