'use client';

import { useAuth } from '@/app/contexts/AuthContext';
import { RECIPE_ROUTES, INVENTORY_ROUTES } from '@/lib/config/routes';
import { RecipeRow, RecipeFormData, RecipeIngredientFormItem } from '@/lib/types/recipe.types';
import { InventoryProductRow } from '@/lib/types/inventory.types';
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Loader2, Plus, Pencil, Trash2, X, Search, Calculator,
    ClipboardList, AlertCircle, ChefHat, PlusCircle, MinusCircle, Percent
} from 'lucide-react';

const EMPTY_RECIPE: RecipeFormData = {
    name: '', dishType: 'Plato Fuerte', preparationTime: '15',
    season: 'Todo el año', portionSize: '0', portionsYield: '1', sellingPrice: '0'
};

export default function RecipesPage() {
    const { isLoading: authLoading } = useAuth();

    // Data State
    const [recipes, setRecipes] = useState<RecipeRow[]>([]);
    const [inventory, setInventory] = useState<InventoryProductRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Modal State
    const [modalOpen, setModalOpen] = useState(false);
    const [editingRecipe, setEditingRecipe] = useState<RecipeRow | null>(null);
    const [form, setForm] = useState<RecipeFormData>(EMPTY_RECIPE);
    const [ingredientsForm, setIngredientsForm] = useState<RecipeIngredientFormItem[]>([]);
    const [formError, setFormError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Delete State
    const [deletingRecipe, setDeletingRecipe] = useState<RecipeRow | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            setError(null);
            const [recipesRes, inventoryRes] = await Promise.all([
                fetch(RECIPE_ROUTES.LIST, { credentials: 'include' }),
                fetch(INVENTORY_ROUTES.LIST, { credentials: 'include' })
            ]);

            const recipesJson = await recipesRes.json();
            const inventoryJson = await inventoryRes.json();

            if (recipesRes.ok && recipesJson.success) {
                setRecipes(recipesJson.data.recipes);
            }
            if (inventoryRes.ok && inventoryJson.success) {
                setInventory(inventoryJson.data.products);
            }
        } catch {
            setError('Failed to load data');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const filtered = recipes.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()) || r.dishType.toLowerCase().includes(searchQuery.toLowerCase()));

    // Helpers
    const getNetPrice = (item: InventoryProductRow) => (parseFloat(item.unitPrice) || 0) / ((item.yieldPercent || 100) / 100);

    const calculateRecipeCost = (recipeIngredients: any[]) => {
        return recipeIngredients.reduce((total, ri) => {
            let netPrice = 0;
            // If checking from form state vs fetched state
            if (ri.ingredient) {
                // Computed from nested relation
                netPrice = (parseFloat(ri.ingredient.unitPrice) || 0) / ((ri.ingredient.yieldPercent || 100) / 100);
            } else {
                // Computed from current inventory list (form state)
                const invItem = inventory.find(i => i.id === ri.ingredientId);
                if (invItem) netPrice = getNetPrice(invItem);
            }
            return total + (parseFloat(String(ri.quantityUsed)) || 0) * netPrice;
        }, 0);
    };

    // Form handlers
    const openCreate = () => {
        setEditingRecipe(null);
        setForm(EMPTY_RECIPE);
        setIngredientsForm([]);
        setFormError(null);
        setModalOpen(true);
    };

    const openEdit = (recipe: RecipeRow) => {
        setEditingRecipe(recipe);
        setForm({
            name: recipe.name,
            dishType: recipe.dishType,
            preparationTime: String(recipe.preparationTime),
            season: recipe.season,
            portionSize: String(recipe.portionSize),
            portionsYield: String(recipe.portionsYield),
            sellingPrice: String(recipe.sellingPrice)
        });
        setIngredientsForm(recipe.ingredients.map(ing => ({
            ingredientId: ing.ingredientId,
            quantityUsed: String(ing.quantityUsed)
        })));
        setFormError(null);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditingRecipe(null);
    };

    const handleAddIngredientRow = () => {
        setIngredientsForm([...ingredientsForm, { ingredientId: '', quantityUsed: '' }]);
    };

    const handleRemoveIngredientRow = (index: number) => {
        const updated = [...ingredientsForm];
        updated.splice(index, 1);
        setIngredientsForm(updated);
    };

    const handleIngredientChange = (index: number, field: keyof RecipeIngredientFormItem, value: string) => {
        const updated = [...ingredientsForm];
        updated[index][field] = value;
        setIngredientsForm(updated);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);

        // Validation
        if (ingredientsForm.length === 0) {
            setFormError('Agrega al menos un ingrediente a la receta.');
            return;
        }
        if (ingredientsForm.some(i => !i.ingredientId || !i.quantityUsed || parseFloat(i.quantityUsed) <= 0)) {
            setFormError('Completa todos los campos de ingredientes con valores válidos.');
            return;
        }

        setIsSubmitting(true);
        try {
            const isEdit = !!editingRecipe;
            const url = isEdit ? RECIPE_ROUTES.UPDATE(editingRecipe.id) : RECIPE_ROUTES.CREATE;
            
            const body = {
                name: form.name,
                dishType: form.dishType,
                preparationTime: parseInt(form.preparationTime) || 0,
                season: form.season,
                portionSize: parseFloat(form.portionSize) || 0,
                portionsYield: parseInt(form.portionsYield) || 1,
                sellingPrice: parseFloat(form.sellingPrice) || 0,
                ingredients: ingredientsForm.map(i => ({
                    ingredientId: i.ingredientId,
                    quantityUsed: parseFloat(i.quantityUsed)
                }))
            };

            const res = await fetch(url, {
                method: isEdit ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(body)
            });

            const json = await res.json();
            if (!res.ok) {
                setFormError(json.error || 'Ocurrió un error');
                setIsSubmitting(false);
                return;
            }

            closeModal();
            fetchData();
        } catch {
            setFormError('Error de conexión');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deletingRecipe) return;
        setIsDeleting(true);
        try {
            const res = await fetch(RECIPE_ROUTES.DELETE(deletingRecipe.id), { method: 'DELETE', credentials: 'include' });
            if (res.ok) {
                setDeletingRecipe(null);
                fetchData();
            }
        } catch { /* silent */ } finally { setIsDeleting(false); }
    };

    // Derived costs for the modal
    const currentTotalCost = useMemo(() => calculateRecipeCost(ingredientsForm), [ingredientsForm, inventory]);
    const currentPortions = parseInt(form.portionsYield) || 1;
    const currentCostPerPortion = currentTotalCost / currentPortions;
    const currentSellingPrice = parseFloat(form.sellingPrice) || 0;
    const currentMargin = currentSellingPrice > 0 ? ((currentSellingPrice - currentCostPerPortion) / currentSellingPrice) * 100 : 0;

    if (authLoading) return <div className="flex flex-1 items-center justify-center"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;

    return (
        <>
            <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-semibold text-gray-900">Recetario / Costeo</h1>
                        <p className="text-sm text-gray-400">Administra recetas y calcula sus costos</p>
                    </div>
                    <button onClick={openCreate} className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2.5 rounded-lg shadow-sm transition-all text-sm font-medium cursor-pointer">
                        <Plus className="w-4 h-4" /> Nueva Receta
                    </button>
                </div>

                <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                    <input type="text" placeholder="Buscar receta..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-9 pl-9 pr-4 rounded-lg bg-white border border-gray-200 focus:ring-2 focus:ring-primary/10 focus:border-primary/20 transition-all outline-none text-sm text-gray-700" />
                </div>

                {error && <div className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-3 border border-red-100">{error}</div>}

                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-300">
                            <ChefHat className="w-8 h-8 mb-2" />
                            <p className="text-sm">No hay recetas registradas</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50/50">
                                        <th className="text-left py-3 px-5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Receta</th>
                                        <th className="text-left py-3 px-5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">Tipo</th>
                                        <th className="text-right py-3 px-5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Costo Receta</th>
                                        <th className="text-right py-3 px-5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Costo Porción</th>
                                        <th className="text-right py-3 px-5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Venta</th>
                                        <th className="text-right py-3 px-5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider hidden lg:table-cell">Margen</th>
                                        <th className="text-right py-3 px-5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filtered.map(recipe => {
                                        const totalCost = calculateRecipeCost(recipe.ingredients);
                                        const costPerPortion = totalCost / recipe.portionsYield;
                                        const sellingPrice = parseFloat(recipe.sellingPrice) || 0;
                                        const margin = sellingPrice > 0 ? ((sellingPrice - costPerPortion) / sellingPrice) * 100 : 0;

                                        return (
                                            <tr key={recipe.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                                                            <ClipboardList className="w-4 h-4" />
                                                        </div>
                                                        <div>
                                                            <span className="font-medium text-gray-800 block truncate">{recipe.name}</span>
                                                            <span className="text-xs text-gray-400 block">{recipe.portionsYield} porcion(es)</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5 text-gray-500 hidden md:table-cell">{recipe.dishType}</td>
                                                <td className="px-5 py-3.5 text-right font-medium text-gray-600">${totalCost.toFixed(2)}</td>
                                                <td className="px-5 py-3.5 text-right font-semibold text-blue-600">${costPerPortion.toFixed(2)}</td>
                                                <td className="px-5 py-3.5 text-right font-semibold text-gray-800">${sellingPrice.toFixed(2)}</td>
                                                <td className="px-5 py-3.5 text-right hidden lg:table-cell">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${margin >= 60 ? 'bg-emerald-50 text-emerald-600' : margin >= 40 ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'}`}>
                                                        {margin.toFixed(0)}%
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button onClick={() => openEdit(recipe)} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors">
                                                            <Pencil className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => setDeletingRecipe(recipe)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
                    <div className="relative bg-white rounded-xl shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                        
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white z-10 shrink-0">
                            <div>
                                <h2 className="text-base font-semibold text-gray-800">{editingRecipe ? 'Editar Receta' : 'Nueva Receta'}</h2>
                                <p className="text-xs text-gray-400">Gestiona los detalles y costeo de la receta</p>
                            </div>
                            <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col lg:flex-row gap-8">
                            
                            {/* LEFT SIDE: General Details */}
                            <div className="lg:w-1/3 flex flex-col space-y-4 shrink-0">
                                <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2">Información General</h3>
                                
                                {formError && <div className="bg-red-50 border border-red-100 text-red-600 text-xs rounded-lg px-3 py-2 flex items-start gap-2"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> <span>{formError}</span></div>}

                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Nombre de la Receta</label>
                                    <input type="text" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                        className="w-full h-9 px-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/10 focus:border-primary/30 outline-none text-sm" placeholder="Ej. Ceviche Mitre" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1.5">Tipo de Platillo</label>
                                        <select value={form.dishType} onChange={e => setForm(f => ({ ...f, dishType: e.target.value }))}
                                            className="w-full h-9 px-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/10 focus:border-primary/30 outline-none text-sm bg-white">
                                            <option value="Entrada">Entrada</option>
                                            <option value="Plato Fuerte">Plato Fuerte</option>
                                            <option value="Sopa">Sopa</option>
                                            <option value="Postre">Postre</option>
                                            <option value="Bebida">Bebida</option>
                                            <option value="Base/Salsa">Base/Salsa (Sub-receta)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1.5">T. Prep. (min)</label>
                                        <input type="number" required min="0" value={form.preparationTime} onChange={e => setForm(f => ({ ...f, preparationTime: e.target.value }))}
                                            className="w-full h-9 px-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/10 outline-none text-sm" placeholder="15" />
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1.5">Rendimiento (Porciones)</label>
                                        <input type="number" required min="1" value={form.portionsYield} onChange={e => setForm(f => ({ ...f, portionsYield: e.target.value }))}
                                            className="w-full h-9 px-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/10 outline-none text-sm" placeholder="1" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1.5">Costo Venta ($)</label>
                                        <input type="number" required min="0" step="0.5" value={form.sellingPrice} onChange={e => setForm(f => ({ ...f, sellingPrice: e.target.value }))}
                                            className="w-full h-9 px-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/10 outline-none text-sm font-semibold text-gray-700" placeholder="0.00" />
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1"><Calculator className="w-3.5 h-3.5" /> Rentabilidad</h4>
                                    
                                    <div className="flex justify-between items-center bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                                        <span className="text-xs text-gray-500">Costo Total Receta:</span>
                                        <span className="text-sm font-semibold text-gray-700">${currentTotalCost.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-blue-50/50 p-2.5 rounded-lg border border-blue-100 text-blue-800">
                                        <span className="text-xs">Costo por Porción:</span>
                                        <span className="text-sm font-bold">${currentCostPerPortion.toFixed(2)}</span>
                                    </div>
                                    <div className={`flex justify-between items-center p-2.5 rounded-lg border ${currentMargin >= 60 ? 'bg-emerald-50/50 border-emerald-100 text-emerald-700' : currentMargin >= 40 ? 'bg-amber-50/50 border-amber-100 text-amber-700' : 'bg-red-50/50 border-red-100 text-red-700'}`}>
                                        <span className="text-xs">Margen de Ganancia:</span>
                                        <span className="text-sm font-bold flex items-center">{currentMargin.toFixed(1)} <Percent className="w-3 h-3 ml-0.5" /></span>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT SIDE: Ingredients Form */}
                            <div className="flex-1 flex flex-col h-full border-l border-gray-100 pl-8 space-y-4">
                                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                    <h3 className="text-sm font-semibold text-gray-700">Ingredientes</h3>
                                    <button type="button" onClick={handleAddIngredientRow} className="text-xs font-medium text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
                                        <PlusCircle className="w-4 h-4" /> Agregar Ingrediente
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto pr-2 space-y-3 pb-20">
                                    {ingredientsForm.length === 0 ? (
                                        <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                            <p className="text-sm mb-2">La receta aún no tiene ingredientes</p>
                                            <button type="button" onClick={handleAddIngredientRow} className="text-xs font-medium text-primary hover:underline">Comenzar a agregar</button>
                                        </div>
                                    ) : (
                                        ingredientsForm.map((row, idx) => {
                                            const selectedItem = inventory.find(i => i.id === row.ingredientId);
                                            const netPrice = selectedItem ? getNetPrice(selectedItem) : 0;
                                            const rowCost = (parseFloat(row.quantityUsed) || 0) * netPrice;

                                            return (
                                                <div key={idx} className="flex items-start gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm relative group hover:border-blue-100 transition-colors">
                                                    <div className="flex-1">
                                                        <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Ingrediente</label>
                                                        <select value={row.ingredientId} onChange={e => handleIngredientChange(idx, 'ingredientId', e.target.value)} required
                                                            className="w-full h-9 px-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/10 outline-none text-sm bg-white">
                                                            <option value="" disabled>Selecciona un insumo...</option>
                                                            {inventory.map(inv => (
                                                                <option key={inv.id} value={inv.id}>{inv.name} ({inv.unit})</option>
                                                            ))}
                                                        </select>
                                                        {selectedItem && (
                                                            <div className="mt-1.5 flex gap-4 text-[11px] text-gray-400">
                                                                <span>Precio Neto: ${(netPrice).toFixed(2)}/{selectedItem.unit}</span>
                                                                <span>Stock: {selectedItem.currentStock} {selectedItem.unit}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="w-28">
                                                        <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Cantidad</label>
                                                        <div className="relative">
                                                            <input type="number" step="0.001" min="0" required value={row.quantityUsed} onChange={e => handleIngredientChange(idx, 'quantityUsed', e.target.value)}
                                                                className="w-full h-9 px-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/10 outline-none text-sm" placeholder="0" />
                                                            {selectedItem && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 text-xs">{selectedItem.unit}</span>}
                                                        </div>
                                                    </div>

                                                    <div className="w-24 flex flex-col justify-center">
                                                        <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1 text-right">Costo</label>
                                                        <div className="h-9 flex items-center justify-end font-semibold text-gray-700 text-sm">
                                                            ${rowCost.toFixed(2)}
                                                        </div>
                                                    </div>

                                                    <button type="button" onClick={() => handleRemoveIngredientRow(idx)} className="absolute -right-2 -top-2 w-6 h-6 rounded-full bg-red-100 text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-500 hover:text-white">
                                                        <MinusCircle className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            {/* Sticky Footer */}
                            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3 z-20">
                                <button type="button" onClick={closeModal} className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-200 transition-colors">Cancelar</button>
                                <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-medium shadow-md shadow-primary/20 transition-all disabled:opacity-50">
                                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {editingRecipe ? 'Guardar Cambios' : 'Crear Receta'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {deletingRecipe && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeletingRecipe(null)} />
                    <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="text-base font-semibold text-gray-800">Eliminar Receta</h2>
                        <p className="text-sm text-gray-500">¿Estás seguro de que deseas eliminar <span className="font-medium text-gray-800">{deletingRecipe.name}</span>? Los datos de costeo se perderán.</p>
                        <div className="flex items-center justify-end gap-2 pt-2">
                            <button onClick={() => setDeletingRecipe(null)} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors">Cancelar</button>
                            <button onClick={handleDelete} disabled={isDeleting} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium shadow-sm transition-all disabled:opacity-50">
                                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
