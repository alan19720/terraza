'use client';

import { useState } from 'react';
import {
    X,
    Clock,
    CircleCheck,
    CircleX,
    User,
    Hash,
    ChefHat,
    MessageSquare,
    PlusCircle,
    Loader2,
    Receipt,
} from 'lucide-react';
import { OrderStatus, KitchenStatus } from '@/app/generated/prisma/enums';
import { ORDER_ROUTES } from '@/lib/config/routes';
import CheckoutModal, { type CheckoutResult } from './CheckoutModal';
import ReceiptModal from './ReceiptModal';

type OrderDetail = {
    id?: string;
    quantity: number;
    unitPrice: string;
    kitchenStatus: string;
    kitchenNotes: string | null;
    meal: { name: string };
};

type Order = {
    id: string;
    status: string;
    total: string;
    createdAt: string;
    table: { number: string };
    user: { name: string; id?: string };
    orderDetails: OrderDetail[];
};

type Props = {
    order: Order | null;
    onClose: () => void;
    canAddItems?: boolean;
    onAddItems?: () => void;
    /** Admin u dueño: cerrar / cancelar orden abierta */
    canManageOrder?: boolean;
    onOrderUpdated?: () => void;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
    [OrderStatus.OPEN]: { label: 'Abierta', color: 'text-blue-600', bg: 'bg-blue-50', icon: Clock },
    [OrderStatus.CLOSED]: { label: 'Cerrada', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CircleCheck },
    [OrderStatus.CANCELED]: { label: 'Cancelada', color: 'text-red-500', bg: 'bg-red-50', icon: CircleX },
};

const KITCHEN_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
    [KitchenStatus.PENDING]: { label: 'Pendiente', color: 'text-gray-600', bg: 'bg-gray-100', dot: 'bg-gray-400' },
    [KitchenStatus.PREPARING]: { label: 'Preparando', color: 'text-amber-600', bg: 'bg-amber-50', dot: 'bg-amber-400' },
    [KitchenStatus.READY]: { label: 'Listo', color: 'text-emerald-600', bg: 'bg-emerald-50', dot: 'bg-emerald-400' },
    [KitchenStatus.DELIVERED]: { label: 'Entregado', color: 'text-blue-600', bg: 'bg-blue-50', dot: 'bg-blue-400' },
};

