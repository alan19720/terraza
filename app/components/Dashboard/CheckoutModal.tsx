'use client';

import { useState } from 'react';
import {
    X,
    CreditCard,
    Banknote,
    Smartphone,
    Loader2,
    Receipt,
    Gift,
    ChevronRight,
} from 'lucide-react';
import { ORDER_ROUTES } from '@/lib/config/routes';

/* ────────────────────── Types ────────────────────── */

type OrderDetail = {
    quantity: number;
    unitPrice: string;
    isCourtesy?: boolean;
    meal: { name: string };
};

export type CheckoutOrder = {
    id: string;
    table: { number: string };
    user?: { name: string };
    orderDetails: OrderDetail[];
};

type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER';

export type CheckoutResult = {
    payment: { id: string; amount: number; discountPercent: number; tipAmount: number; totalCharged: number };
    order: { id: string; status: string };
    orderSnapshot: CheckoutOrder;
    paymentMethod: string;
};

type Props = {
    open: boolean;
    order: CheckoutOrder | null;
    onClose: () => void;
    onSuccess: (result: CheckoutResult) => void;
};

/* ────────────────────── Helpers ────────────────────── */

const IVA_RATE = 0.16;

/** Prices already contain IVA → extract subtotal & tax */
function computeBreakdown(total: number) {
    const subtotal = parseFloat((total / (1 + IVA_RATE)).toFixed(2));
    const iva = parseFloat((total - subtotal).toFixed(2));
    return { subtotal, iva };
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: typeof Banknote }[] = [
    { value: 'CASH', label: 'Efectivo', icon: Banknote },
    { value: 'CARD', label: 'Tarjeta', icon: CreditCard },
    { value: 'TRANSFER', label: 'Transferencia', icon: Smartphone },
];

const fmt = (n: number) =>
    n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 });

/* ────────────────────── Component ────────────────────── */

export default function CheckoutModal({ open, order, onClose, onSuccess }: Props) {
    const [tip, setTip] = useState('');
    const [discount, setDiscount] = useState('0');
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!open || !order) return null;

    const grossTotal = order.orderDetails.reduce(
        (sum, d) => sum + Number(d.unitPrice) * d.quantity,
        0
    );
    const tipAmount = parseFloat(tip) || 0;
    const discountPercent = parseFloat(discount) || 0;
    const discountAmount = grossTotal * (discountPercent / 100);
    const netFoodTotal = grossTotal - discountAmount;
    
    const totalCharged = parseFloat((netFoodTotal + tipAmount).toFixed(2));
    const { subtotal, iva } = computeBreakdown(netFoodTotal);

    const handleConfirm = async () => {
        if (tipAmount < 0) {
            setError('La propina no puede ser negativa');
            return;
        }
        setError(null);
        setLoading(true);
        try {
            const res = await fetch(ORDER_ROUTES.CHECKOUT(order.id), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ tipAmount, paymentMethod, discountPercent }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error ?? 'No se pudo procesar el pago');
                return;
            }
            // pass result + snapshot so ReceiptModal can render without re-fetching
            onSuccess({ ...data.data, orderSnapshot: order, paymentMethod });
        } catch {
            setError('Error de red. Intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (loading) return;
        setTip('');
        setDiscount('0');
        setPaymentMethod('CASH');
        setError(null);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Panel */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <span className="p-2 rounded-xl bg-emerald-50">
                            <Receipt className="w-5 h-5 text-emerald-600" />
                        </span>
                        <div>
                            <h2 className="text-base font-semibold text-gray-900">Cerrar Orden</h2>
                            <p className="text-xs text-gray-400">Mesa {order.table.number}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-5">
                    {/* Financial summary */}
                    <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
                        <div className="flex justify-between text-sm text-gray-500">
                            <span>Subtotal (consumo bruto)</span>
                            <span>{fmt(grossTotal)}</span>
                        </div>
                        {discountAmount > 0 && (
                            <div className="flex justify-between text-sm text-red-500">
                                <span>Descuento ({discountPercent}%)</span>
                                <span>- {fmt(discountAmount)}</span>
                            </div>
                        )}
                        {discountAmount > 0 && (
                            <div className="flex justify-between text-sm text-gray-500 border-t border-gray-200 pt-1">
                                <span>Consumo neto</span>
                                <span>{fmt(netFoodTotal)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-sm text-gray-500">
                            <span>Subtotal (sin IVA)</span>
                            <span>{fmt(subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-500">
                            <span>IVA (16%)</span>
                            <span>{fmt(iva)}</span>
                        </div>
                        <div className="border-t border-gray-200 pt-2.5 flex justify-between text-sm font-semibold text-gray-800">
                            <span>Total alimentos y bebidas</span>
                            <span>{fmt(netFoodTotal)}</span>
                        </div>
                        {tipAmount > 0 && (
                            <div className="flex justify-between text-sm text-emerald-600 font-medium">
                                <span className="flex items-center gap-1">
                                    <Gift className="w-3.5 h-3.5" />
                                    Propina
                                </span>
                                <span>+ {fmt(tipAmount)}</span>
                            </div>
                        )}
                        {tipAmount > 0 && (
                            <div className="border-t border-gray-200 pt-2.5 flex justify-between text-base font-bold text-gray-900">
                                <span>Total a cobrar</span>
                                <span>{fmt(totalCharged)}</span>
                            </div>
                        )}
                    </div>

                    {/* Discount Input */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="text-xs font-medium text-gray-500">Descuento (%)</label>
                            <div className="flex gap-1">
                                {[10, 15, 25].map(pct => (
                                    <button
                                        key={pct}
                                        type="button"
                                        onClick={() => setDiscount(pct.toString())}
                                        className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 cursor-pointer transition-colors"
                                    >
                                        {pct}%
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">%</span>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                placeholder="0"
                                value={discount}
                                onChange={(e) => setDiscount(e.target.value)}
                                className="w-full pl-7 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition-all"
                            />
                        </div>
                    </div>

                    {/* Tip input */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">
                            Propina (opcional)
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
                                $
                            </span>
                            <input
                                id="tip-input"
                                type="number"
                                min="0"
                                step="10"
                                placeholder="0.00"
                                value={tip}
                                onChange={(e) => setTip(e.target.value)}
                                className="w-full pl-7 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition-all"
                            />
                        </div>
                    </div>

                    {/* Payment method */}
                    <div>
                        <p className="text-xs font-medium text-gray-500 mb-2">Forma de pago</p>
                        <div className="grid grid-cols-3 gap-2">
                            {PAYMENT_METHODS.map(({ value, label, icon: Icon }) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => setPaymentMethod(value)}
                                    className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                                        paymentMethod === value
                                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm'
                                            : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                                    }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
                            {error}
                        </p>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 pb-6">
                    <button
                        id="checkout-confirm-btn"
                        type="button"
                        disabled={loading}
                        onClick={handleConfirm}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-semibold transition-all shadow-sm hover:shadow-md cursor-pointer"
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <>
                                Confirmar pago — {fmt(totalCharged)}
                                <ChevronRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
