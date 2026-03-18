'use client';

import { useAuth } from '@/app/contexts/AuthContext';
import { INVENTORY_ROUTES } from '@/lib/config/routes';
import { InventoryProductRow, ProductFormData, StockFormData } from '@/lib/types/inventory.types';
import { useState, useEffect, useCallback } from 'react';
import {
    Loader2, Plus, Pencil, Trash2, X, Search, AlertTriangle,
    ArrowUpCircle, ArrowDownCircle, Check, Ban, Package, ClipboardList,
} from 'lucide-react';
import Link from 'next/link';

const EMPTY_PRODUCT: ProductFormData = { name: '', description: '', unit: 'piezas', currentStock: '0', minimumStock: '0', active: true };
const EMPTY_STOCK: StockFormData = { type: 'IN', quantity: '', notes: '' };
const UNIT_OPTIONS = ['piezas', 'kg', 'litros', 'gramos', 'ml', 'cajas', 'bolsas', 'latas'];

export default function InventoryPage() {
    const { isLoading: authLoading } = useAuth();

    const [products, setProducts] = useState<InventoryProductRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Product modal
    const [productModalOpen, setProductModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<InventoryProductRow | null>(null);
    const [productForm, setProductForm] = useState<ProductFormData>(EMPTY_PRODUCT);
    const [productFormError, setProductFormError] = useState<string | null>(null);
    const [productSubmitting, setProductSubmitting] = useState(false);

    // Stock modal
    const [stockModalOpen, setStockModalOpen] = useState(false);
    const [stockProduct, setStockProduct] = useState<InventoryProductRow | null>(null);
    const [stockForm, setStockForm] = useState<StockFormData>(EMPTY_STOCK);
    const [stockFormError, setStockFormError] = useState<string | null>(null);
    const [stockSubmitting, setStockSubmitting] = useState(false);

    // Delete
    const [deletingProduct, setDeletingProduct] = useState<InventoryProductRow | null>(null);
    const [deleting, setDeleting] = useState(false);

    // ── Fetch ─────────────────────────────────────────────────────────
    const fetchProducts = useCallback(async () => {
        try {
            setError(null);
            const res = await fetch(INVENTORY_ROUTES.LIST, { credentials: 'include' });
            const json = await res.json();
            if (res.ok && json.success) setProducts(json.data.products);
            else setError(json.error || 'Failed to load inventory');
        } catch { setError('Failed to load inventory'); }
        finally { setIsLoading(false); }
    }, []);

    useEffect(() => { fetchProducts(); }, [fetchProducts]);

    // ── Computed ───────────────────────────────────────────────────────
    const filtered = products.filter((p) => {
        const q = searchQuery.toLowerCase();
        return p.name.toLowerCase().includes(q) || (p.description ?? '').toLowerCase().includes(q) || p.unit.toLowerCase().includes(q);
    });
    const lowStockCount = products.filter((p) => p.active && p.currentStock <= p.minimumStock).length;
    const isLowStock = (p: InventoryProductRow) => p.active && p.currentStock <= p.minimumStock;

    // ── Product handlers ──────────────────────────────────────────────
    const openCreateProduct = () => { setEditingProduct(null); setProductForm(EMPTY_PRODUCT); setProductFormError(null); setProductModalOpen(true); };
    const openEditProduct = (p: InventoryProductRow) => {
        setEditingProduct(p);
        setProductForm({ name: p.name, description: p.description ?? '', unit: p.unit, currentStock: String(p.currentStock), minimumStock: String(p.minimumStock), active: p.active });
        setProductFormError(null); setProductModalOpen(true);
    };
    const closeProductModal = () => { setProductModalOpen(false); setEditingProduct(null); setProductForm(EMPTY_PRODUCT); setProductFormError(null); };

    const handleProductSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setProductSubmitting(true); setProductFormError(null);
        try {
            const isEdit = !!editingProduct;
            const url = isEdit ? INVENTORY_ROUTES.UPDATE(editingProduct!.id) : INVENTORY_ROUTES.CREATE;
            const body: Record<string, unknown> = isEdit
                ? { name: productForm.name, description: productForm.description, unit: productForm.unit, minimumStock: parseInt(productForm.minimumStock), active: productForm.active }
                : { name: productForm.name, description: productForm.description, unit: productForm.unit, currentStock: parseInt(productForm.currentStock), minimumStock: parseInt(productForm.minimumStock), active: productForm.active };
            const res = await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(body) });
            const json = await res.json();
            if (!res.ok) { setProductFormError(json.error || 'Something went wrong'); return; }
            closeProductModal(); fetchProducts();
        } catch { setProductFormError('Network error'); } finally { setProductSubmitting(false); }
    };

    const handleDelete = async () => {
        if (!deletingProduct) return; setDeleting(true);
        try {
            const res = await fetch(INVENTORY_ROUTES.DELETE(deletingProduct.id), { method: 'DELETE', credentials: 'include' });
            if (res.ok) { setDeletingProduct(null); fetchProducts(); }
        } catch { /* silent */ } finally { setDeleting(false); }
    };

    // ── Stock handlers ────────────────────────────────────────────────
    const openStockModal = (p: InventoryProductRow, type: 'IN' | 'OUT') => {
        setStockProduct(p); setStockForm({ type, quantity: '', notes: '' }); setStockFormError(null); setStockModalOpen(true);
    };
    const closeStockModal = () => { setStockModalOpen(false); setStockProduct(null); setStockForm(EMPTY_STOCK); setStockFormError(null); };

    const handleStockSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); if (!stockProduct) return;
        setStockSubmitting(true); setStockFormError(null);
        try {
            const res = await fetch(INVENTORY_ROUTES.STOCK, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
                body: JSON.stringify({ productId: stockProduct.id, type: stockForm.type, quantity: parseInt(stockForm.quantity), notes: stockForm.notes }),
            });
            const json = await res.json();
            if (!res.ok) { setStockFormError(json.error || 'Something went wrong'); return; }
            closeStockModal(); fetchProducts();
        } catch { setStockFormError('Network error'); } finally { setStockSubmitting(false); }
    };

    if (authLoading) return (<div className="flex flex-1 items-center justify-center"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>);

    return (
        <>
            <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-semibold text-gray-900">Inventario</h1>
                        <p className="text-sm text-gray-400">Gestión de productos y niveles de stock</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href="/dashboard/inventory/kardex" className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 px-4 py-2.5 rounded-lg shadow-sm transition-all text-sm font-medium">
                            <ClipboardList className="w-4 h-4" /> Ver Kardex
                        </Link>
                        <button onClick={openCreateProduct} className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all text-sm font-medium cursor-pointer">
                            <Plus className="w-4 h-4" /> Agregar Producto
                        </button>
                    </div>
                </div>

                {/* Low stock alert */}
                {lowStockCount > 0 && (
                    <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
                        <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                        <p className="text-sm text-red-600"><span className="font-semibold">{lowStockCount}</span> producto{lowStockCount !== 1 ? 's' : ''} con stock bajo o agotado</p>
                    </div>
                )}

                {/* Search */}
                <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                    <input type="text" placeholder="Buscar producto..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-9 pl-9 pr-4 rounded-lg bg-white border border-gray-200 focus:ring-2 focus:ring-primary/10 focus:border-primary/20 transition-all outline-none text-sm text-gray-700 placeholder-gray-300" />
                </div>

                {error && (<div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg px-4 py-3">{error}</div>)}

                {/* Table */}
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-300">
                            <Package className="w-8 h-8 mb-2" />
                            <p className="text-sm">{searchQuery ? 'No se encontraron productos' : 'No hay productos registrados'}</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100">
                                        <th className="text-left py-3 px-5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Producto</th>
                                        <th className="text-right py-3 px-5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Stock Actual</th>
                                        <th className="text-right py-3 px-5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">Stock Mínimo</th>
                                        <th className="text-left py-3 px-5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">Unidad</th>
                                        <th className="text-left py-3 px-5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Estado</th>
                                        <th className="text-right py-3 px-5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filtered.map((p) => (
                                        <tr key={p.id} className={`transition-colors ${isLowStock(p) ? 'bg-red-50/40 hover:bg-red-50/70' : 'hover:bg-gray-50/50'}`}>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold shrink-0 ${isLowStock(p) ? 'bg-red-100 text-red-600' : 'bg-primary/10 text-primary'}`}>
                                                        {isLowStock(p) ? <AlertTriangle className="w-4 h-4" /> : p.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <span className="font-medium text-gray-800 truncate block max-w-[180px]">{p.name}</span>
                                                        {isLowStock(p) && <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-500 mt-0.5">Bajo Stock</span>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                <span className={`font-semibold ${isLowStock(p) ? 'text-red-600' : 'text-gray-800'}`}>{p.currentStock}</span>
                                            </td>
                                            <td className="px-5 py-3.5 text-right text-gray-400 hidden md:table-cell">{p.minimumStock}</td>
                                            <td className="px-5 py-3.5 text-gray-500 hidden md:table-cell">{p.unit}</td>
                                            <td className="px-5 py-3.5">
                                                {p.active ? (
                                                    <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-medium"><Check className="w-3.5 h-3.5" /> Activo</span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-gray-400 text-xs font-medium"><Ban className="w-3.5 h-3.5" /> Inactivo</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => openStockModal(p, 'IN')} className="p-1.5 rounded-lg hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 transition-colors cursor-pointer" title="Entrada de stock">
                                                        <ArrowUpCircle className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => openStockModal(p, 'OUT')} className="p-1.5 rounded-lg hover:bg-amber-50 text-gray-400 hover:text-amber-600 transition-colors cursor-pointer" title="Salida de stock">
                                                        <ArrowDownCircle className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => openEditProduct(p)} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors cursor-pointer" title="Editar">
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => setDeletingProduct(p)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors cursor-pointer" title="Eliminar">
                                                        <Trash2 className="w-4 h-4" />
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

            {/* ── Product Modal ─────────────────────────────────────── */}
            {productModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={closeProductModal} />
                    <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h2 className="text-sm font-semibold text-gray-800">{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h2>
                            <button onClick={closeProductModal} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"><X className="w-4 h-4" /></button>
                        </div>
                        <form onSubmit={handleProductSubmit} className="p-6 space-y-4">
                            {productFormError && (<div className="bg-red-50 border border-red-100 text-red-600 text-xs rounded-lg px-3 py-2">{productFormError}</div>)}
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1.5">Nombre</label>
                                <input type="text" required value={productForm.name} onChange={(e) => setProductForm((d) => ({ ...d, name: e.target.value }))}
                                    className="w-full h-9 px-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/10 focus:border-primary/30 outline-none text-sm text-gray-700 transition-all" placeholder="Nombre del producto" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1.5">Descripción <span className="text-gray-300 font-normal">(opcional)</span></label>
                                <textarea value={productForm.description} onChange={(e) => setProductForm((d) => ({ ...d, description: e.target.value }))}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/10 focus:border-primary/30 outline-none text-sm text-gray-700 transition-all resize-none" placeholder="Descripción breve" rows={2} />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Unidad</label>
                                    <select required value={productForm.unit} onChange={(e) => setProductForm((d) => ({ ...d, unit: e.target.value }))}
                                        className="w-full h-9 px-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/10 focus:border-primary/30 outline-none text-sm text-gray-700 transition-all bg-white cursor-pointer">
                                        {UNIT_OPTIONS.map((u) => (<option key={u} value={u}>{u}</option>))}
                                    </select>
                                </div>
                                {!editingProduct && (
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1.5">Stock Inicial</label>
                                        <input type="number" required min="0" value={productForm.currentStock} onChange={(e) => setProductForm((d) => ({ ...d, currentStock: e.target.value }))}
                                            className="w-full h-9 px-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/10 focus:border-primary/30 outline-none text-sm text-gray-700 transition-all" placeholder="0" />
                                    </div>
                                )}
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Stock Mínimo</label>
                                    <input type="number" required min="0" value={productForm.minimumStock} onChange={(e) => setProductForm((d) => ({ ...d, minimumStock: e.target.value }))}
                                        className="w-full h-9 px-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/10 focus:border-primary/30 outline-none text-sm text-gray-700 transition-all" placeholder="0" />
                                </div>
                            </div>
                            {editingProduct && (
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-medium text-gray-600">Activo</label>
                                    <button type="button" role="switch" aria-checked={productForm.active} onClick={() => setProductForm((d) => ({ ...d, active: !d.active }))}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer ${productForm.active ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${productForm.active ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>
                            )}
                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button type="button" onClick={closeProductModal} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer">Cancelar</button>
                                <button type="submit" disabled={productSubmitting} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-medium shadow-sm hover:shadow-md transition-all disabled:opacity-50 cursor-pointer">
                                    {productSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                    {editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Stock Modal ──────────────────────────────────────── */}
            {stockModalOpen && stockProduct && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={closeStockModal} />
                    <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h2 className="text-sm font-semibold text-gray-800">{stockForm.type === 'IN' ? 'Entrada de Stock' : stockForm.type === 'OUT' ? 'Salida de Stock' : 'Ajuste de Stock'}</h2>
                            <button onClick={closeStockModal} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"><X className="w-4 h-4" /></button>
                        </div>
                        <form onSubmit={handleStockSubmit} className="p-6 space-y-4">
                            <div className="bg-gray-50 rounded-lg px-4 py-3">
                                <p className="text-xs text-gray-400">Producto</p>
                                <p className="text-sm font-medium text-gray-800">{stockProduct.name}</p>
                                <p className="text-xs text-gray-400 mt-1">Stock actual: <span className="font-semibold text-gray-600">{stockProduct.currentStock} {stockProduct.unit}</span></p>
                            </div>
                            {stockFormError && (<div className="bg-red-50 border border-red-100 text-red-600 text-xs rounded-lg px-3 py-2">{stockFormError}</div>)}
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1.5">Tipo de movimiento</label>
                                <select value={stockForm.type} onChange={(e) => setStockForm((d) => ({ ...d, type: e.target.value as StockFormData['type'] }))}
                                    className="w-full h-9 px-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/10 focus:border-primary/30 outline-none text-sm text-gray-700 transition-all bg-white cursor-pointer">
                                    <option value="IN">Entrada</option>
                                    <option value="OUT">Salida</option>
                                    <option value="ADJUSTMENT">Ajuste (fijar valor)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1.5">{stockForm.type === 'ADJUSTMENT' ? 'Nuevo stock' : 'Cantidad'}</label>
                                <input type="number" required min="1" value={stockForm.quantity} onChange={(e) => setStockForm((d) => ({ ...d, quantity: e.target.value }))}
                                    className="w-full h-9 px-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/10 focus:border-primary/30 outline-none text-sm text-gray-700 transition-all" placeholder="0" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1.5">Notas <span className="text-gray-300 font-normal">(opcional)</span></label>
                                <input type="text" value={stockForm.notes} onChange={(e) => setStockForm((d) => ({ ...d, notes: e.target.value }))}
                                    className="w-full h-9 px-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/10 focus:border-primary/30 outline-none text-sm text-gray-700 transition-all" placeholder="Motivo del movimiento" />
                            </div>
                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button type="button" onClick={closeStockModal} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer">Cancelar</button>
                                <button type="submit" disabled={stockSubmitting}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium shadow-sm hover:shadow-md transition-all disabled:opacity-50 cursor-pointer ${stockForm.type === 'IN' ? 'bg-emerald-500 hover:bg-emerald-600' : stockForm.type === 'OUT' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-primary hover:bg-primary/90'}`}>
                                    {stockSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                    {stockForm.type === 'IN' ? 'Registrar Entrada' : stockForm.type === 'OUT' ? 'Registrar Salida' : 'Aplicar Ajuste'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Delete Confirmation ──────────────────────────────── */}
            {deletingProduct && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setDeletingProduct(null)} />
                    <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="text-sm font-semibold text-gray-800">Eliminar Producto</h2>
                        <p className="text-sm text-gray-500">¿Estás seguro de que deseas eliminar <span className="font-medium text-gray-800">{deletingProduct.name}</span>? Se eliminará todo el historial de movimientos.</p>
                        <div className="flex items-center justify-end gap-2">
                            <button onClick={() => setDeletingProduct(null)} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer">Cancelar</button>
                            <button onClick={handleDelete} disabled={deleting} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium shadow-sm transition-all disabled:opacity-50 cursor-pointer">
                                {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
