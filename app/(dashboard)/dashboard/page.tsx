'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import NewOrderModal from '@/app/components/Dashboard/NewOrderModal';
import OrderDetailModal from '@/app/components/Dashboard/OrderDetailModal';
import AddItemsToOrderModal from '@/app/components/Dashboard/AddItemsToOrderModal';
import TablesPanel from '@/app/components/Dashboard/TablesPanel';
import { ORDER_ROUTES } from '@/lib/config/routes';
import { OrderStatus } from '@/app/generated/prisma/enums';
import {
    PlusCircle,
    Utensils,
    AlertCircle,
    TrendingUp,
    Users,
    Loader2,
    RefreshCw,
    Clock,
    CircleCheck,
    CircleX,
} from 'lucide-react';

type OrderRow = {
    id: string;
    status: string;
    total: string;
    createdAt: string;
    table: { number: string };
    user: { id: string; name: string };
    orderDetails: {
        id: string;
        quantity: number;
        unitPrice: string;
        kitchenStatus: string;
        kitchenNotes: string | null;
        meal: { name: string };
    }[];
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
    [OrderStatus.OPEN]: { label: 'Abierta', color: 'text-blue-600', bg: 'bg-blue-50', icon: Clock },
    [OrderStatus.CLOSED]: { label: 'Cerrada', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CircleCheck },
    [OrderStatus.CANCELED]: { label: 'Cancelada', color: 'text-red-500', bg: 'bg-red-50', icon: CircleX },
};

