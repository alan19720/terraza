'use client';

import { useAuth } from '@/app/contexts/AuthContext';
import { INVENTORY_ROUTES } from '@/lib/config/routes';
import { FixedAssetRow, AssetFormData } from '@/lib/types/inventory.types';
import { useState, useEffect, useCallback } from 'react';
import {
    Loader2, Plus, Pencil, Trash2, X, Search, DollarSign, Archive, Banknote
} from 'lucide-react';
import Link from 'next/link';

const EMPTY_ASSET: AssetFormData = { name: '', description: '', quantity: '1', unitCost: '0', purchaseDate: new Date().toISOString().split('T')[0] };

export default function AssetsPage() {
    const { isLoading: authLoading } = useAuth();

    const [assets, setAssets] = useState<FixedAssetRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Modal
    const [modalOpen, setModalOpen] = useState(false);
    const [editingAsset, setEditingAsset] = useState<FixedAssetRow | null>(null);
    const [form, setForm] = useState<AssetFormData>(EMPTY_ASSET);
    const [formError, setFormError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Delete
    const [deletingAsset, setDeletingAsset] = useState<FixedAssetRow | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchAssets = useCallback(async () => {
        try {
            setError(null);
            const res = await fetch(INVENTORY_ROUTES.ASSETS.LIST, { credentials: 'include' });
            const json = await res.json();
            if (res.ok && json.success) setAssets(json.data);
            else setError(json.error || 'Failed to load assets');
        } catch { setError('Failed to load assets'); }
        finally { setIsLoading(false); }
    }, []);

    useEffect(() => { fetchAssets(); }, [fetchAssets]);

    const filtered = assets.filter((a) => {
        const q = searchQuery.toLowerCase();
        return a.name.toLowerCase().includes(q) || (a.description ?? '').toLowerCase().includes(q);
    });

    const totalInvertido = assets.reduce((sum, a) => sum + parseFloat(a.totalValue), 0);

    const openCreate = () => { setEditingAsset(null); setForm(EMPTY_ASSET); setFormError(null); setModalOpen(true); };
    const openEdit = (a: FixedAssetRow) => {
        setEditingAsset(a);
        setForm({
            name: a.name,
            description: a.description ?? '',
            quantity: String(a.quantity),
            unitCost: String(a.unitCost),
            purchaseDate: new Date(a.purchaseDate).toISOString().split('T')[0]
        });
        setFormError(null); setModalOpen(true);
    };
    const closeModal = () => { setModalOpen(false); setEditingAsset(null); setForm(EMPTY_ASSET); setFormError(null); };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setIsSubmitting(true); setFormError(null);
        try {
            const isEdit = !!editingAsset;
            const url = isEdit ? INVENTORY_ROUTES.ASSETS.BY_ID(editingAsset!.id) : INVENTORY_ROUTES.ASSETS.CREATE;
            const body = {
                name: form.name,
                description: form.description,
                quantity: parseInt(form.quantity),
                unitCost: parseFloat(form.unitCost),
                purchaseDate: new Date(form.purchaseDate).toISOString()
            };
            const res = await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(body) });
            const json = await res.json();
            if (!res.ok) { setFormError(json.error || 'Something went wrong'); return; }
            closeModal(); fetchAssets();
        } catch { setFormError('Network error'); } finally { setIsSubmitting(false); }
    };

    const handleDelete = async () => {
        if (!deletingAsset) return; setIsDeleting(true);
        try {
            const res = await fetch(INVENTORY_ROUTES.ASSETS.BY_ID(deletingAsset.id), { method: 'DELETE', credentials: 'include' });
            if (res.ok) { setDeletingAsset(null); fetchAssets(); }
        } catch { /* silent */ } finally { setIsDeleting(false); }
    };

    if (authLoading) return (<div className="flex flex-1 items-center justify-center"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>);

    return (
        <>
            <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-semibold text-gray-900">Inventario Inicial (Activos)</h1>
                        <p className="text-sm text-gray-400">Gestión de mobiliario y activos fijos</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={openCreate} className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all text-sm font-medium cursor-pointer">
                            <Plus className="w-4 h-4" /> Agregar Activo
                        </button>
                    </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                            <DollarSign className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Invertido</p>
                            <p className="text-2xl font-bold text-gray-900">${totalInvertido.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <Archive className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Activos</p>
                            <p className="text-2xl font-bold text-gray-900">{assets.length}</p>
                        </div>
                    </div>
                </div>

                {/* Search */}
                <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                    <input type="text" placeholder="Buscar activo..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-9 pl-9 pr-4 rounded-lg bg-white border border-gray-200 focus:ring-2 focus:ring-primary/10 focus:border-primary/20 transition-all outline-none text-sm text-gray-700 placeholder-gray-300" />
                </div>

                {error && (<div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg px-4 py-3">{error}</div>)}

                {/* Table */}
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-300">
                            <Archive className="w-8 h-8 mb-2" />
                            <p className="text-sm">{searchQuery ? 'No se encontraron activos' : 'No hay activos registrados'}</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50/50">
                                        <th className="text-left py-3 px-5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Activo</th>
                                        <th className="text-right py-3 px-5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Cantidad</th>
                                        <th className="text-right py-3 px-5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Costo Unitario</th>
                                        <th className="text-right py-3 px-5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Valor Total</th>
                                        <th className="text-right py-3 px-5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filtered.map((a) => (
                                        <tr key={a.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold shrink-0 bg-primary/10 text-primary">
                                                        {a.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <span className="font-medium text-gray-800 truncate block">{a.name}</span>
                                                        {a.description && <span className="text-xs text-gray-500 truncate block">{a.description}</span>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 text-right font-medium text-gray-700">{a.quantity}</td>
                                            <td className="px-5 py-3.5 text-right text-gray-600">${parseFloat(a.unitCost).toFixed(2)}</td>
                                            <td className="px-5 py-3.5 text-right font-semibold text-gray-800">${parseFloat(a.totalValue).toFixed(2)}</td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => openEdit(a)} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors cursor-pointer" title="Editar">
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => setDeletingAsset(a)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors cursor-pointer" title="Eliminar">
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

            {/* ── Modal ─────────────────────────────────────── */}
            {modalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={closeModal} />
                    <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h2 className="text-sm font-semibold text-gray-800">{editingAsset ? 'Editar Activo' : 'Nuevo Activo'}</h2>
                            <button onClick={closeModal} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"><X className="w-4 h-4" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {formError && (<div className="bg-red-50 border border-red-100 text-red-600 text-xs rounded-lg px-3 py-2">{formError}</div>)}
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1.5">Nombre</label>
                                <input type="text" required value={form.name} onChange={(e) => setForm((d) => ({ ...d, name: e.target.value }))}
                                    className="w-full h-9 px-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/10 focus:border-primary/30 outline-none text-sm text-gray-700 transition-all" placeholder="Ej. Mesa de centro" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1.5">Descripción <span className="text-gray-300 font-normal">(opcional)</span></label>
                                <textarea value={form.description} onChange={(e) => setForm((d) => ({ ...d, description: e.target.value }))}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/10 focus:border-primary/30 outline-none text-sm text-gray-700 transition-all resize-none" placeholder="Detalles del activo" rows={2} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Cantidad</label>
                                    <input type="number" required min="1" value={form.quantity} onChange={(e) => setForm((d) => ({ ...d, quantity: e.target.value }))}
                                        className="w-full h-9 px-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/10 focus:border-primary/30 outline-none text-sm text-gray-700 transition-all" placeholder="1" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Costo Unitario</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                                        <input type="number" required min="0" step="0.01" value={form.unitCost} onChange={(e) => setForm((d) => ({ ...d, unitCost: e.target.value }))}
                                            className="w-full h-9 pl-7 px-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/10 focus:border-primary/30 outline-none text-sm text-gray-700 transition-all" placeholder="0.00" />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1.5">Fecha de Compra</label>
                                <input type="date" required value={form.purchaseDate} onChange={(e) => setForm((d) => ({ ...d, purchaseDate: e.target.value }))}
                                    className="w-full h-9 px-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/10 focus:border-primary/30 outline-none text-sm text-gray-700 transition-all bg-white" />
                            </div>

                            <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3 text-xs flex justify-between items-center text-blue-800">
                                <span className="block font-medium">Valor Total Estimado</span>
                                <span className="text-lg font-semibold">${((parseFloat(form.quantity) || 0) * (parseFloat(form.unitCost) || 0)).toFixed(2)}</span>
                            </div>
                            
                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button type="button" onClick={closeModal} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer">Cancelar</button>
                                <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-medium shadow-sm hover:shadow-md transition-all disabled:opacity-50 cursor-pointer">
                                    {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                    {editingAsset ? 'Guardar Cambios' : 'Registrar Activo'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Delete Confirmation ──────────────────────────────── */}
            {deletingAsset && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setDeletingAsset(null)} />
                    <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="text-sm font-semibold text-gray-800">Eliminar Activo</h2>
                        <p className="text-sm text-gray-500">¿Estás seguro de que deseas eliminar <span className="font-medium text-gray-800">{deletingAsset.name}</span>?</p>
                        <div className="flex items-center justify-end gap-2">
                            <button onClick={() => setDeletingAsset(null)} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer">Cancelar</button>
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
