'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2, RefreshCw, CircleDot, Settings2, Check, Waves } from 'lucide-react';
import { TableStatus, KitchenStatus } from '@/app/generated/prisma/enums';

type Table = {
    id: string;
    number: string;
    status: string;
};

type Props = {
    /** Súbelo desde el panel cuando cambien órdenes/mesas; vuelve a cargar mesas sin bloquear toda la tarjeta. */
    refreshKey?: number;
    openOrders?: any[];
    onTableClick?: (tableNumber: string) => void;
};

export default function TablesPanel({ refreshKey = 0, openOrders = [], onTableClick }: Props) {
    const [tables, setTables] = useState<Table[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);
    const [openMenu, setOpenMenu] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const fetchTables = useCallback(async (quiet = false) => {
        if (!quiet) setLoading(true);
        try {
            const res = await fetch('/api/tables', { credentials: 'include' });
            const data = await res.json();
            if (data.success) setTables(data.data.tables);
        } catch { /* silently fail */ }
        finally {
            if (!quiet) setLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchTables(false);
    }, [fetchTables]);

    useEffect(() => {
        if (refreshKey < 1) return;
        void fetchTables(true);
    }, [refreshKey, fetchTables]);

    useEffect(() => {
        if (!openMenu) return;
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpenMenu(null);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [openMenu]);

    const changeStatus = async (tableId: string, newStatus: string) => {
        setUpdating(tableId);
        setOpenMenu(null);
        try {
            const res = await fetch(`/api/tables/${tableId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ status: newStatus }),
            });
            const data = await res.json();
            if (data.success) {
                setTables((prev) => prev.map((t) => (t.id === tableId ? data.data.table : t)));
            }
        } catch { /* silently fail */ }
        finally { setUpdating(null); }
    };

    const available = tables.filter((t) => t.status === TableStatus.AVAILABLE).length;
    const occupied = tables.filter((t) => t.status === TableStatus.OCCUPIED).length;

    return (
        <div className="bg-white rounded-xl border border-gray-100">
            <div className="px-5 py-4 flex items-center justify-between border-b border-gray-50">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Waves className="w-4 h-4 text-secondary" />
                        <h2 className="text-sm font-semibold text-gray-800">Mesas</h2>
                    </div>
                    {tables.length > 0 && (
                        <div className="hidden sm:flex items-center gap-2 text-[11px] font-medium">
                            <span className="px-2 py-0.5 rounded-full bg-primary/5 text-primary">{available} libre{available !== 1 ? 's' : ''}</span>
                            <span className="px-2 py-0.5 rounded-full bg-secondary/10 text-secondary">{occupied} ocupada{occupied !== 1 ? 's' : ''}</span>
                        </div>
                    )}
                </div>
                <button
                    type="button"
                    onClick={() => void fetchTables(false)}
                    disabled={loading}
                    className="text-xs text-primary hover:text-primary/70 font-medium transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                    <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                    Actualizar
                </button>
            </div>

            {loading && tables.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 text-gray-300 animate-spin" />
                </div>
            ) : tables.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-300">
                    <CircleDot className="w-8 h-8 mb-2" />
                    <p className="text-sm">No hay mesas registradas</p>
                </div>
            ) : (
                <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                    {tables.map((table) => {
                        const isOccupied = table.status === TableStatus.OCCUPIED;
                        const isUpdating = updating === table.id;
                        const isOpen = openMenu === table.id;

                        return (
                            <div key={table.id} className="relative" ref={isOpen ? menuRef : undefined}>
                                <div 
                                    onClick={() => isOccupied && onTableClick?.(table.number)}
                                    className={`relative rounded-2xl p-4 transition-all ${
                                    isOccupied
                                        ? 'bg-primary text-white shadow-md cursor-pointer'
                                        : 'bg-gray-50 text-gray-800 border border-gray-100'
                                } ${isOpen ? (isOccupied ? 'ring-2 ring-secondary' : 'ring-2 ring-primary') : ''}`}>

                                    {/* Table number circle */}
                                    <div className="flex items-center justify-center mb-3">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
                                            isOccupied
                                                ? 'bg-secondary text-primary'
                                                : 'bg-white text-primary border-2 border-primary/10'
                                        }`}>
                                            {table.number}
                                        </div>
                                    </div>

                                    {/* Status label */}
                                    <div className="text-center">
                                        <p className={`text-[11px] font-semibold tracking-wide uppercase ${
                                            isOccupied ? 'text-secondary' : 'text-primary/50'
                                        }`}>
                                            {isOccupied ? 'Ocupada' : 'Disponible'}
                                        </p>
                                    </div>
                                    
                                    {/* Ready Item Notifications */}
                                    {isOccupied && (
                                        <div className="absolute -bottom-3 left-0 right-0 flex justify-center z-10">
                                            {(() => {
                                                const order = openOrders.find(o => String(o.table.number) === String(table.number));
                                                if (!order) return null;
                                                
                                                const readyItems = order.orderDetails.filter((d: any) => d.kitchenStatus === KitchenStatus.READY);
                                                if (readyItems.length === 0) return null;

                                                const hasDrinks = readyItems.some((d: any) => d.meal.category?.name === 'Bebidas');
                                                const hasFood = readyItems.some((d: any) => d.meal.category?.name !== 'Bebidas');

                                                if (hasDrinks && hasFood) {
                                                    return <span className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm animate-pulse">¡Pedido Listo!</span>;
                                                } else if (hasDrinks) {
                                                    return <span className="bg-cyan-500 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm animate-pulse">¡Trago Listo!</span>;
                                                } else if (hasFood) {
                                                    return <span className="bg-emerald-500 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm animate-pulse">¡Platillo Listo!</span>;
                                                }
                                                return null;
                                            })()}
                                        </div>
                                    )}

                                    {/* Settings button */}
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenMenu(isOpen ? null : table.id);
                                        }}
                                        disabled={isUpdating}
                                        className={`absolute top-2 right-2 p-1.5 rounded-lg transition-colors cursor-pointer ${
                                            isOccupied
                                                ? 'text-white/40 hover:text-white hover:bg-white/10'
                                                : 'text-gray-300 hover:text-gray-500 hover:bg-gray-100'
                                        }`}
                                    >
                                        {isUpdating ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                            <Settings2 className="w-3.5 h-3.5" />
                                        )}
                                    </button>
                                </div>

                                {/* Dropdown menu */}
                                {isOpen && (
                                    <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                                        <button
                                            type="button"
                                            onClick={() => changeStatus(table.id, TableStatus.AVAILABLE)}
                                            className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium transition-colors cursor-pointer ${
                                                !isOccupied
                                                    ? 'bg-primary/5 text-primary'
                                                    : 'text-gray-500 hover:bg-gray-50'
                                            }`}
                                        >
                                            <span className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-primary/30" />
                                                Disponible
                                            </span>
                                            {!isOccupied && <Check className="w-3.5 h-3.5 text-primary" />}
                                        </button>
                                        <div className="h-px bg-gray-50" />
                                        <button
                                            type="button"
                                            onClick={() => changeStatus(table.id, TableStatus.OCCUPIED)}
                                            className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium transition-colors cursor-pointer ${
                                                isOccupied
                                                    ? 'bg-secondary/10 text-secondary'
                                                    : 'text-gray-500 hover:bg-gray-50'
                                            }`}
                                        >
                                            <span className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-secondary" />
                                                Ocupada
                                            </span>
                                            {isOccupied && <Check className="w-3.5 h-3.5 text-secondary" />}
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
