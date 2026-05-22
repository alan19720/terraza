'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, RefreshCw, Printer, DollarSign, CreditCard, Banknote, Coins, Receipt } from 'lucide-react';
import { CASHIER_ROUTES } from '@/lib/config/routes';

type CashierSummary = {
    totalBruto: number;
    totalVentas: number;
    totalPropinas: number;
    totalEfectivo: number;
    totalTarjeta: number;
    totalTransferencia: number;
    ordersCount: number;
};

type PaymentRow = {
    id: string;
    amount: number;
    tipAmount: number;
    totalCharged: number;
    paymentMethod: 'CASH' | 'CARD' | 'TRANSFER';
    order: {
        tableNumber: string;
        waiterName: string;
        createdAt: string;
        summary: string;
    };
};

const METHOD_CONFIG = {
    CASH: { label: 'Efectivo', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    CARD: { label: 'Tarjeta', color: 'text-blue-600', bg: 'bg-blue-50' },
    TRANSFER: { label: 'Transferencia', color: 'text-purple-600', bg: 'bg-purple-50' },
};

export default function CashierPage() {
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState<CashierSummary | null>(null);
    const [payments, setPayments] = useState<PaymentRow[]>([]);

    const fetchCashier = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(CASHIER_ROUTES.SUMMARY, { credentials: 'include' });
            const data = await res.json();
            if (data.success) {
                setSummary(data.data.summary);
                setPayments(data.data.payments);
            }
        } catch {
            // ignore
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCashier();
    }, [fetchCashier]);

    const formatCurrency = (val: number) => `$${val.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
    const formatTime = (iso: string) => new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

    const handlePrintZReport = () => {
        if (!summary) return;
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const dateStr = new Date().toLocaleDateString('es-MX', { 
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
        });
        const timeStr = new Date().toLocaleTimeString('es-MX');

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Corte de Caja</title>
                <style>
                    body { font-family: monospace; font-size: 14px; width: 300px; margin: 0 auto; color: #000; }
                    .center { text-align: center; }
                    .bold { font-weight: bold; }
                    .line { border-bottom: 1px dashed #000; margin: 10px 0; }
                    .row { display: flex; justify-content: space-between; margin: 4px 0; }
                    .title { font-size: 18px; margin-bottom: 5px; }
                    @media print {
                        body { width: 100%; margin: 0; }
                        @page { margin: 0; }
                    }
                </style>
            </head>
            <body>
                <div class="center">
                    <div class="bold title">TERRAZA HUETAMEÑA</div>
                    <div>CORTE DE CAJA (REPORTE Z)</div>
                    <div>${dateStr}</div>
                    <div>Hora de corte: ${timeStr}</div>
                </div>
                
                <div class="line"></div>
                
                <div class="bold center">RESUMEN GENERAL</div>
                <div class="row"><span>Órdenes Cerradas:</span><span>${summary.ordersCount}</span></div>
                <div class="row bold"><span>TOTAL BRUTO:</span><span>${formatCurrency(summary.totalBruto)}</span></div>
                <div class="row"><span>Total Ventas (Neto):</span><span>${formatCurrency(summary.totalVentas)}</span></div>
                <div class="row"><span>Total Propinas:</span><span>${formatCurrency(summary.totalPropinas)}</span></div>
                
                <div class="line"></div>
                
                <div class="bold center">DESGLOSE POR MÉTODO</div>
                <div class="row"><span>Efectivo en Caja:</span><span>${formatCurrency(summary.totalEfectivo)}</span></div>
                <div class="row"><span>Pagos con Tarjeta:</span><span>${formatCurrency(summary.totalTarjeta)}</span></div>
                <div class="row"><span>Transferencias:</span><span>${formatCurrency(summary.totalTransferencia)}</span></div>
                
                <div class="line"></div>
                
                <div class="center" style="margin-top: 20px;">
                    <div>_______________________</div>
                    <div>Firma del Cajero</div>
                </div>
                
                <script>
                    window.onload = function() { window.print(); window.close(); }
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
    };

    if (loading && !summary) {
        return (
            <div className="flex flex-1 items-center justify-center min-h-[500px]">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-4 lg:p-6 space-y-4 lg:space-y-6 max-w-[1400px] mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Corte de Caja</h1>
                    <p className="text-sm text-gray-500">Resumen financiero y cierre del día</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchCashier}
                        disabled={loading}
                        className="p-2.5 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                        title="Actualizar"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={handlePrintZReport}
                        disabled={!summary || summary.ordersCount === 0}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 text-white hover:bg-gray-800 transition-colors font-medium shadow-sm disabled:opacity-50"
                    >
                        <Printer className="w-4 h-4" />
                        Imprimir Reporte Z
                    </button>
                </div>
            </div>

            {summary && (
                <>
                    {/* Main Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-primary text-white rounded-2xl p-5 shadow-sm relative overflow-hidden">
                            <div className="absolute right-0 top-0 w-24 h-24 bg-white/10 rounded-bl-full -mr-4 -mt-4"></div>
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-white/10 rounded-lg"><DollarSign className="w-5 h-5 text-white" /></div>
                            </div>
                            <h3 className="text-white/80 text-sm font-medium">Total Bruto (Con Propinas)</h3>
                            <p className="text-3xl font-bold tracking-tight mt-1">{formatCurrency(summary.totalBruto)}</p>
                        </div>
                        
                        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-emerald-50 rounded-lg"><Banknote className="w-5 h-5 text-emerald-600" /></div>
                            </div>
                            <h3 className="text-gray-500 text-sm font-medium">Ventas Netas</h3>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(summary.totalVentas)}</p>
                        </div>

                        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-amber-50 rounded-lg"><Coins className="w-5 h-5 text-amber-600" /></div>
                            </div>
                            <h3 className="text-gray-500 text-sm font-medium">Propinas Acumuladas</h3>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(summary.totalPropinas)}</p>
                        </div>

                        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-blue-50 rounded-lg"><Receipt className="w-5 h-5 text-blue-600" /></div>
                            </div>
                            <h3 className="text-gray-500 text-sm font-medium">Órdenes Cerradas</h3>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{summary.ordersCount}</p>
                        </div>
                    </div>

                    {/* Breakdown by Payment Method */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                        <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-gray-400" />
                            Desglose por Método de Pago
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="p-4 rounded-xl border border-gray-50 bg-gray-50/50 flex flex-col items-center text-center">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Efectivo</p>
                                <p className="text-xl font-bold text-emerald-600">{formatCurrency(summary.totalEfectivo)}</p>
                            </div>
                            <div className="p-4 rounded-xl border border-gray-50 bg-gray-50/50 flex flex-col items-center text-center">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Tarjeta</p>
                                <p className="text-xl font-bold text-blue-600">{formatCurrency(summary.totalTarjeta)}</p>
                            </div>
                            <div className="p-4 rounded-xl border border-gray-50 bg-gray-50/50 flex flex-col items-center text-center">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Transferencia</p>
                                <p className="text-xl font-bold text-purple-600">{formatCurrency(summary.totalTransferencia)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Historical Feed */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-50 bg-gray-50/30">
                            <h3 className="text-sm font-semibold text-gray-800">Historial de Transacciones de Hoy</h3>
                        </div>
                        {payments.length === 0 ? (
                            <div className="py-12 text-center text-gray-400 text-sm">
                                No hay transacciones registradas hoy.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-xs text-gray-500 uppercase font-medium">
                                        <tr>
                                            <th className="px-5 py-3">Hora</th>
                                            <th className="px-5 py-3">Mesa</th>
                                            <th className="px-5 py-3">Mesero</th>
                                            <th className="px-5 py-3">Detalle</th>
                                            <th className="px-5 py-3">Método</th>
                                            <th className="px-5 py-3 text-right">Monto</th>
                                            <th className="px-5 py-3 text-right">Propina</th>
                                            <th className="px-5 py-3 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {payments.map((p) => {
                                            const method = METHOD_CONFIG[p.paymentMethod];
                                            return (
                                                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-5 py-3 text-gray-500 whitespace-nowrap">{formatTime(p.order.createdAt)}</td>
                                                    <td className="px-5 py-3 font-medium text-gray-900 whitespace-nowrap">Mesa {p.order.tableNumber}</td>
                                                    <td className="px-5 py-3 text-gray-600 whitespace-nowrap">{p.order.waiterName}</td>
                                                    <td className="px-5 py-3 text-gray-500 max-w-[200px] truncate" title={p.order.summary}>{p.order.summary}</td>
                                                    <td className="px-5 py-3 whitespace-nowrap">
                                                        <span className={`inline-flex px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${method.bg} ${method.color}`}>
                                                            {method.label}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-3 text-right font-medium text-gray-700 whitespace-nowrap">{formatCurrency(p.amount)}</td>
                                                    <td className="px-5 py-3 text-right text-gray-500 whitespace-nowrap">{formatCurrency(p.tipAmount)}</td>
                                                    <td className="px-5 py-3 text-right font-bold text-gray-900 whitespace-nowrap">{formatCurrency(p.totalCharged)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
