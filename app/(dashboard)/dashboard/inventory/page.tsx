'use client';

import { useAuth } from '@/app/contexts/AuthContext';
import { INVENTORY_ROUTES } from '@/lib/config/routes';
import { InventoryProductRow, ProductFormData, StockFormData } from '@/lib/types/inventory.types';
import { useState, useEffect, useCallback } from 'react';
import {
    Loader2, Plus, Pencil, Trash2, X, Search, AlertTriangle,
    ArrowUpCircle, ArrowDownCircle, Check, Ban, Package, ClipboardList,
    Tags, Printer
} from 'lucide-react';
import Link from 'next/link';
import { createInventoryCategory, deleteInventoryCategory } from '@/app/actions/category.actions';

const EMPTY_PRODUCT: ProductFormData = { name: '', description: '', unit: 'piezas', currentStock: '0', minimumStock: '0', yieldPercent: '100', grossWeight: '0', unitPrice: '0', supplier: '', active: true, categoryId: '' };
const EMPTY_STOCK: StockFormData = { type: 'IN', quantity: '', notes: '' };
const UNIT_OPTIONS = ['piezas', 'kg', 'litros', 'gramos', 'ml', 'cajas', 'bolsas', 'latas'];

export default function InventoryPage() {
    const { user, isLoading: authLoading } = useAuth();

    const [products, setProducts] = useState<InventoryProductRow[]>([]);
    const [categories, setCategories] = useState<{ id: string, name: string }[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');

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

    // Category Management Modal
    const [categoryModalOpen, setCategoryModalOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isManagingCategory, setIsManagingCategory] = useState(false);
    const [categoryError, setCategoryError] = useState<string | null>(null);

    // Print Modal
    const [printModalOpen, setPrintModalOpen] = useState(false);
    const [printType, setPrintType] = useState<'LOW_STOCK' | 'CATEGORY'>('LOW_STOCK');
    const [printCategoryId, setPrintCategoryId] = useState('');

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

    const fetchCategories = useCallback(async () => {
        try {
            const res = await fetch('/api/inventory/categories', { credentials: 'include' });
            const json = await res.json();
            if (res.ok && json.success) setCategories(json.data);
        } catch { /* silent */ }
    }, []);

    useEffect(() => { fetchProducts(); fetchCategories(); }, [fetchProducts, fetchCategories]);

    // ── Computed ───────────────────────────────────────────────────────
    const filtered = products.filter((p) => {
        const q = searchQuery.toLowerCase();
        const matchesSearch = p.name.toLowerCase().includes(q) || (p.description ?? '').toLowerCase().includes(q) || p.unit.toLowerCase().includes(q);
        const matchesCategory = selectedCategory ? (p as any).categoryId === selectedCategory : true;
        return matchesSearch && matchesCategory;
    });
    const lowStockCount = products.filter((p) => p.active && p.currentStock <= p.minimumStock).length;
    const isLowStock = (p: InventoryProductRow) => p.active && p.currentStock <= p.minimumStock;

    // ── Product handlers ──────────────────────────────────────────────
    const openCreateProduct = () => { setEditingProduct(null); setProductForm(EMPTY_PRODUCT); setProductFormError(null); setProductModalOpen(true); };
    const openEditProduct = (p: InventoryProductRow) => {
        setEditingProduct(p);
        setProductForm({ 
            name: p.name, 
            description: p.description ?? '', 
            unit: p.unit, 
            currentStock: String(p.currentStock), 
            minimumStock: String(p.minimumStock), 
            yieldPercent: String(p.yieldPercent ?? 100),
            grossWeight: String(p.grossWeight ?? 0),
            unitPrice: String(p.unitPrice ?? 0),
            supplier: p.supplier ?? '',
            active: p.active,
            categoryId: (p as any).categoryId || ''
        });
        setProductFormError(null); setProductModalOpen(true);
    };
    const closeProductModal = () => { setProductModalOpen(false); setEditingProduct(null); setProductForm(EMPTY_PRODUCT); setProductFormError(null); };

    const handleProductSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setProductSubmitting(true); setProductFormError(null);
        try {
            const isEdit = !!editingProduct;
            const url = isEdit ? INVENTORY_ROUTES.UPDATE(editingProduct!.id) : INVENTORY_ROUTES.CREATE;
            const body: Record<string, unknown> = isEdit
                ? { name: productForm.name, description: productForm.description, unit: productForm.unit, minimumStock: parseInt(productForm.minimumStock), yieldPercent: parseFloat(productForm.yieldPercent), grossWeight: parseFloat(productForm.grossWeight), unitPrice: parseFloat(productForm.unitPrice), supplier: productForm.supplier, active: productForm.active, categoryId: productForm.categoryId || undefined }
                : { name: productForm.name, description: productForm.description, unit: productForm.unit, currentStock: parseInt(productForm.currentStock), minimumStock: parseInt(productForm.minimumStock), yieldPercent: parseFloat(productForm.yieldPercent), grossWeight: parseFloat(productForm.grossWeight), unitPrice: parseFloat(productForm.unitPrice), supplier: productForm.supplier, active: productForm.active, categoryId: productForm.categoryId || undefined };
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

    // ── Category Management ─────────────────────────────────────────
    const handleCreateCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsManagingCategory(true);
        setCategoryError(null);
        const res = await createInventoryCategory(newCategoryName);
        setIsManagingCategory(false);
        if (res.success) {
            setNewCategoryName('');
            fetchCategories();
        } else {
            setCategoryError(res.error || 'Error al crear');
            window.alert('Error al crear categoría: ' + (res.error || 'Desconocido'));
        }
    };

    const handleDeleteCategory = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar esta categoría?')) return;
        setIsManagingCategory(true);
        setCategoryError(null);
        const res = await deleteInventoryCategory(id);
        setIsManagingCategory(false);
        if (res.success) {
            fetchCategories();
        } else {
            setCategoryError(res.error || 'Error al eliminar');
        }
    };

    // ── Print Checklist Logic ─────────────────────────────────────────
    const handlePrintChecklist = () => {
        let itemsToPrint: InventoryProductRow[] = [];
        let titleSuffix = '';

        if (printType === 'LOW_STOCK') {
            itemsToPrint = products.filter(p => p.active && p.currentStock <= p.minimumStock);
            titleSuffix = '(BAJO STOCK)';
        } else {
            if (!printCategoryId) return;
            itemsToPrint = products.filter(p => p.active && (p as any).categoryId === printCategoryId);
            const cat = categories.find(c => c.id === printCategoryId);
            titleSuffix = `(CATEGORÍA: ${cat ? cat.name.toUpperCase() : ''})`;
        }

        const dateStr = new Date().toLocaleString('es-MX', { 
            year: 'numeric', month: '2-digit', day: '2-digit', 
            hour: '2-digit', minute: '2-digit' 
        });

        const rowsHtml = itemsToPrint.map(p => {
            const cat = categories.find(c => c.id === (p as any).categoryId);
            return `
                <tr>
                    <td class="checkbox-cell"><div class="box"></div></td>
                    <td>${p.name}</td>
                    <td>${cat ? cat.name : '—'}</td>
                    <td class="text-right">${p.currentStock} ${p.unit}</td>
                    <td class="fill-cell">..............................</td>
                </tr>
            `;
        }).join('');

        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Lista de Compras</title>
                <style>
                    @page { size: A4; margin: 20mm; }
                    body {
                        font-family: Arial, sans-serif;
                        color: #000;
                        margin: 0;
                        padding: 0;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 30px;
                        border-bottom: 2px solid #000;
                        padding-bottom: 15px;
                    }
                    .header h1 {
                        margin: 0;
                        font-size: 18px;
                        font-weight: bold;
                        text-transform: uppercase;
                    }
                    .header p {
                        margin: 5px 0 0 0;
                        font-size: 12px;
                        color: #444;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: 12px;
                    }
                    th, td {
                        border: 1px solid #000;
                        padding: 10px;
                        text-align: left;
                    }
                    th {
                        background-color: #f0f0f0;
                        font-weight: bold;
                        text-transform: uppercase;
                    }
                    .text-right {
                        text-align: right;
                    }
                    .checkbox-cell {
                        width: 40px;
                        text-align: center;
                    }
                    .box {
                        width: 16px;
                        height: 16px;
                        border: 1px solid #000;
                        margin: 0 auto;
                    }
                    .fill-cell {
                        width: 150px;
                        color: #999;
                        text-align: right;
                        vertical-align: bottom;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>TERRAZA HUETAMEÑA - REPORTE DE FALTANTES / LISTA DE COMPRAS</h1>
                    <p>Fecha de impresión: ${dateStr} &nbsp;&nbsp;&nbsp; ${titleSuffix}</p>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th class="checkbox-cell">[ ]</th>
                            <th>Insumo / Producto</th>
                            <th>Categoría / Proveedor</th>
                            <th class="text-right">Stock Actual</th>
                            <th class="text-right">Cantidad a Comprar</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml.length > 0 ? rowsHtml : '<tr><td colspan="5" style="text-align:center; padding:20px;">No hay insumos para imprimir.</td></tr>'}
                    </tbody>
                </table>
            </body>
            </html>
        `;

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.open();
            printWindow.document.write(printContent);
            printWindow.document.close();
            
            printWindow.onload = () => {
                printWindow.focus();
                printWindow.print();
            };
        }
        
        setPrintModalOpen(false);
    };

    if (authLoading) return (<div className="flex flex-1 items-center justify-center"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>);

    const isAdmin = user?.role?.name === 'ADMIN';

    return (
        <>
            <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-semibold text-gray-900">Inventario</h1>
                        <p className="text-sm text-gray-400">Gestión de productos y niveles de stock</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                        <button onClick={() => setPrintModalOpen(true)} className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-lg shadow-sm transition-all text-sm font-medium cursor-pointer">
                            <Printer className="w-4 h-4" /> Lista de Compras
                        </button>
                        {isAdmin && (
                            <button onClick={() => setCategoryModalOpen(true)} className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-lg shadow-sm transition-all text-sm font-medium cursor-pointer">
                                <Tags className="w-4 h-4" /> Categorías
                            </button>
                        )}
                        <Link href="/dashboard/inventory/kardex" className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 px-4 py-2.5 rounded-lg shadow-sm transition-all text-sm font-medium hidden sm:flex">
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

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                        <input type="text" placeholder="Buscar producto..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
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
                            <Package className="w-8 h-8 mb-2" />
                            <p className="text-sm">{searchQuery ? 'No se encontraron productos' : 'No hay productos registrados'}</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100">
                                        <th className="text-left py-3 px-5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Producto</th>
                                        <th className="text-left py-3 px-5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Categoría</th>
                                        <th className="text-right py-3 px-5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Stock Actual</th>
                                        <th className="text-right py-3 px-5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">Rend. / P. Neto</th>
                                        <th className="text-right py-3 px-5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">Precio</th>
                                        <th className="text-left py-3 px-5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider hidden lg:table-cell">Unidad</th>
                                        <th className="text-left py-3 px-5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Estado</th>
                                        <th className="text-right py-3 px-5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filtered.map((p) => {
                                        const cat = categories.find(c => c.id === (p as any).categoryId);
                                        return (
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
                                            <td className="px-5 py-3.5 text-gray-500">{cat ? cat.name : '—'}</td>
                                            <td className="px-5 py-3.5 text-right">
                                                <span className={`font-semibold ${isLowStock(p) ? 'text-red-600' : 'text-gray-800'}`}>{p.currentStock}</span>
                                            </td>
                                            <td className="px-5 py-3.5 text-right hidden md:table-cell">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-gray-700">{p.yieldPercent}%</span>
                                                    <span className="text-xs text-gray-400">Neto: ${(parseFloat(p.unitPrice) / (p.yieldPercent / 100 || 1)).toFixed(2)}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 text-right text-gray-600 font-medium hidden md:table-cell">${parseFloat(p.unitPrice).toFixed(2)}</td>
                                            <td className="px-5 py-3.5 text-gray-500 hidden lg:table-cell">{p.unit}</td>
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
                                    )})}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Category Management Modal ─────────────────────────────────────── */}
            {categoryModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setCategoryModalOpen(false)} />
                    <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h2 className="text-sm font-semibold text-gray-800">Gestionar Categorías / Proveedores</h2>
                            <button onClick={() => setCategoryModalOpen(false)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"><X className="w-4 h-4" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            {categoryError && (<div className="bg-red-50 border border-red-100 text-red-600 text-xs rounded-lg px-3 py-2">{categoryError}</div>)}
                            
                            <form onSubmit={handleCreateCategory} className="flex gap-2">
                                <input type="text" required value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)}
                                    className="flex-1 h-9 px-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/10 focus:border-primary/30 outline-none text-sm text-gray-700 transition-all" placeholder="Nueva categoría..." />
                                <button type="submit" disabled={isManagingCategory || !newCategoryName.trim()} className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-medium shadow-sm transition-all disabled:opacity-50 cursor-pointer">
                                    Agregar
                                </button>
                            </form>

                            <div className="border border-gray-100 rounded-lg max-h-60 overflow-y-auto">
                                {categories.length === 0 ? (
                                    <div className="p-4 text-center text-sm text-gray-400">No hay categorías</div>
                                ) : (
                                    <ul className="divide-y divide-gray-50">
                                        {categories.map(c => (
                                            <li key={c.id} className="flex items-center justify-between px-4 py-2 hover:bg-gray-50 transition-colors">
                                                <span className="text-sm text-gray-700">{c.name}</span>
                                                <button onClick={() => handleDeleteCategory(c.id)} disabled={isManagingCategory} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors cursor-pointer" title="Eliminar">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Print Shopping List Modal ─────────────────────────────────────── */}
            {printModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setPrintModalOpen(false)} />
                    <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h2 className="text-sm font-semibold text-gray-800">Imprimir Lista de Compras</h2>
                            <button onClick={() => setPrintModalOpen(false)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"><X className="w-4 h-4" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1.5">Filtro de Impresión</label>
                                <select value={printType} onChange={(e) => setPrintType(e.target.value as 'LOW_STOCK' | 'CATEGORY')}
                                    className="w-full h-9 px-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/10 focus:border-primary/30 outline-none text-sm text-gray-700 transition-all bg-white cursor-pointer">
                                    <option value="LOW_STOCK">Insumos con Bajo Stock</option>
                                    <option value="CATEGORY">Por Categoría / Proveedor</option>
                                </select>
                            </div>

                            {printType === 'CATEGORY' && (
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Seleccionar Categoría</label>
                                    <select value={printCategoryId} onChange={(e) => setPrintCategoryId(e.target.value)}
                                        className="w-full h-9 px-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/10 focus:border-primary/30 outline-none text-sm text-gray-700 transition-all bg-white cursor-pointer">
                                        <option value="" disabled>Selecciona...</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                            )}

                            <div className="flex items-center justify-end gap-2 pt-4">
                                <button type="button" onClick={() => setPrintModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer">Cancelar</button>
                                <button type="button" onClick={handlePrintChecklist} disabled={printType === 'CATEGORY' && !printCategoryId}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-medium shadow-sm hover:shadow-md transition-all disabled:opacity-50 cursor-pointer">
                                    <Printer className="w-3.5 h-3.5" /> Imprimir A4
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Product Modal ─────────────────────────────────────── */}
            {productModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={closeProductModal} />
                    <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
                            <h2 className="text-sm font-semibold text-gray-800">{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h2>
                            <button type="button" onClick={closeProductModal} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"><X className="w-4 h-4" /></button>
                        </div>
                        <form onSubmit={handleProductSubmit} className="p-6 space-y-4">
                            {productFormError && (<div className="bg-red-50 border border-red-100 text-red-600 text-xs rounded-lg px-3 py-2">{productFormError}</div>)}
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1.5">Nombre</label>
                                <input type="text" required value={productForm.name} onChange={(e) => setProductForm((d) => ({ ...d, name: e.target.value }))}
                                    className="w-full h-9 px-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/10 focus:border-primary/30 outline-none text-sm text-gray-700 transition-all" placeholder="Nombre del producto" />
                            </div>
                            
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1.5">Categoría / Proveedor</label>
                                <select value={productForm.categoryId || ''} onChange={(e) => setProductForm((d) => ({ ...d, categoryId: e.target.value }))}
                                    className="w-full h-9 px-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/10 focus:border-primary/30 outline-none text-sm text-gray-700 transition-all bg-white cursor-pointer">
                                    <option value="">Sin categoría</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
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

                            {/* COSTING & FINANCIAL FIELDS */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1.5">% Rendimiento</label>
                                    <div className="relative">
                                        <input type="number" required min="1" max="100" value={productForm.yieldPercent} onChange={(e) => setProductForm((d) => ({ ...d, yieldPercent: e.target.value }))}
                                            className="w-full h-9 px-3 pr-8 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/10 focus:border-primary/30 outline-none text-sm text-gray-700 transition-all" placeholder="100" />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Precio Unidad (Bruto)</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                                        <input type="number" required min="0" step="0.01" value={productForm.unitPrice} onChange={(e) => setProductForm((d) => ({ ...d, unitPrice: e.target.value }))}
                                            className="w-full h-9 pl-7 px-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/10 focus:border-primary/30 outline-none text-sm text-gray-700 transition-all" placeholder="0.00" />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Peso Bruto (opcional)</label>
                                    <input type="number" min="0" step="0.01" value={productForm.grossWeight} onChange={(e) => setProductForm((d) => ({ ...d, grossWeight: e.target.value }))}
                                        className="w-full h-9 px-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/10 focus:border-primary/30 outline-none text-sm text-gray-700 transition-all" placeholder="0" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Proveedor</label>
                                    <input type="text" value={productForm.supplier} onChange={(e) => setProductForm((d) => ({ ...d, supplier: e.target.value }))}
                                        className="w-full h-9 px-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/10 focus:border-primary/30 outline-none text-sm text-gray-700 transition-all" placeholder="Nombre proveedor" />
                                </div>
                            </div>

                            {/* DYNAMIC CALCULATIONS PREVIEW */}
                            <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3 text-xs flex justify-between items-center text-blue-800">
                                <div>
                                    <span className="block font-medium">Peso Neto Estimado</span>
                                    <span className="text-lg font-semibold">{((parseFloat(productForm.grossWeight) || 0) * ((parseFloat(productForm.yieldPercent) || 100) / 100)).toFixed(2)}</span>
                                </div>
                                <div className="text-right">
                                    <span className="block font-medium">Precio Neto Estimado</span>
                                    <span className="text-lg font-semibold">${((parseFloat(productForm.unitPrice) || 0) / ((parseFloat(productForm.yieldPercent) || 100) / 100)).toFixed(2)}</span>
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
                            <button type="button" onClick={closeStockModal} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"><X className="w-4 h-4" /></button>
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
