/**
 * Recipe costing module TypeScript types
 */

export interface RecipeIngredientRow {
    id: string;
    ingredientId: string;
    quantityUsed: number;
    ingredient: {
        id: string;
        name: string;
        unit: string;
        unitPrice: string;
        yieldPercent: number;
    };
}

export interface RecipeRow {
    id: string;
    name: string;
    dishType: string;
    preparationTime: number;
    season: string;
    portionSize: number;
    portionsYield: number;
    sellingPrice: string;
    active: boolean;
    createdAt: string;
    ingredients: RecipeIngredientRow[];
}

export interface RecipeFormData {
    name: string;
    dishType: string;
    preparationTime: string;
    season: string;
    portionSize: string;
    portionsYield: string;
    sellingPrice: string;
}

export interface RecipeIngredientFormItem {
    ingredientId: string;
    quantityUsed: string;
}
