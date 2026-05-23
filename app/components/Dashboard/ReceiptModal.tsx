'use client';

import { useRef } from 'react';
import { Printer, X, CircleCheck } from 'lucide-react';
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

/* ────────────────────── Iframe-based thermal print (blank-page fix) ────────────────────── */

/**
 * Renders the receipt HTML into a hidden iframe and prints it.
 * This is the proven approach for thermal printers — avoids the blank-page
 * bug caused by CSS `print:` variants not reliably hiding/showing DOM.
 */
function printReceiptViaIframe(containerRef: React.RefObject<HTMLDivElement | null>) {
    const html = containerRef.current?.innerHTML;
    if (!html) return;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.left = '-9999px';
    iframe.style.top = '-9999px';
    iframe.style.width = '0';
    iframe.style.height = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
    if (!doc) { document.body.removeChild(iframe); return; }

    doc.open();
    doc.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>Ticket</title>
<style>
  @page { size: 80mm auto; margin: 2mm 4mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Courier New', Courier, monospace;
    font-size: 10pt;
    line-height: 1.3;
    color: #000;
    background: #fff;
    width: 72mm;
    max-width: 72mm;
    margin: 0 auto;
    padding: 2mm 1mm;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: 1px 0; }
  .text-center { text-align: center; }
  .text-right { text-align: right; }
  .text-left { text-align: left; }
  .font-bold { font-weight: 700; }
  .font-black { font-weight: 900; }
  .font-semibold { font-weight: 600; }
  .font-medium { font-weight: 500; }
  .text-xs { font-size: 9pt; }
  .text-sm { font-size: 10pt; }
  .text-base { font-size: 11pt; }
  .text-lg { font-size: 13pt; }
  .text-tiny { font-size: 7pt; }
  .uppercase { text-transform: uppercase; }
  .tracking-widest { letter-spacing: 0.1em; }
  .tracking-wide { letter-spacing: 0.05em; }
  .tracking-tight { letter-spacing: -0.025em; }
  .leading-tight { line-height: 1.15; }
  .mt-1 { margin-top: 3px; }
  .mt-2 { margin-top: 6px; }
  .mb-2 { margin-bottom: 6px; }
  .mb-3 { margin-bottom: 8px; }
  .pb-3 { padding-bottom: 8px; }
  .pt-1 { padding-top: 3px; }
  .py-1 { padding-top: 2px; padding-bottom: 2px; }
  .pr-1 { padding-right: 3px; }
  .space-y-1 > * + * { margin-top: 3px; }
  .space-y-half > * + * { margin-top: 2px; }
  .border-b-dashed { border-bottom: 1px dashed #000; }
  .border-b-solid { border-bottom: 1px solid #000; }
  .border-b-thick { border-bottom: 2px solid #000; }
  .border-t-solid { border-top: 1px solid #000; }
  .border-t-thick { border-top: 2px solid #000; }
  .flex { display: flex; }
  .justify-between { justify-content: space-between; }
  .w-8 { width: 28px; }
</style>
</head>
<body>${html}</body>
</html>`);
    doc.close();

    iframe.onload = () => {
        setTimeout(() => {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            // Remove iframe after a brief delay so print dialog stays open
            setTimeout(() => document.body.removeChild(iframe), 1000);
        }, 250);
    };
}

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
            <div className="text-center border-b-dashed pb-3 mb-3">
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
            <div className="border-b-dashed pb-3 mb-3">
                <p className="text-tiny uppercase tracking-widest mb-2">
                    Detalle de consumo
                </p>
                <table>
                    <thead>
                        <tr className="border-b-solid">
                            <th className="text-left py-1 font-semibold text-xs">Platillo</th>
                            <th className="text-center py-1 font-semibold text-xs w-8">Cant</th>
                            <th className="text-right py-1 font-semibold text-xs">P.U.</th>
                            <th className="text-right py-1 font-semibold text-xs">Importe</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orderSnapshot.orderDetails.map((d, i) => (
                            <tr key={i} className="border-b-solid">
                                <td className="py-1 pr-1 leading-tight text-xs">{d.meal.name}</td>
                                <td className="py-1 text-center text-xs">{d.quantity}</td>
                                <td className="py-1 text-right text-xs">{fmt(Number(d.unitPrice))}</td>
                                <td className="py-1 text-right font-medium text-xs">
                                    {fmt(Number(d.unitPrice) * d.quantity)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* ── Financial breakdown ── */}
            <div className="space-y-1 border-b-dashed pb-3 mb-3 text-xs">
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
                <div className="flex justify-between font-black text-base pt-1 border-t-thick">
                    <span>Total Final</span>
                    <span>{fmt(payment.totalCharged)}</span>
                </div>
            </div>

            {/* ── Payment method ── */}
            <div className="text-xs text-center border-b-dashed pb-3 mb-3">
                <span>Forma de pago: </span>
                <strong>{PAYMENT_LABELS[paymentMethod] ?? 'Efectivo'}</strong>
            </div>

            {/* ── Footer ── */}
            <div className="text-center text-tiny space-y-half">
                <p>¡Gracias por su preferencia!</p>
                <p>Vuelva pronto 🦞</p>
                <p className="mt-1 text-tiny tracking-wide uppercase">
                    Precios incluyen IVA · Este ticket no es CFDI
                </p>
            </div>
        </>
    );
}

/* ────────────────────── Main Modal ────────────────────── */
export default function ReceiptModal({ open, result, onClose }: Props) {
    const receiptRef = useRef<HTMLDivElement>(null);

    if (!open || !result) return null;

    const handlePrint = () => printReceiptViaIframe(receiptRef);

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[92vh]">
                {/* Header */}
                <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100 shrink-0">
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
                        id="receipt-close-btn"
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Scrollable ticket preview */}
                <div className="flex-1 overflow-y-auto px-4 py-4">
                    <div
                        ref={receiptRef}
                        className="border border-dashed border-gray-300 rounded-xl p-4 bg-gray-50 font-mono text-black"
                    >
                        <ReceiptContent result={result} />
                    </div>
                </div>

                {/* Print button */}
                <div className="px-5 pb-5 pt-3 shrink-0 border-t border-gray-100">
                    <button
                        id="print-receipt-btn"
                        type="button"
                        onClick={handlePrint}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-semibold transition-all shadow-sm hover:shadow-md cursor-pointer"
                    >
                        <Printer className="w-4 h-4" />
                        Imprimir Ticket
                    </button>
                </div>
            </div>
        </div>
    );
}
