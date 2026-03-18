/**
 * Menu management TypeScript types
 */

export interface MealRow {
    id: string;
    name: string;
    description: string | null;
    price: string;
    isAvailable: boolean;
    category: { id: string; name: string };
}

export interface MealFormData {
    name: string;
    description: string;
    price: string;
    categoryId: string;
    isAvailable: boolean;
}

export interface CategoryRow {
    id: string;
    name: string;
    _count: { meals: number };
}

export interface CategoryFormData {
    name: string;
}
