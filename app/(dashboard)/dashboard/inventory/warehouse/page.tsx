'use client';

import { useAuth } from '@/app/contexts/AuthContext';
import { INVENTORY_ROUTES } from '@/lib/config/routes';
import { WarehouseItemRow, WarehouseFormData } from '@/lib/types/inventory.types';
import { useState, useEffect, useCallback } from 'react';
import {
    Loader2, Plus, Pencil, Trash2, X, Search, PackageOpen, ArrowRightLeft, ArrowDownToLine
} from 'lucide-react';
import { transferStockToKitchen, recordWarehousePurchase } from '@/app/actions/inventory.actions';
import Link from 'next/link';

const EMPTY_ITEM: WarehouseFormData = { name: '', unit: 'PZ', currentStock: '0', unitCost: '0' };
const UNIT_OPTIONS = ['PZ', 'KG', 'LITROS', 'CAJAS', 'BOLSAS', 'COSTAL'];

export default function WarehousePage() {
    const { isLoading: authLoading } = useAuth();

    const [items, setItems] = useState<WarehouseItemRow[]>([]);
    const [categories, setCategories] = useState<{ id: string, name: string }[]>([]);
    const [kitchenItems, setKitchenItems] = useState<{ id: string, name: string }[]>([]);
    
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');

    // Modal
    const [modalOpen, setModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<WarehouseItemRow | null>(null);
    const [form, setForm] = useState<WarehouseFormData & { categoryId?: string }>(EMPTY_ITEM);
    const [formError, setFormError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Delete
    const [deletingItem, setDeletingItem] = useState<WarehouseItemRow | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Transfer Modal
    const [transferModalOpen, setTransferModalOpen] = useState(false);
    const [transferItem, setTransferItem] = useState<WarehouseItemRow | null>(null);
    const [transferTargetId, setTransferTargetId] = useState('');
    const [transferQuantity, setTransferQuantity] = useState('');
    const [transferError, setTransferError] = useState<string | null>(null);
    const [isTransferring, setIsTransferring] = useState(false);

    // Purchase Entry Modal
    const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
    const [purchaseItem, setPurchaseItem] = useState<WarehouseItemRow | null>(null);
    const [purchaseQuantity, setPurchaseQuantity] = useState('');
    const [purchaseCost, setPurchaseCost] = useState('');
    const [purchaseError, setPurchaseError] = useState<string | null>(null);
    const [isPurchasing, setIsPurchasing] = useState(false);

    const fetchItems = useCallback(async () => {
        try {
            setError(null);
            const res = await fetch(INVENTORY_ROUTES.WAREHOUSE.LIST, { credentials: 'include' });
            const json = await res.json();
            if (res.ok && json.success) setItems(json.data);
            else setError(json.error || 'Failed to load warehouse items');
        } catch { setError('Failed to load warehouse items'); }
        finally { setIsLoading(false); }
    }, []);

    const fetchCategories = useCallback(async () => {
        try {
            const res = await fetch('/api/inventory/categories', { credentials: 'include' });
            const json = await res.json();
            if (res.ok && json.success) setCategories(json.data);
        } catch { /* silent */ }
    }, []);

    const fetchKitchenItems = useCallback(async () => {
        try {
            const res = await fetch('/api/inventory', { credentials: 'include' });
            const json = await res.json();
            if (res.ok && json.success) setKitchenItems(json.data);
        } catch { /* silent */ }
    }, []);

    useEffect(() => { fetchItems(); fetchCategories(); fetchKitchenItems(); }, [fetchItems, fetchCategories, fetchKitchenItems]);

    const filtered = items.filter((i) => {
        const q = searchQuery.toLowerCase();
        const matchesSearch = i.name.toLowerCase().includes(q) || i.unit.toLowerCase().includes(q);
        const matchesCategory = selectedCategory ? (i as any).categoryId === selectedCategory : true;
        return matchesSearch && matchesCategory;
    });

    const totalInvertido = items.reduce((sum, a) => sum + (parseFloat(a.currentStock) * parseFloat(a.unitCost)), 0);

    const openCreate = () => { setEditingItem(null); setForm(EMPTY_ITEM); setFormError(null); setModalOpen(true); };
    const openEdit = (i: WarehouseItemRow) => {
        setEditingItem(i);
        setForm({
            name: i.name,
            unit: i.unit,
            currentStock: String(i.currentStock),
            unitCost: String(i.unitCost),
            categoryId: (i as any).categoryId || ''
        });
        setFormError(null); setModalOpen(true);
    };
    const closeModal = () => { setModalOpen(false); setEditingItem(null); setForm(EMPTY_ITEM); setFormError(null); };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setIsSubmitting(true); setFormError(null);
        try {
            const isEdit = !!editingItem;
            const url = isEdit ? INVENTORY_ROUTES.WAREHOUSE.BY_ID(editingItem!.id) : INVENTORY_ROUTES.WAREHOUSE.CREATE;
            const body = {
                name: form.name,
                unit: form.unit,
                currentStock: parseFloat(form.currentStock),
                unitCost: parseFloat(form.unitCost),
                categoryId: form.categoryId || undefined
            };
            const res = await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(body) });
            const json = await res.json();
            if (!res.ok) { setFormError(json.error || 'Something went wrong'); return; }
            closeModal(); fetchItems();
        } catch { setFormError('Network error'); } finally { setIsSubmitting(false); }
    };

    const handleDelete = async () => {
        if (!deletingItem) return; setIsDeleting(true);
        try {
            const res = await fetch(INVENTORY_ROUTES.WAREHOUSE.BY_ID(deletingItem.id), { method: 'DELETE', credentials: 'include' });
            if (res.ok) { setDeletingItem(null); fetchItems(); }
        } catch { /* silent */ } finally { setIsDeleting(false); }
    };

    // Transfer Handling
    const openTransfer = (i: WarehouseItemRow) => {
        setTransferItem(i);
        setTransferTargetId('');
        setTransferQuantity('');
        setTransferError(null);
        setTransferModalOpen(true);
    };

    const closeTransferModal = () => {
        setTransferModalOpen(false);
        setTransferItem(null);
    };

    const handleTransfer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!transferItem || !transferTargetId || !transferQuantity) return;
        setIsTransferring(true);
        setTransferError(null);
        
        const res = await transferStockToKitchen(transferItem.id, transferTargetId, parseFloat(transferQuantity));
        setIsTransferring(false);
        
        if (res.success) {
            closeTransferModal();
            fetchItems(); // Refresh current warehouse stock
        } else {
            setTransferError(res.error || 'Error al transferir stock');
            window.alert('Error: ' + (res.error || 'Desconocido'));
        }
    };

    // Purchase Handling
    const openPurchase = (i: WarehouseItemRow) => {
        setPurchaseItem(i);
        setPurchaseQuantity('');
        setPurchaseCost(String(i.unitCost)); // Default to current cost
        setPurchaseError(null);
        setPurchaseModalOpen(true);
    };

    const closePurchaseModal = () => {
        setPurchaseModalOpen(false);
        setPurchaseItem(null);
    };

    const handlePurchase = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!purchaseItem || !purchaseQuantity) return;
        setIsPurchasing(true);
        setPurchaseError(null);
        
        const res = await recordWarehousePurchase(
            purchaseItem.id, 
            parseFloat(purchaseQuantity), 
            purchaseCost ? parseFloat(purchaseCost) : undefined
        );
        setIsPurchasing(false);
        
        if (res.success) {
            closePurchaseModal();
            fetchItems();
        } else {
            setPurchaseError(res.error || 'Error al registrar entrada');
            window.alert('Error: ' + (res.error || 'Desconocido'));
        }
    };

    if (authLoading) return (<div className="flex flex-1 items-center justify-center"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>);

    return (
        <>
            <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-semibold text-gray-900">Banco (Bodega Principal)</h1>
                        <p className="text-sm text-gray-400">Gestión de inventario a granel y traspasos</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={openCreate} className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all text-sm font-medium cursor-pointer">
                            <Plus className="w-4 h-4" /> Agregar Insumo
                        </button>
                    </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <PackageOpen className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Valor en Bodega</p>
                            <p className="text-2xl font-bold text-gray-900">${totalInvertido.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                        <input type="text" placeholder="Buscar insumo..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-9 pl-9 pr-4 rounded-lg bg-white border border-gray-200 focus:ring-2 focus:ring-primary/10 focus:border-primary/20 transition-all outline-none text-sm text-gray-700 placeholder-gray-300" />
                    </div>
                    <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="h-9 px-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary/20">
                        <option value="">Todas las categorías</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>

                {error && (<div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg px-4 py-3">{error}</div>)}

                {/* Table */}
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-300">
                            <PackageOpen className="w-8 h-8 mb-2" />
                            <p className="text-sm">{searchQuery ? 'No se encontraron insumos' : 'No hay insumos en bodega'}</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50/50">
                                        <th className="text-left py-3 px-5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Insumo</th>
                                        <th className="text-left py-3 px-5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Categoría</th>
                                        <th className="text-left py-3 px-5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Unidad</th>
                                        <th className="text-right py-3 px-5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Stock Actual</th>
                                        <th className="text-right py-3 px-5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filtered.map((i) => {
                                        const cat = categories.find(c => c.id === (i as any).categoryId);
                                        return (
                                        <tr key={i.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold shrink-0 bg-primary/10 text-primary">
                                                        {i.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="font-medium text-gray-800">{i.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 text-gray-500">{cat ? cat.name : '—'}</td>
                                            <td className="px-5 py-3.5 text-gray-500">{i.unit}</td>
                                            <td className="px-5 py-3.5 text-right font-semibold text-gray-800">{i.currentStock}</td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => openPurchase(i)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors cursor-pointer text-xs font-medium mr-2" title="Registrar Entrada / Compra">
                                                        <ArrowDownToLine className="w-3.5 h-3.5" /> Entrada
                                                    </button>
                                                    <button onClick={() => openTransfer(i)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors cursor-pointer text-xs font-medium mr-2" title="Traspasar a Cocina">
                                                        <ArrowRightLeft className="w-3.5 h-3.5" /> Traspasar
                                                    </button>
                                                    <button onClick={() => openEdit(i)} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors cursor-pointer" title="Editar">
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => setDeletingItem(i)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors cursor-pointer" title="Eliminar">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )})}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Traspaso Modal ─────────────────────────────────────── */}
            {transferModalOpen && transferItem && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={closeTransferModal} />
                    <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h2 className="text-sm font-semibold text-gray-800">Traspasar a Cocina/Barra</h2>
                            <button onClick={closeTransferModal} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"><X className="w-4 h-4" /></button>
                        </div>
                        <form onSubmit={handleTransfer} className="p-6 space-y-4">
                            {transferError && (<div className="bg-red-50 border border-red-100 text-red-600 text-xs rounded-lg px-3 py-2">{transferError}</div>)}
                            
                            <div className="bg-emerald-50 text-emerald-800 p-3 rounded-lg text-sm mb-4">
                                Traspasando <strong>{transferItem.name}</strong> (Stock: {transferItem.currentStock} {transferItem.unit})
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1.5">Insumo Destino en Cocina</label>
                                <select required value={transferTargetId} onChange={(e) => setTransferTargetId(e.target.value)}
                                    className="w-full h-9 px-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/10 focus:border-primary/30 outline-none text-sm text-gray-700 transition-all bg-white cursor-pointer">
                                    <option value="" disabled>Selecciona insumo destino...</option>
                                    {kitchenItems.map(k => (
                                        <option key={k.id} value={k.id}>{k.name}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1.5">Cantidad a Traspasar</label>
                                <input type="number" required min="1" step="1" max={transferItem.currentStock} value={transferQuantity} onChange={(e) => setTransferQuantity(e.target.value)}
                                    className="w-full h-9 px-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/10 focus:border-primary/30 outline-none text-sm text-gray-700 transition-all" placeholder="Ej. 10" />
                            </div>
                            
                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button type="button" onClick={closeTransferModal} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer">Cancelar</button>
                                <button type="submit" disabled={isTransferring || !transferTargetId} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium shadow-sm hover:shadow-md transition-all disabled:opacity-50 cursor-pointer">
                                    {isTransferring && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                    Confirmar Traspaso
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Purchase Entry Modal ─────────────────────────────────────── */}
            {purchaseModalOpen && purchaseItem && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={closePurchaseModal} />
                    <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h2 className="text-sm font-semibold text-gray-800">Registrar Entrada / Compra</h2>
                            <button onClick={closePurchaseModal} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"><X className="w-4 h-4" /></button>
                        </div>
                        <form onSubmit={handlePurchase} className="p-6 space-y-4">
                            {purchaseError && (<div className="bg-red-50 border border-red-100 text-red-600 text-xs rounded-lg px-3 py-2">{purchaseError}</div>)}
                            
                            <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm mb-4">
                                Entrada para <strong>{purchaseItem.name}</strong> (Stock Actual: {purchaseItem.currentStock} {purchaseItem.unit})
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Cantidad Entrante</label>
                                    <input type="number" required min="0.01" step="0.01" value={purchaseQuantity} onChange={(e) => setPurchaseQuantity(e.target.value)}
                                        className="w-full h-9 px-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/10 focus:border-primary/30 outline-none text-sm text-gray-700 transition-all" placeholder="Ej. 50" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Costo Unitario (opcional)</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                                        <input type="number" min="0" step="0.01" value={purchaseCost} onChange={(e) => setPurchaseCost(e.target.value)}
                                            className="w-full h-9 pl-7 px-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/10 focus:border-primary/30 outline-none text-sm text-gray-700 transition-all" placeholder="0.00" />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button type="button" onClick={closePurchaseModal} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer">Cancelar</button>
                                <button type="submit" disabled={isPurchasing || !purchaseQuantity} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium shadow-sm hover:shadow-md transition-all disabled:opacity-50 cursor-pointer">
                                    {isPurchasing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                    Registrar Entrada
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Modal (Edit/Create) ─────────────────────────────────────── */}
            {modalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={closeModal} />
                    <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h2 className="text-sm font-semibold text-gray-800">{editingItem ? 'Editar Insumo' : 'Nuevo Insumo'}</h2>
                            <button onClick={closeModal} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"><X className="w-4 h-4" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {formError && (<div className="bg-red-50 border border-red-100 text-red-600 text-xs rounded-lg px-3 py-2">{formError}</div>)}
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1.5">Nombre</label>
                                <input type="text" required value={form.name} onChange={(e) => setForm((d) => ({ ...d, name: e.target.value }))}
                                    className="w-full h-9 px-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/10 focus:border-primary/30 outline-none text-sm text-gray-700 transition-all" placeholder="Ej. Costal de Cebolla" />
                            </div>
                            
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1.5">Categoría / Proveedor</label>
                                <select value={form.categoryId || ''} onChange={(e) => setForm((d) => ({ ...d, categoryId: e.target.value }))}
                                    className="w-full h-9 px-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/10 focus:border-primary/30 outline-none text-sm text-gray-700 transition-all bg-white cursor-pointer">
                                    <option value="">Sin categoría</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Unidad</label>
                                    <select required value={form.unit} onChange={(e) => setForm((d) => ({ ...d, unit: e.target.value }))}
                                        className="w-full h-9 px-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/10 focus:border-primary/30 outline-none text-sm text-gray-700 transition-all bg-white cursor-pointer">
                                        {UNIT_OPTIONS.map((u) => (<option key={u} value={u}>{u}</option>))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Stock Actual</label>
                                    <input type="number" required min="0" step="0.01" value={form.currentStock} onChange={(e) => setForm((d) => ({ ...d, currentStock: e.target.value }))}
                                        className="w-full h-9 px-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/10 focus:border-primary/30 outline-none text-sm text-gray-700 transition-all" placeholder="0" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1.5">Costo Unitario</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                                    <input type="number" required min="0" step="0.01" value={form.unitCost} onChange={(e) => setForm((d) => ({ ...d, unitCost: e.target.value }))}
                                        className="w-full h-9 pl-7 px-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/10 focus:border-primary/30 outline-none text-sm text-gray-700 transition-all" placeholder="0.00" />
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button type="button" onClick={closeModal} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer">Cancelar</button>
                                <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-medium shadow-sm hover:shadow-md transition-all disabled:opacity-50 cursor-pointer">
                                    {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                    {editingItem ? 'Guardar Cambios' : 'Registrar Insumo'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Delete Confirmation ──────────────────────────────── */}
            {deletingItem && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setDeletingItem(null)} />
                    <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="text-sm font-semibold text-gray-800">Eliminar Insumo</h2>
                        <p className="text-sm text-gray-500">¿Estás seguro de que deseas eliminar <span className="font-medium text-gray-800">{deletingItem.name}</span> de la bodega?</p>
                        <div className="flex items-center justify-end gap-2">
                            <button onClick={() => setDeletingItem(null)} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer">Cancelar</button>
                            <button onClick={handleDelete} disabled={isDeleting} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium shadow-sm transition-all disabled:opacity-50 cursor-pointer">
                                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
