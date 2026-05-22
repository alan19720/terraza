'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ChefHat,
    Loader2,
    MessageSquare,
    RefreshCw,
    User,
    CircleDot,
    Flame,
    CheckCircle2,
    GlassWater,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { KitchenStatus } from '@prisma/client';
import { KITCHEN_ROUTES } from '@/lib/config/routes';

type KitchenLine = {
    id: string;
    quantity: number;
    kitchenStatus: string;
    kitchenNotes: string | null;
    meal: { name: string };
};

type KitchenOrder = {
    id: string;
    createdAt: string;
    table: { number: string };
    user: { name: string };
    orderDetails: KitchenLine[];
};

type ColumnKey =
    | typeof KitchenStatus.PENDING
    | typeof KitchenStatus.PREPARING
    | typeof KitchenStatus.READY;

const PIPE_RANK: Record<string, number> = {
    [KitchenStatus.PENDING]: 0,
    [KitchenStatus.PREPARING]: 1,
    [KitchenStatus.READY]: 2,
    [KitchenStatus.DELIVERED]: 3,
};

const STEPS: { value: string; label: string; short: string }[] = [
    { value: KitchenStatus.PENDING, label: 'Pendiente', short: 'Nuevo' },
    { value: KitchenStatus.PREPARING, label: 'Preparando', short: 'Prep' },
    { value: KitchenStatus.READY, label: 'Listo', short: 'Listo' },
    { value: KitchenStatus.DELIVERED, label: 'Entregado', short: 'Ok' },
];

const COLUMNS: {
    key: ColumnKey;
    label: string;
    sub: string;
    icon: LucideIcon;
    bar: string;
    headBg: string;
    accent: string;
}[] = [
    {
        key: KitchenStatus.PENDING,
        label: 'Pendiente',
        sub: 'Por comenzar',
        icon: CircleDot,
        bar: 'bg-gray-400',
        headBg: 'bg-gray-100',
        accent: 'text-gray-700',
    },
    {
        key: KitchenStatus.PREPARING,
        label: 'Preparando',
        sub: 'En cocina',
        icon: Flame,
        bar: 'bg-amber-400',
        headBg: 'bg-amber-50',
        accent: 'text-amber-800',
    },
    {
        key: KitchenStatus.READY,
        label: 'Listo',
        sub: 'Para servir',
        icon: CheckCircle2,
        bar: 'bg-emerald-400',
        headBg: 'bg-emerald-50',
        accent: 'text-emerald-800',
    },
];

function activeLines(order: KitchenOrder) {
    return order.orderDetails.filter((d) => d.kitchenStatus !== KitchenStatus.DELIVERED);
}

/** Columna donde va la orden: si todos los platillos activos comparten estado → esa; si hay mezcla → el paso menos avanzado. */
function orderColumn(order: KitchenOrder): ColumnKey {
    const active = activeLines(order);
    if (active.length === 0) return KitchenStatus.PENDING;

    const unique = [...new Set(active.map((d) => d.kitchenStatus))];
    if (unique.length === 1) {
        const only = unique[0];
        if (only === KitchenStatus.PENDING) return KitchenStatus.PENDING;
        if (only === KitchenStatus.PREPARING) return KitchenStatus.PREPARING;
        return KitchenStatus.READY;
    }

    const minRank = Math.min(...active.map((d) => PIPE_RANK[d.kitchenStatus] ?? 0));
    if (minRank <= 0) return KitchenStatus.PENDING;
    if (minRank === 1) return KitchenStatus.PREPARING;
    return KitchenStatus.READY;
}

function isHomogeneous(order: KitchenOrder): boolean {
    const active = activeLines(order);
    if (active.length === 0) return true;
    return new Set(active.map((d) => d.kitchenStatus)).size === 1;
}

function TicketTimer({ createdAt }: { createdAt: string }) {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        const calculate = () => {
            const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
            setElapsed(Math.max(0, diff));
        };
        calculate();
        const interval = setInterval(calculate, 1000);
        return () => clearInterval(interval);
    }, [createdAt]);

    const m = Math.floor(elapsed / 60);
    const s = elapsed % 60;
    const isLate = elapsed > 15 * 60; // 15 minutes
    
    return (
        <div className={`text-[10px] sm:text-xs font-mono font-bold tracking-wider px-2 py-0.5 rounded-md border ${
            isLate 
                ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' 
                : 'bg-white/10 text-white border-white/20'
        }`}>
            {m.toString().padStart(2, '0')}:{s.toString().padStart(2, '0')}
        </div>
    );
}

