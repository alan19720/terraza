'use client';

import { useState } from 'react';
import { Printer, X, CircleCheck, Loader2 } from 'lucide-react';
import type { CheckoutResult } from './CheckoutModal';

/* ────────────────────── Types ────────────────────── */
type Props = {
    open: boolean;
    result: CheckoutResult | null;
    onClose: () => void;
};

/* ────────────────────── Helpers ────────────────────── */
const IVA_RATE = 0.16;

function breakdown(total: number) {
    const subtotal = parseFloat((total / (1 + IVA_RATE)).toFixed(2));
    const iva = parseFloat((total - subtotal).toFixed(2));
    return { subtotal, iva };
}

const fmt = (n: number) =>
    n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 });

const PAYMENT_LABELS: Record<string, string> = {
    CASH: 'Efectivo',
    CARD: 'Tarjeta',
    TRANSFER: 'Transferencia',
};

/* ────────────────────── Receipt content ────────────────────── */
function ReceiptContent({ result }: { result: CheckoutResult }) {
    const { payment, order, orderSnapshot, paymentMethod } = result;
    const grossTotal = orderSnapshot.orderDetails.reduce(
        (sum, d) => sum + Number(d.unitPrice) * d.quantity,
        0
    );
    const discountAmount = grossTotal * ((payment.discountPercent || 0) / 100);
    const { subtotal, iva } = breakdown(payment.amount);
    const now = new Date();
    const dateStr = now.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

    return (
        <>
            {/* ── Header ── */}
            <div className="text-center border-b border-dashed border-black pb-3 mb-3">
                <p className="text-xs tracking-widest uppercase">Bienvenido a</p>
                <h1 className="text-lg font-black uppercase tracking-tight leading-tight">
                    Terraza Huetameña
                </h1>
                <p className="text-xs">Mariscos &amp; Especialidades</p>
                <p className="text-xs mt-1">
                    {dateStr} &nbsp;·&nbsp; {timeStr}
                </p>
                <p className="text-xs">
                    Mesa: <strong>{orderSnapshot.table.number}</strong>
                    &nbsp;|&nbsp; #{order.id.slice(0, 8).toUpperCase()}
                </p>
            </div>

            {/* ── Items ── */}
            <div className="border-b border-dashed border-black pb-3 mb-3">
                <p className="text-[10px] uppercase tracking-widest mb-2 text-center">
                    Detalle de consumo
                </p>
                <table className="w-full text-xs">
                    <thead>
                        <tr className="border-b border-solid border-black">
                            <th className="text-left py-1 font-semibold">Platillo</th>
                            <th className="text-center py-1 font-semibold w-8">Cant</th>
                            <th className="text-right py-1 font-semibold">P.U.</th>
                            <th className="text-right py-1 font-semibold">Importe</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orderSnapshot.orderDetails.map((d, i) => (
                            <tr key={i} className="border-b border-solid border-black">
                                <td className="py-1 pr-1 leading-tight">{d.meal.name}</td>
                                <td className="py-1 text-center">{d.quantity}</td>
                                <td className="py-1 text-right">{fmt(Number(d.unitPrice))}</td>
                                <td className="py-1 text-right font-medium">
                                    {fmt(Number(d.unitPrice) * d.quantity)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* ── Financial breakdown ── */}
            <div className="space-y-1 border-b border-dashed border-black pb-3 mb-3 text-xs">
                <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{fmt(grossTotal)}</span>
                </div>
                {(payment.discountPercent || 0) > 0 && (
                    <div className="flex justify-between font-semibold">
                        <span>Descuento aplicado (- {payment.discountPercent}%)</span>
                        <span>- {fmt(discountAmount)}</span>
                    </div>
                )}
                <div className="flex justify-between">
                    <span>Subtotal (sin IVA)</span>
                    <span>{fmt(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                    <span>IVA (16%)</span>
                    <span>{fmt(iva)}</span>
                </div>
                {payment.tipAmount > 0 && (
                    <div className="flex justify-between">
                        <span>Propina</span>
                        <span>+ {fmt(payment.tipAmount)}</span>
                    </div>
                )}
                <div className="flex justify-between font-black text-base pt-1 border-t-[2px] border-solid border-black">
                    <span>Total Final</span>
                    <span>{fmt(payment.totalCharged)}</span>
                </div>
            </div>

            {/* ── Payment method ── */}
            <div className="text-xs text-center border-b border-dashed border-black pb-3 mb-3">
                <span>Forma de pago: </span>
                <strong className="uppercase">{PAYMENT_LABELS[paymentMethod] ?? 'Efectivo'}</strong>
            </div>

            {/* ── Footer ── */}
            <div className="text-center text-[10px] space-y-1">
                <p>¡Gracias por su preferencia!</p>
                <p>Vuelva pronto 🦞</p>
                <p className="mt-1 text-[9px] tracking-wide uppercase">
                    Precios incluyen IVA · Este ticket no es CFDI
                </p>
            </div>
        </>
    );
}

/* ────────────────────── Main Modal ────────────────────── */
export default function ReceiptModal({ open, result, onClose }: Props) {
    const [isPrinting, setIsPrinting] = useState(false);

    if (!open || !result) return null;

    const handlePrint = () => {
        setIsPrinting(true);
        // Ensure browser paints the Tailwind @media print classes before triggering the spooler
        setTimeout(() => {
            window.print();
            
            // Clean up state roughly after print dialog is handled
            setTimeout(() => {
                setIsPrinting(false);
            }, 500);
        }, 500);
    };

    return (
        <div className={`fixed inset-0 z-[60] flex items-center justify-center p-4 ${isPrinting ? 'print:block print:absolute print:inset-0 print:p-0 print:m-0 print:bg-white print:overflow-visible' : 'print:hidden'}`}>
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm print:hidden"
                onClick={isPrinting ? undefined : onClose}
            />

            <div className={`relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[92vh] ${isPrinting ? 'print:block print:absolute print:top-0 print:left-0 print:w-[80mm] print:m-0 print:p-0 print:max-w-none print:max-h-none print:shadow-none print:rounded-none print:border-none print:overflow-visible' : ''}`}>
                
                {/* Header */}
                <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100 shrink-0 print:hidden">
                    <div className="flex items-center gap-3">
                        <span className={`p-2 rounded-xl ${result.payment.id === 'PRE-CUENTA' ? 'bg-amber-50' : 'bg-emerald-50'}`}>
                            <CircleCheck className={`w-5 h-5 ${result.payment.id === 'PRE-CUENTA' ? 'text-amber-600' : 'text-emerald-600'}`} />
                        </span>
                        <div>
                            <h2 className="text-sm font-semibold text-gray-900">
                                {result.payment.id === 'PRE-CUENTA' ? 'PRE-CUENTA (PAGO PENDIENTE)' : '¡Pago registrado!'}
                            </h2>
                            <p className="text-xs text-gray-400">Mesa {result.orderSnapshot.table.number}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isPrinting}
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer disabled:opacity-50"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Scrollable ticket preview */}
                <div className={`flex-1 overflow-y-auto px-4 py-4 ${isPrinting ? 'print:block print:p-0 print:overflow-visible' : ''}`}>
                    <div className={`border border-dashed border-gray-300 rounded-xl p-4 bg-gray-50 font-mono text-black ${isPrinting ? 'print:block print:border-none print:p-0 print:m-0 print:bg-white print:text-black print:overflow-visible' : ''}`}>
                        <ReceiptContent result={result} />
                    </div>
                </div>

                {/* Print button */}
                <div className="px-5 pb-5 pt-3 shrink-0 border-t border-gray-100 print:hidden">
                    <button
                        type="button"
                        onClick={handlePrint}
                        disabled={isPrinting}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-semibold transition-all shadow-sm hover:shadow-md cursor-pointer disabled:bg-primary/70"
                    >
                        {isPrinting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Abriendo visor...
                            </>
                        ) : (
                            <>
                                <Printer className="w-4 h-4" />
                                Imprimir Ticket
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