export default function DashboardPage() {
    const { user, isLoading } = useAuth();
    const [newOrderOpen, setNewOrderOpen] = useState(false);
    const [orders, setOrders] = useState<OrderRow[]>([]);
    const [ordersLoading, setOrdersLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<OrderRow | null>(null);
    const [addItemsForOrderId, setAddItemsForOrderId] = useState<string | null>(null);
    const [tablesRefreshKey, setTablesRefreshKey] = useState(0);

    const isAdmin = user?.role?.name === 'ADMIN';

    const bumpTablesRefresh = useCallback(() => {
        setTablesRefreshKey((k) => k + 1);
    }, []);

    const fetchOrders = useCallback(async () => {
        setOrdersLoading(true);
        try {
            const res = await fetch(ORDER_ROUTES.LIST, { credentials: 'include' });
            const data = await res.json();
            if (data.success) {
                const list = data.data.orders as OrderRow[];
                setOrders(list);
                setSelectedOrder((prev) =>
                    prev ? list.find((o) => o.id === prev.id) ?? null : null
                );
            }
        } catch {
            /* silently fail */
        } finally {
            setOrdersLoading(false);
        }
    }, []);

    const refreshOrdersKeepSelection = useCallback(async () => {
        try {
            const res = await fetch(ORDER_ROUTES.LIST, { credentials: 'include' });
            const data = await res.json();
            if (data.success) {
                const list = data.data.orders as OrderRow[];
                setOrders(list);
                setSelectedOrder((prev) =>
                    prev ? list.find((o) => o.id === prev.id) ?? null : null
                );
                bumpTablesRefresh();
            }
        } catch {
            /* silently fail */
        }
    }, [bumpTablesRefresh]);

    useEffect(() => {
        if (!isLoading && user) fetchOrders();
    }, [isLoading, user, fetchOrders]);

    if (isLoading) {
        return (
            <div className="flex flex-1 items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    const openOrders = orders.filter((o) => o.status === OrderStatus.OPEN);

    const stats = [
        { label: 'Ventas Hoy', value: `$${orders.reduce((s, o) => s + Number(o.total), 0).toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Órdenes Activas', value: String(openOrders.length), icon: Utensils, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Total Órdenes', value: String(orders.length), icon: Users, color: 'text-violet-600', bg: 'bg-violet-50' },
        { label: 'Canceladas', value: String(orders.filter((o) => o.status === OrderStatus.CANCELED).length), icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
    ];

    const formatTime = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    };

    const handleOrderCreated = () => {
        setNewOrderOpen(false);
        void fetchOrders().then(() => bumpTablesRefresh());
    };

    return (
        <>
            <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
                {/* Page title + action */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-semibold text-gray-900">
                            Bienvenido, {user?.name?.split(' ')[0]}
                        </h1>
                        <p className="text-sm text-gray-400">
                            {isAdmin ? 'Todas las órdenes del día' : 'Tus órdenes del día'}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setNewOrderOpen(true)}
                        className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all text-sm font-medium cursor-pointer"
                    >
                        <PlusCircle className="w-4 h-4" />
                        Nueva Orden
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map((stat, idx) => (
                        <div key={idx} className="bg-white rounded-xl p-4 border border-gray-100 hover:border-gray-200 transition-colors">
                            <div className="flex items-center justify-between mb-3">
                                <div className={`p-2 rounded-lg ${stat.bg}`}>
                                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                                </div>
                            </div>
                            <p className="text-2xl font-semibold text-gray-900 tracking-tight">{stat.value}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Tables */}
                {isAdmin && <TablesPanel refreshKey={tablesRefreshKey} />}

                {/* Orders table */}
                <div className="bg-white rounded-xl border border-gray-100">
                    <div className="px-5 py-4 flex items-center justify-between border-b border-gray-50">
                        <h2 className="text-sm font-semibold text-gray-800">
                            Órdenes de Hoy
                            {orders.length > 0 && (
                                <span className="ml-2 text-xs font-normal text-gray-400">({orders.length})</span>
                            )}
                        </h2>
                        <button
                            type="button"
                            onClick={() => {
                                void fetchOrders().then(() => bumpTablesRefresh());
                            }}
                            disabled={ordersLoading}
                            className="text-xs text-primary hover:text-primary/70 font-medium transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                            <RefreshCw className={`w-3 h-3 ${ordersLoading ? 'animate-spin' : ''}`} />
                            Actualizar
                        </button>
                    </div>

                    {ordersLoading && orders.length === 0 ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-6 h-6 text-gray-300 animate-spin" />
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-300">
                            <Utensils className="w-8 h-8 mb-2" />
                            <p className="text-sm">No hay órdenes hoy</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-50">
                                        <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Mesa</th>
                                        <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Platillos</th>
                                        {isAdmin && (
                                            <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Mesero</th>
                                        )}
                                        <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Estado</th>
                                        <th className="text-right px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Total</th>
                                        <th className="text-right px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Hora</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {orders.map((order) => {
                                        const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG[OrderStatus.OPEN];
                                        const StatusIcon = cfg.icon;
                                        const mealSummary = order.orderDetails
                                            .map((d) => `${d.quantity}× ${d.meal.name}`)
                                            .join(', ');
                                        return (
                                            <tr key={order.id} onClick={() => setSelectedOrder(order)} className="hover:bg-gray-50/50 transition-colors cursor-pointer">
                                                <td className="px-5 py-3">
                                                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary/5 text-primary font-semibold text-sm">
                                                        {order.table.number}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3 max-w-[280px]">
                                                    <p className="text-gray-700 truncate" title={mealSummary}>
                                                        {mealSummary}
                                                    </p>
                                                </td>
                                                {isAdmin && (
                                                    <td className="px-5 py-3 text-gray-600">{order.user.name}</td>
                                                )}
                                                <td className="px-5 py-3">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                                                        <StatusIcon className="w-3 h-3" />
                                                        {cfg.label}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3 text-right font-semibold text-gray-800">
                                                    ${Number(order.total).toLocaleString()}
                                                </td>
                                                <td className="px-5 py-3 text-right text-gray-400">
                                                    {formatTime(order.createdAt)}
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

            <NewOrderModal
                open={newOrderOpen}
                onClose={() => setNewOrderOpen(false)}
                onSuccess={handleOrderCreated}
            />

            <OrderDetailModal
                order={selectedOrder}
                onClose={() => {
                    setSelectedOrder(null);
                    setAddItemsForOrderId(null);
                }}
                canAddItems={
                    !!selectedOrder &&
                    selectedOrder.status === OrderStatus.OPEN &&
                    (isAdmin || selectedOrder.user.id === user?.id)
                }
                onAddItems={() => {
                    if (selectedOrder) setAddItemsForOrderId(selectedOrder.id);
                }}
                canManageOrder={
                    !!selectedOrder &&
                    selectedOrder.status === OrderStatus.OPEN &&
                    (isAdmin || selectedOrder.user.id === user?.id)
                }
                onOrderUpdated={refreshOrdersKeepSelection}
            />

            <AddItemsToOrderModal
                open={!!addItemsForOrderId}
                orderId={addItemsForOrderId ?? ''}
                tableNumber={selectedOrder?.table.number ?? ''}
                onClose={() => setAddItemsForOrderId(null)}
                onSuccess={() => {
                    setAddItemsForOrderId(null);
                    refreshOrdersKeepSelection();
                }}
            />
        </>
    );
}
