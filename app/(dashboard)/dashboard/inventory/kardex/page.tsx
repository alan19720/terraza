'use client';

import { useAuth } from '@/app/contexts/AuthContext';
import { INVENTORY_ROUTES } from '@/lib/config/routes';
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Loader2, Search, ArrowUpCircle, ArrowDownCircle, SlidersHorizontal,
    ClipboardList, ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

type Movement = {
    id: string;
    type: 'IN' | 'OUT' | 'ADJUSTMENT';
    quantity: number;
    notes: string | null;
    createdAt: string;
    product: { id: string; name: string; unit: string; currentStock: number };
};

const TYPE_CONFIG = {
    IN: { label: 'Entrada', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', rowBg: 'bg-emerald-50/30' },
    OUT: { label: 'Salida', color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100', rowBg: 'bg-red-50/30' },
    ADJUSTMENT: { label: 'Ajuste', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', rowBg: 'bg-amber-50/30' },
};

const ITEMS_PER_PAGE = 20;

export default function KardexPage() {
    const { isLoading: authLoading } = useAuth();

    const [movements, setMovements] = useState<Movement[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<'ALL' | 'IN' | 'OUT' | 'ADJUSTMENT'>('ALL');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [page, setPage] = useState(1);

    const fetchMovements = useCallback(async () => {
        try {
            setError(null);
            const res = await fetch(INVENTORY_ROUTES.MOVEMENTS, { credentials: 'include' });
            const json = await res.json();
            if (res.ok && json.success) setMovements(json.data.movements);
            else setError(json.error || 'Failed to load movements');
        } catch { setError('Failed to load movements'); }
        finally { setIsLoading(false); }
    }, []);

    useEffect(() => { fetchMovements(); }, [fetchMovements]);

    // ── Filtering ─────────────────────────────────────────────────────
    const filtered = useMemo(() => {
        return movements.filter((m) => {
            const q = searchQuery.toLowerCase();
            const matchSearch = !q || m.product.name.toLowerCase().includes(q) || (m.notes ?? '').toLowerCase().includes(q);
            const matchType = typeFilter === 'ALL' || m.type === typeFilter;
            let matchDate = true;
            if (dateFrom) matchDate = matchDate && new Date(m.createdAt) >= new Date(dateFrom + 'T00:00:00');
            if (dateTo) matchDate = matchDate && new Date(m.createdAt) <= new Date(dateTo + 'T23:59:59');
            return matchSearch && matchType && matchDate;
        });
    }, [movements, searchQuery, typeFilter, dateFrom, dateTo]);

    // ── Summaries ─────────────────────────────────────────────────────
    const summaries = useMemo(() => {
        let totalIn = 0, totalOut = 0, totalAdj = 0;
        for (const m of filtered) {
            if (m.type === 'IN') totalIn += m.quantity;
            else if (m.type === 'OUT') totalOut += m.quantity;
            else totalAdj += m.quantity;
        }
        return { totalIn, totalOut, totalAdj, count: filtered.length };
    }, [filtered]);

    // ── Pagination ────────────────────────────────────────────────────
    const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
    const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    // Reset page on filter change
    useEffect(() => { setPage(1); }, [searchQuery, typeFilter, dateFrom, dateTo]);

    const formatDate = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
    };
    const formatTime = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    };

    if (authLoading) return (<div className="flex flex-1 items-center justify-center"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>);

    return (
        <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <Link href="/dashboard/inventory" className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                    <div>
                        <h1 className="text-lg font-semibold text-gray-900">Kardex de Movimientos</h1>
                        <p className="text-sm text-gray-400">Historial de entradas y salidas de inventario</p>
                    </div>
                </div>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 rounded-lg bg-gray-50"><ClipboardList className="w-4 h-4 text-gray-500" /></div>
                    </div>
                    <p className="text-2xl font-semibold text-gray-900">{summaries.count}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Movimientos</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 rounded-lg bg-emerald-50"><ArrowUpCircle className="w-4 h-4 text-emerald-600" /></div>
                    </div>
                    <p className="text-2xl font-semibold text-emerald-600">{summaries.totalIn.toLocaleString()}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Total Entradas</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 rounded-lg bg-red-50"><ArrowDownCircle className="w-4 h-4 text-red-500" /></div>
                    </div>
                    <p className="text-2xl font-semibold text-red-500">{summaries.totalOut.toLocaleString()}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Total Salidas</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 rounded-lg bg-amber-50"><SlidersHorizontal className="w-4 h-4 text-amber-600" /></div>
                    </div>
                    <p className="text-2xl font-semibold text-amber-600">{summaries.totalAdj.toLocaleString()}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Total Ajustes</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
                {/* Search */}
                <div className="relative max-w-sm w-full sm:w-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                    <input type="text" placeholder="Buscar producto..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-9 pl-9 pr-4 rounded-lg bg-white border border-gray-200 focus:ring-2 focus:ring-primary/10 focus:border-primary/20 transition-all outline-none text-sm text-gray-700 placeholder-gray-300" />
                </div>

                {/* Type filter tabs */}
                <div className="flex items-center gap-1.5">
                    {(['ALL', 'IN', 'OUT', 'ADJUSTMENT'] as const).map((t) => {
                        const isActive = typeFilter === t;
                        const label = t === 'ALL' ? 'Todos' : TYPE_CONFIG[t].label;
                        const cfg = t !== 'ALL' ? TYPE_CONFIG[t] : null;
                        return (
                            <button key={t} onClick={() => setTypeFilter(t)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${isActive
                                        ? cfg ? `${cfg.bg} ${cfg.color} border ${cfg.border}` : 'bg-primary text-white'
                                        : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
                                    }`}>
                                {label}
                            </button>
                        );
                    })}
                </div>

                {/* Date filters */}
                <div className="flex items-center gap-2 sm:ml-auto">
                    <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                        className="h-9 px-3 rounded-lg bg-white border border-gray-200 focus:ring-2 focus:ring-primary/10 focus:border-primary/20 outline-none text-sm text-gray-700 transition-all" />
                    <span className="text-xs text-gray-300">—</span>
                    <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                        className="h-9 px-3 rounded-lg bg-white border border-gray-200 focus:ring-2 focus:ring-primary/10 focus:border-primary/20 outline-none text-sm text-gray-700 transition-all" />
                    {(dateFrom || dateTo) && (
                        <button onClick={() => { setDateFrom(''); setDateTo(''); }} className="text-xs text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">Limpiar</button>
                    )}
                </div>
            </div>

            {error && (<div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg px-4 py-3">{error}</div>)}

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-300">
                        <ClipboardList className="w-8 h-8 mb-2" />
                        <p className="text-sm">{searchQuery || typeFilter !== 'ALL' || dateFrom || dateTo ? 'No se encontraron movimientos' : 'No hay movimientos registrados'}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="text-left py-3 px-5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Fecha</th>
                                    <th className="text-left py-3 px-5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Producto</th>
                                    <th className="text-left py-3 px-5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Tipo</th>
                                    <th className="text-right py-3 px-5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Cantidad</th>
                                    <th className="text-left py-3 px-5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">Notas</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {paginated.map((m) => {
                                    const cfg = TYPE_CONFIG[m.type];
                                    return (
                                        <tr key={m.id} className={`${cfg.rowBg} transition-colors`}>
                                            <td className="px-5 py-3.5">
                                                <div className="text-gray-800 text-xs font-medium">{formatDate(m.createdAt)}</div>
                                                <div className="text-gray-400 text-[11px]">{formatTime(m.createdAt)}</div>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className="font-medium text-gray-800">{m.product.name}</span>
                                                <span className="text-xs text-gray-400 ml-1.5">({m.product.unit})</span>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                                                    {m.type === 'IN' && <ArrowUpCircle className="w-3 h-3" />}
                                                    {m.type === 'OUT' && <ArrowDownCircle className="w-3 h-3" />}
                                                    {m.type === 'ADJUSTMENT' && <SlidersHorizontal className="w-3 h-3" />}
                                                    {cfg.label}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                <span className={`font-semibold ${cfg.color}`}>
                                                    {m.type === 'IN' ? '+' : m.type === 'OUT' ? '−' : '='}{m.quantity}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-gray-400 text-xs truncate max-w-[200px] hidden md:table-cell">
                                                {m.notes || '—'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
                        <p className="text-xs text-gray-400">
                            Mostrando {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} de {filtered.length}
                        </p>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors">
                                Anterior
                            </button>
                            <span className="px-3 py-1.5 text-xs font-medium text-gray-600">{page} / {totalPages}</span>
                            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors">
                                Siguiente
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