export default function OrderDetailModal({
    order,
    onClose,
    canAddItems,
    onAddItems,
    canManageOrder,
    onOrderUpdated,
}: Props) {
    const [actionLoading, setActionLoading] = useState<'cancel' | null>(null);
    const [checkoutOpen, setCheckoutOpen] = useState(false);
    const [receiptResult, setReceiptResult] = useState<CheckoutResult | null>(null);
    const [receiptOpen, setReceiptOpen] = useState(false);

    if (!order) return null;

    /* ── Cancel (direct, no payment) ── */
    const cancelOrder = async () => {
        const ok = window.confirm(
            '¿Cancelar esta orden? La mesa quedará libre. Esta acción no borra el historial del día.'
        );
        if (!ok) return;
        setActionLoading('cancel');
        try {
            const res = await fetch(ORDER_ROUTES.UPDATE_STATUS(order.id), {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ status: OrderStatus.CANCELED }),
            });
            const data = await res.json();
            if (!res.ok) {
                alert(data.error ?? 'No se pudo cancelar');
                return;
            }
            onOrderUpdated?.();
            onClose();
        } catch {
            alert('Error de red');
        } finally {
            setActionLoading(null);
        }
    };

    /* ── After CheckoutModal confirms payment ── */
    const handleCheckoutSuccess = (result: CheckoutResult) => {
        setCheckoutOpen(false);
        setReceiptResult(result);
        setReceiptOpen(true);
        onOrderUpdated?.(); // refresh orders list in background
    };

    /* ── After receipt is closed ── */
    const handleReceiptClose = () => {
        setReceiptOpen(false);
        setReceiptResult(null);
        onClose(); // close the OrderDetailModal too
    };

    const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG[OrderStatus.OPEN];
    const StatusIcon = cfg.icon;

    const formatTime = (iso: string) =>
        new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

    const formatDate = (iso: string) =>
        new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });

    return (
        <>
            <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
                <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-white font-bold text-lg">
                                {order.table.number}
                            </span>
                            <div>
                                <h2 className="text-base font-semibold text-gray-900">Mesa {order.table.number}</h2>
                                <p className="text-xs text-gray-400">{formatDate(order.createdAt)} · {formatTime(order.createdAt)}</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Info */}
                    <div className="px-6 py-3 flex items-center gap-4 border-b border-gray-50 shrink-0">
                        <div className="flex items-center gap-1.5 text-gray-500">
                            <User className="w-3.5 h-3.5" />
                            <span className="text-xs">{order.user.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-500">
                            <Hash className="w-3.5 h-3.5" />
                            <span className="text-xs font-mono">{order.id.slice(0, 8)}</span>
                        </div>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${cfg.bg} ${cfg.color} ml-auto`}>
                            <StatusIcon className="w-3 h-3" />
                            {cfg.label}
                        </span>
                    </div>

                    {/* Items */}
                    <div className="flex-1 overflow-y-auto px-6 py-4">
                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
                            Platillos ({order.orderDetails.length})
                        </p>
                        <div className="space-y-3">
                            {order.orderDetails.map((detail, i) => {
                                const subtotal = Number(detail.unitPrice) * detail.quantity;
                                const kitchen = KITCHEN_CONFIG[detail.kitchenStatus] ?? KITCHEN_CONFIG[KitchenStatus.PENDING];
                                return (
                                    <div key={detail.id ?? i} className="rounded-lg border border-gray-100 p-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <span className="text-xs font-semibold text-primary bg-primary/5 rounded-md w-7 h-7 flex items-center justify-center shrink-0">
                                                    {detail.quantity}
                                                </span>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-gray-800 truncate">{detail.meal.name}</p>
                                                    <p className="text-xs text-gray-400">${Number(detail.unitPrice).toFixed(0)} c/u</p>
                                                </div>
                                            </div>
                                            <span className="text-sm font-semibold text-gray-700 shrink-0 ml-3">
                                                ${subtotal.toFixed(0)}
                                            </span>
                                        </div>
                                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium ${kitchen.bg} ${kitchen.color}`}>
                                                <ChefHat className="w-3 h-3" />
                                                {kitchen.label}
                                            </span>
                                            {detail.kitchenNotes && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] bg-yellow-50 text-yellow-700 max-w-full">
                                                    <MessageSquare className="w-3 h-3 shrink-0" />
                                                    <span className="truncate">{detail.kitchenNotes}</span>
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Total + actions */}
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 shrink-0 space-y-3">
                        {canAddItems && order.status === OrderStatus.OPEN && onAddItems && (
                            <button
                                type="button"
                                onClick={onAddItems}
                                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-primary/20 bg-primary text-white text-sm font-medium hover:bg-primary/90 cursor-pointer transition-colors"
                            >
                                <PlusCircle className="w-4 h-4 text-secondary" />
                                Agregar platillos
                            </button>
                        )}

                        {canManageOrder && order.status === OrderStatus.OPEN && (
                            <div className="grid grid-cols-2 gap-2">
                                {/* ── Checkout button (replaces old "Cerrar orden") ── */}
                                <button
                                    id="open-checkout-btn"
                                    type="button"
                                    onClick={() => setCheckoutOpen(true)}
                                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 cursor-pointer transition-colors"
                                >
                                    <Receipt className="w-4 h-4" />
                                    Cobrar
                                </button>

                                <button
                                    type="button"
                                    disabled={!!actionLoading}
                                    onClick={cancelOrder}
                                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-200 bg-white text-red-600 text-sm font-medium hover:bg-red-50 cursor-pointer disabled:opacity-50 transition-colors"
                                >
                                    {actionLoading === 'cancel' ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <CircleX className="w-4 h-4" />
                                    )}
                                    Cancelar
                                </button>
                            </div>
                        )}

                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Total</span>
                            <span className="text-xl font-bold text-gray-900">${Number(order.total).toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Checkout (tip + payment method) ── */}
            <CheckoutModal
                open={checkoutOpen}
                order={order}
                onClose={() => setCheckoutOpen(false)}
                onSuccess={handleCheckoutSuccess}
            />

            {/* ── Thermal receipt preview ── */}
            <ReceiptModal
                open={receiptOpen}
                result={receiptResult}
                onClose={handleReceiptClose}
            />
        </>
    );
}
