'use client';

import { useAuth } from '@/app/contexts/AuthContext';
import { MEAL_ROUTES, CATEGORY_ROUTES } from '@/lib/config/routes';
import { MealRow, MealFormData, CategoryRow, CategoryFormData } from '@/lib/types/menu.types';
import { useState, useEffect, useCallback } from 'react';
import { mutate } from 'swr';
import {
    Loader2, Plus, Pencil, X, Search, Check, Ban, UtensilsCrossed, FolderOpen,
} from 'lucide-react';

const EMPTY_MEAL: MealFormData = { name: '', description: '', price: '', categoryId: '', isAvailable: true };
const EMPTY_CAT: CategoryFormData = { name: '' };

export default function MenuPage() {
    const { isLoading: authLoading } = useAuth();

    const [meals, setMeals] = useState<MealRow[]>([]);
    const [categories, setCategories] = useState<CategoryRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState<string>('all');

    // Meal modal
    const [mealModalOpen, setMealModalOpen] = useState(false);
    const [editingMeal, setEditingMeal] = useState<MealRow | null>(null);
    const [mealForm, setMealForm] = useState<MealFormData>(EMPTY_MEAL);
    const [mealFormError, setMealFormError] = useState<string | null>(null);
    const [mealSubmitting, setMealSubmitting] = useState(false);

    // Category modal
    const [catModalOpen, setCatModalOpen] = useState(false);
    const [editingCat, setEditingCat] = useState<CategoryRow | null>(null);
    const [catForm, setCatForm] = useState<CategoryFormData>(EMPTY_CAT);
    const [catFormError, setCatFormError] = useState<string | null>(null);
    const [catSubmitting, setCatSubmitting] = useState(false);

    // ── Fetch ─────────────────────────────────────────────────────────
    const fetchMeals = useCallback(async () => {
        try {
            const res = await fetch(MEAL_ROUTES.LIST, { credentials: 'include' });
            const json = await res.json();
            if (res.ok && json.success) setMeals(json.data.meals);
            else setError(json.error || 'Failed to load meals');
        } catch { setError('Failed to load meals'); }
        finally { setIsLoading(false); }
    }, []);

    const fetchCategories = useCallback(async () => {
        try {
            const res = await fetch(CATEGORY_ROUTES.LIST, { credentials: 'include' });
            const json = await res.json();
            if (res.ok && json.success) setCategories(json.data.categories);
        } catch { /* silent */ }
    }, []);

    useEffect(() => { fetchMeals(); fetchCategories(); }, [fetchMeals, fetchCategories]);

    // ── Filtered ──────────────────────────────────────────────────────
    const filtered = meals.filter((m) => {
        const q = searchQuery.toLowerCase();
        const matchSearch = m.name.toLowerCase().includes(q) || (m.description ?? '').toLowerCase().includes(q) || m.category.name.toLowerCase().includes(q);
        const matchCat = activeCategory === 'all' || m.category.id === activeCategory;
        return matchSearch && matchCat;
    });

    // ── Meal handlers ─────────────────────────────────────────────────
    const openCreateMeal = () => { setEditingMeal(null); setMealForm(EMPTY_MEAL); setMealFormError(null); setMealModalOpen(true); };

    const openEditMeal = (m: MealRow) => {
        setEditingMeal(m);
        setMealForm({ name: m.name, description: m.description ?? '', price: String(m.price), categoryId: m.category.id, isAvailable: m.isAvailable });
        setMealFormError(null);
        setMealModalOpen(true);
    };

    const closeMealModal = () => { setMealModalOpen(false); setEditingMeal(null); setMealForm(EMPTY_MEAL); setMealFormError(null); };

    const handleMealSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMealSubmitting(true); setMealFormError(null);
        try {
            const isEdit = !!editingMeal;
            const url = isEdit ? MEAL_ROUTES.UPDATE(editingMeal!.id) : MEAL_ROUTES.CREATE;
            const body: Record<string, unknown> = {
                name: mealForm.name, description: mealForm.description,
                price: parseFloat(mealForm.price), categoryId: mealForm.categoryId,
            };
            if (isEdit) body.isAvailable = mealForm.isAvailable;

            const res = await fetch(url, {
                method: isEdit ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include', body: JSON.stringify(body),
            });
            const json = await res.json();
            if (!res.ok) { setMealFormError(json.error || 'Something went wrong'); return; }
            closeMealModal(); fetchMeals(); fetchCategories();
            mutate('/api/categories');
        } catch { setMealFormError('Network error'); } finally { setMealSubmitting(false); }
    };

    const toggleAvailability = async (m: MealRow) => {
        try {
            await fetch(MEAL_ROUTES.UPDATE(m.id), {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                credentials: 'include', body: JSON.stringify({ isAvailable: !m.isAvailable }),
            });
            fetchMeals();
            mutate('/api/categories');
        } catch { /* silent */ }
    };

    // ── Category handlers ─────────────────────────────────────────────
    const openCreateCat = () => { setEditingCat(null); setCatForm(EMPTY_CAT); setCatFormError(null); setCatModalOpen(true); };
    const openEditCat = (c: CategoryRow) => { setEditingCat(c); setCatForm({ name: c.name }); setCatFormError(null); setCatModalOpen(true); };
    const closeCatModal = () => { setCatModalOpen(false); setEditingCat(null); setCatForm(EMPTY_CAT); setCatFormError(null); };

    const handleCatSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setCatSubmitting(true); setCatFormError(null);
        try {
            const isEdit = !!editingCat;
            const url = isEdit ? CATEGORY_ROUTES.UPDATE(editingCat!.id) : CATEGORY_ROUTES.CREATE;
            const res = await fetch(url, {
                method: isEdit ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include', body: JSON.stringify({ name: catForm.name }),
            });
            const json = await res.json();
            if (!res.ok) { setCatFormError(json.error || 'Something went wrong'); return; }
            closeCatModal(); fetchCategories(); fetchMeals();
            mutate('/api/categories');
        } catch { setCatFormError('Network error'); } finally { setCatSubmitting(false); }
    };

    if (authLoading) {
        return (<div className="flex flex-1 items-center justify-center"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>);
    }

    return (
        <>
            <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                        <h1 className="text-lg font-semibold text-gray-900">Menú</h1>
                        <p className="text-sm text-gray-400">Gestión de platillos y categorías</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={openCreateCat} className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all text-sm font-medium cursor-pointer">
                            <Plus className="w-4 h-4" /> Nueva Categoría
                        </button>
                        <button onClick={openCreateMeal} className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all text-sm font-medium cursor-pointer">
                            <Plus className="w-4 h-4" /> Nuevo Platillo
                        </button>
                    </div>
                </div>

                {/* Category tabs + Search */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <button onClick={() => setActiveCategory('all')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${activeCategory === 'all' ? 'bg-primary text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                            Todos <span className="ml-1 opacity-70">({meals.length})</span>
                        </button>
                        {categories.map((c) => (
                            <button key={c.id} onClick={() => setActiveCategory(c.id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${activeCategory === c.id ? 'bg-primary text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                                {c.name} <span className="opacity-70">({c._count.meals})</span>
                                <button onClick={(e) => { e.stopPropagation(); openEditCat(c); }}
                                    className={`p-0.5 rounded hover:bg-black/10 transition-colors cursor-pointer ${activeCategory === c.id ? 'text-white/70 hover:text-white' : 'text-gray-300 hover:text-gray-500'}`}>
                                    <Pencil className="w-3 h-3" />
                                </button>
                            </button>
                        ))}
                    </div>
                    <div className="relative sm:ml-auto max-w-sm w-full sm:w-auto">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                        <input type="text" placeholder="Buscar platillo..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-9 pl-9 pr-4 rounded-lg bg-white border border-gray-200 focus:ring-2 focus:ring-primary/10 focus:border-primary/20 transition-all outline-none text-sm text-gray-700 placeholder-gray-300" />
                    </div>
                </div>

                {error && (<div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg px-4 py-3">{error}</div>)}

                {/* Meals table */}
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-300">
                            <UtensilsCrossed className="w-8 h-8 mb-2" />
                            <p className="text-sm">{searchQuery || activeCategory !== 'all' ? 'No se encontraron platillos' : 'No hay platillos registrados'}</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100">
                                        <th className="text-left py-3 px-5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Platillo</th>
                                        <th className="text-left py-3 px-5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">Categoría</th>
                                        <th className="text-right py-3 px-5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Precio</th>
                                        <th className="text-left py-3 px-5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Disponible</th>
                                        <th className="text-right py-3 px-5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filtered.map((m) => (
                                        <tr key={m.id} className={`transition-colors ${!m.isAvailable ? 'bg-gray-50/40 hover:bg-gray-50/70' : 'hover:bg-gray-50/50'}`}>
                                            <td className="px-5 py-3.5">
                                                <div className="min-w-0">
                                                    <span className="font-medium text-gray-800 truncate block max-w-[220px]">{m.name}</span>
                                                    {m.description && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[220px]">{m.description}</p>}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 hidden md:table-cell">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-50 text-amber-600 text-xs font-medium">{m.category.name}</span>
                                            </td>
                                            <td className="px-5 py-3.5 text-right font-semibold text-gray-800">${parseFloat(m.price).toFixed(2)}</td>
                                            <td className="px-5 py-3.5">
                                                {m.isAvailable ? (
                                                    <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-medium"><Check className="w-3.5 h-3.5" /> Disponible</span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-gray-400 text-xs font-medium"><Ban className="w-3.5 h-3.5" /> No disponible</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => openEditMeal(m)} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors cursor-pointer" title="Editar">
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => toggleAvailability(m)}
                                                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${m.isAvailable ? 'hover:bg-red-50 text-gray-400 hover:text-red-500' : 'hover:bg-emerald-50 text-gray-400 hover:text-emerald-600'}`}
                                                        title={m.isAvailable ? 'Marcar no disponible' : 'Marcar disponible'}>
                                                        {m.isAvailable ? <Ban className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Meal Modal ───────────────────────────────────────── */}
            {mealModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={closeMealModal} />
                    <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h2 className="text-sm font-semibold text-gray-800">{editingMeal ? 'Editar Platillo' : 'Nuevo Platillo'}</h2>
                            <button onClick={closeMealModal} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"><X className="w-4 h-4" /></button>
                        </div>
                        <form onSubmit={handleMealSubmit} className="p-6 space-y-4">
                            {mealFormError && (<div className="bg-red-50 border border-red-100 text-red-600 text-xs rounded-lg px-3 py-2">{mealFormError}</div>)}

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1.5">Nombre</label>
                                <input type="text" required value={mealForm.name} onChange={(e) => setMealForm((d) => ({ ...d, name: e.target.value }))}
                                    className="w-full h-9 px-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/10 focus:border-primary/30 outline-none text-sm text-gray-700 transition-all" placeholder="Nombre del platillo" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1.5">Descripción <span className="text-gray-300 font-normal">(opcional)</span></label>
                                <textarea value={mealForm.description} onChange={(e) => setMealForm((d) => ({ ...d, description: e.target.value }))}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/10 focus:border-primary/30 outline-none text-sm text-gray-700 transition-all resize-none" placeholder="Descripción breve" rows={2} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Precio</label>
                                    <input type="number" required min="0.01" step="0.01" value={mealForm.price} onChange={(e) => setMealForm((d) => ({ ...d, price: e.target.value }))}
                                        className="w-full h-9 px-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/10 focus:border-primary/30 outline-none text-sm text-gray-700 transition-all" placeholder="0.00" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Categoría</label>
                                    <select required value={mealForm.categoryId} onChange={(e) => setMealForm((d) => ({ ...d, categoryId: e.target.value }))}
                                        className="w-full h-9 px-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/10 focus:border-primary/30 outline-none text-sm text-gray-700 transition-all bg-white cursor-pointer">
                                        <option value="">Seleccionar...</option>
                                        {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                                    </select>
                                </div>
                            </div>
                            {editingMeal && (
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-medium text-gray-600">Disponible</label>
                                    <button type="button" role="switch" aria-checked={mealForm.isAvailable} onClick={() => setMealForm((d) => ({ ...d, isAvailable: !d.isAvailable }))}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer ${mealForm.isAvailable ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${mealForm.isAvailable ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>
                            )}
                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button type="button" onClick={closeMealModal} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer">Cancelar</button>
                                <button type="submit" disabled={mealSubmitting} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-medium shadow-sm hover:shadow-md transition-all disabled:opacity-50 cursor-pointer">
                                    {mealSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                    {editingMeal ? 'Guardar Cambios' : 'Crear Platillo'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Category Modal ────────────────────────────────────── */}
            {catModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={closeCatModal} />
                    <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h2 className="text-sm font-semibold text-gray-800">{editingCat ? 'Editar Categoría' : 'Nueva Categoría'}</h2>
                            <button onClick={closeCatModal} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"><X className="w-4 h-4" /></button>
                        </div>
                        <form onSubmit={handleCatSubmit} className="p-6 space-y-4">
                            {catFormError && (<div className="bg-red-50 border border-red-100 text-red-600 text-xs rounded-lg px-3 py-2">{catFormError}</div>)}
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1.5">Nombre</label>
                                <input type="text" required value={catForm.name} onChange={(e) => setCatForm((d) => ({ ...d, name: e.target.value }))}
                                    className="w-full h-9 px-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/10 focus:border-primary/30 outline-none text-sm text-gray-700 transition-all" placeholder="Nombre de la categoría" />
                            </div>
                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button type="button" onClick={closeCatModal} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer">Cancelar</button>
                                <button type="submit" disabled={catSubmitting} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-medium shadow-sm hover:shadow-md transition-all disabled:opacity-50 cursor-pointer">
                                    {catSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                    {editingCat ? 'Guardar Cambios' : 'Crear Categoría'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
