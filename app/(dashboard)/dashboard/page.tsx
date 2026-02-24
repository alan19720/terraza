'use client';

import { useAuth } from '@/app/contexts/AuthContext';
import Sidebar from '@/app/components/Dashboard/Sidebar';
import DashboardHeader from '@/app/components/Dashboard/Header';
import {
    PlusCircle,
    Utensils,
    AlertCircle,
    TrendingUp,
    Users,
    Receipt,
    Banknote,
    CreditCard,
    ArrowUpRight,
    Loader2,
} from 'lucide-react';

export default function DashboardPage() {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    const stats = [
        { label: 'Ventas Hoy', value: '$8,450', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', change: '+12%' },
        { label: 'Órdenes Activas', value: '12', icon: Utensils, color: 'text-blue-600', bg: 'bg-blue-50', change: '3 nuevas' },
        { label: 'Clientes Hoy', value: '48', icon: Users, color: 'text-violet-600', bg: 'bg-violet-50', change: '+8%' },
        { label: 'Stock Bajo', value: '4', icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50', change: 'Revisar' },
    ];

    const tables = [
        { num: 1, occupied: false },
        { num: 2, occupied: true, amount: '$840' },
        { num: 3, occupied: false },
        { num: 4, occupied: true, amount: '$1,240' },
        { num: 5, occupied: false },
        { num: 6, occupied: true, amount: '$560' },
        { num: 7, occupied: false },
        { num: 8, occupied: false },
    ];

    const payments = [
        { id: '#1024', total: '$450.00', method: 'Efectivo', time: '14:20', icon: Banknote },
        { id: '#1023', total: '$890.00', method: 'Tarjeta', time: '13:45', icon: CreditCard },
        { id: '#1022', total: '$210.00', method: 'Tarjeta', time: '13:10', icon: CreditCard },
        { id: '#1021', total: '$1,150.00', method: 'Efectivo', time: '12:55', icon: Banknote },
    ];

    return (
        <div className="min-h-screen bg-gray-50/80 flex">
            <Sidebar />

            <main className="flex-1 pl-[250px]">
                <DashboardHeader />

                <div className="p-6 space-y-6">
                    {/* Page title + action */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-lg font-semibold text-gray-900">
                                Bienvenido, {user?.name?.split(' ')[0]}
                            </h1>
                            <p className="text-sm text-gray-400">
                                Resumen del día
                            </p>
                        </div>
                        <button className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all text-sm font-medium cursor-pointer">
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
                                    <span className={`text-[11px] font-medium ${stat.color}`}>{stat.change}</span>
                                </div>
                                <p className="text-2xl font-semibold text-gray-900 tracking-tight">{stat.value}</p>
                                <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Content grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        {/* Tables */}
                        <div className="lg:col-span-3">
                            <div className="bg-white rounded-xl border border-gray-100">
                                <div className="px-5 py-4 flex items-center justify-between border-b border-gray-50">
                                    <h2 className="text-sm font-semibold text-gray-800">Estado de Mesas</h2>
                                    <button className="text-xs text-primary hover:text-primary/70 font-medium transition-colors flex items-center gap-1 cursor-pointer">
                                        Ver todas <ArrowUpRight className="w-3 h-3" />
                                    </button>
                                </div>
                                <div className="p-5">
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        {tables.map((table) => (
                                            <div
                                                key={table.num}
                                                className={`relative p-4 rounded-lg text-center transition-all cursor-pointer border ${
                                                    table.occupied
                                                        ? 'bg-primary border-primary text-white'
                                                        : 'bg-gray-50 border-gray-100 hover:border-gray-200 text-gray-600'
                                                }`}
                                            >
                                                <p className={`text-[10px] uppercase font-medium mb-0.5 ${table.occupied ? 'text-white/60' : 'text-gray-400'}`}>
                                                    Mesa
                                                </p>
                                                <p className="text-xl font-semibold">{table.num}</p>
                                                <p className={`text-[11px] font-medium mt-1 ${
                                                    table.occupied ? 'text-secondary' : 'text-emerald-500'
                                                }`}>
                                                    {table.occupied ? table.amount : 'Libre'}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent payments */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-xl border border-gray-100">
                                <div className="px-5 py-4 flex items-center justify-between border-b border-gray-50">
                                    <h2 className="text-sm font-semibold text-gray-800">Caja Hoy</h2>
                                    <button className="text-xs text-primary hover:text-primary/70 font-medium transition-colors flex items-center gap-1 cursor-pointer">
                                        Ver todo <ArrowUpRight className="w-3 h-3" />
                                    </button>
                                </div>
                                <div className="divide-y divide-gray-50">
                                    {payments.map((payment, i) => (
                                        <div key={i} className="px-5 py-3.5 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="p-1.5 bg-gray-50 rounded-lg text-gray-400">
                                                    <payment.icon className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-800">{payment.id}</p>
                                                    <p className="text-[11px] text-gray-400">{payment.method} &middot; {payment.time}</p>
                                                </div>
                                            </div>
                                            <p className="text-sm font-semibold text-gray-800">{payment.total}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="px-5 py-3 border-t border-gray-50">
                                    <button className="w-full py-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-500 text-xs font-medium transition-colors cursor-pointer">
                                        Ver historial completo
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