export default function KitchenQueue({ viewType = 'kitchen' }: { viewType?: 'kitchen' | 'bartender' }) {
    const [orders, setOrders] = useState<KitchenOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const fetchQueue = useCallback(async (quiet = false) => {
        if (!quiet) setLoading(true);
        try {
            const res = await fetch(KITCHEN_ROUTES.ORDERS(viewType), { credentials: 'include' });
            const data = await res.json();
            if (data.success) setOrders(data.data.orders);
        } catch {
            /* ignore */
        } finally {
            if (!quiet) setLoading(false);
        }
    }, [viewType]);

    useEffect(() => {
        void fetchQueue(false);
        const interval = setInterval(() => {
            void fetchQueue(true);
        }, 3000);
        return () => clearInterval(interval);
    }, [fetchQueue]);

    const updateLine = async (orderId: string, lineId: string, kitchenStatus: string) => {
        setUpdatingId(lineId);
        try {
            const res = await fetch(KITCHEN_ROUTES.UPDATE_ITEM(lineId), {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ kitchenStatus }),
            });
            const data = await res.json();
            if (!res.ok) {
                alert(data.error ?? 'No se pudo actualizar');
                return;
            }
            const item = data.data.item;
            setOrders((prev) => {
                const next = prev.map((o) =>
                    o.id !== orderId
                        ? o
                        : {
                              ...o,
                              orderDetails: o.orderDetails.map((d) =>
                                  d.id === lineId ? { ...d, ...item, meal: d.meal } : d
                              ),
                          }
                );
                return next.filter((o) =>
                    o.orderDetails.some((d) => d.kitchenStatus !== KitchenStatus.DELIVERED)
                );
            });
        } catch {
            alert('Error de red');
        } finally {
            setUpdatingId(null);
        }
    };

    const formatTime = (iso: string) =>
        new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

    const byColumn = useMemo(() => {
        const map: Record<ColumnKey, KitchenOrder[]> = {
            [KitchenStatus.PENDING]: [],
            [KitchenStatus.PREPARING]: [],
            [KitchenStatus.READY]: [],
        };
        for (const o of orders) {
            map[orderColumn(o)].push(o);
        }
        for (const k of Object.keys(map) as ColumnKey[]) {
            map[k].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        }
        return map;
    }, [orders]);

    const pendingCount = orders.reduce(
        (n, o) => n + o.orderDetails.filter((d) => d.kitchenStatus !== KitchenStatus.DELIVERED).length,
        0
    );

    return (
        <div className="p-4 lg:p-6 space-y-4 max-w-[1400px] mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
                        {viewType === 'bartender' ? (
                            <GlassWater className="w-5 h-5 text-secondary" />
                        ) : (
                            <ChefHat className="w-5 h-5 text-secondary" />
                        )}
                    </div>
                    <div>
                        <h1 className="text-lg font-semibold text-gray-900">
                            {viewType === 'bartender' ? 'Barra' : 'Cocina'}
                        </h1>
                        <p className="text-sm text-gray-400">
                            {orders.length} orden{orders.length !== 1 ? 'es' : ''} · {pendingCount} {viewType === 'bartender' ? 'trago' : 'platillo'}{pendingCount !== 1 ? 's' : ''} por salir
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => void fetchQueue(false)}
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-primary hover:bg-gray-50 cursor-pointer disabled:opacity-50 shrink-0"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Actualizar
                </button>
            </div>

            {loading && orders.length === 0 ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
            ) : orders.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center text-gray-400 text-sm">
                    No hay órdenes abiertas hoy. Cuando llegue una orden, aparecerá aquí.
                </div>
            ) : (
                <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:pb-0 md:snap-none">
                    {COLUMNS.map((col) => {
                        const list = byColumn[col.key];
                        const Icon = col.icon;
                        return (
                            <section
                                key={col.key}
                                className="min-w-[min(100%,320px)] w-full snap-center shrink-0 md:min-w-0 flex flex-col rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden"
                            >
                                <header
                                    className={`${col.headBg} px-3 py-3 border-b border-gray-100/80 flex items-start justify-between gap-2`}
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span
                                            className={`w-1 self-stretch min-h-10 rounded-full shrink-0 ${col.bar}`}
                                        />
                                        <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${col.accent}`} />
                                        <div className="min-w-0">
                                            <p className={`text-sm font-semibold ${col.accent}`}>{col.label}</p>
                                            <p className="text-[11px] text-gray-500 leading-tight">{col.sub}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold tabular-nums bg-white/80 text-gray-600 px-2 py-1 rounded-lg border border-gray-100">
                                        {list.length}
                                    </span>
                                </header>

                                <div className="flex-1 p-2.5 space-y-3 max-h-[calc(100vh-220px)] overflow-y-auto min-h-[120px]">
                                    {list.length === 0 ? (
                                        <p className="text-center text-xs text-gray-300 py-8 px-2">
                                            Sin órdenes aquí
                                        </p>
                                    ) : (
                                        list.map((order) => (
                                            <article
                                                key={order.id}
                                                className="rounded-xl border border-gray-100 bg-gray-50/80 overflow-hidden text-left"
                                            >
                                                <div className="flex flex-wrap items-center gap-2 justify-between px-3 py-2.5 bg-primary text-white">
                                                    <div className="flex items-center gap-3">
                                                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-primary text-sm font-bold">
                                                            {order.table.number}
                                                        </span>
                                                        <div className="flex flex-col items-start gap-1">
                                                            <p className="font-semibold text-sm leading-tight">
                                                                Mesa {order.table.number}
                                                            </p>
                                                            <TicketTimer createdAt={order.createdAt} />
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1">
                                                        <div className="flex items-center gap-1 text-[10px] text-white/80">
                                                            <User className="w-3 h-3 text-secondary" />
                                                            {order.user.name}
                                                        </div>
                                                        {!isHomogeneous(order) && (
                                                            <span className="text-[9px] uppercase tracking-wide font-semibold text-secondary/90 bg-primary px-1.5 py-0.5 rounded">
                                                                Varios estados
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <ul className="divide-y divide-gray-100 bg-white">
                                                    {order.orderDetails.map((line) => {
                                                        const busy = updatingId === line.id;
                                                        return (
                                                            <li key={line.id} className="p-3">
                                                                <div className="flex items-start justify-between gap-2 mb-2">
                                                                    <div className="min-w-0">
                                                                        <p className="font-semibold text-gray-900 text-sm leading-snug">
                                                                            <span className="text-secondary mr-1">
                                                                                {line.quantity}×
                                                                            </span>
                                                                            {line.meal.name}
                                                                        </p>
                                                                        {line.kitchenNotes && (
                                                                            <p className="mt-0.5 flex items-start gap-1.5 text-sm font-semibold italic text-orange-600">
                                                                                <MessageSquare className="w-4 h-4 shrink-0 mt-0.5" />
                                                                                {line.kitchenNotes}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                    {busy && (
                                                                        <Loader2 className="w-4 h-4 shrink-0 text-primary animate-spin" />
                                                                    )}
                                                                </div>

                                                                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                                                                    {STEPS.map((step) => {
                                                                        const active =
                                                                            line.kitchenStatus === step.value;
                                                                        return (
                                                                            <button
                                                                                key={step.value}
                                                                                type="button"
                                                                                disabled={busy}
                                                                                onClick={() =>
                                                                                    updateLine(
                                                                                        order.id,
                                                                                        line.id,
                                                                                        step.value
                                                                                    )
                                                                                }
                                                                                className={`rounded-lg py-2 px-0.5 text-center text-[10px] sm:text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 ${
                                                                                    active
                                                                                        ? 'bg-primary text-white ring-2 ring-secondary ring-offset-1'
                                                                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 active:scale-[0.98]'
                                                                                }`}
                                                                            >
                                                                                <span className="sm:hidden">
                                                                                    {step.short}
                                                                                </span>
                                                                                <span className="hidden sm:inline">
                                                                                    {step.label}
                                                                                </span>
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            </article>
                                        ))
                                    )}
                                </div>
                            </section>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
