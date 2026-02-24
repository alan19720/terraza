'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    UtensilsCrossed,
    ChefHat,
    Wallet,
    Package,
    BarChart3,
    Settings
} from 'lucide-react';

const menuItems = [
    { icon: LayoutDashboard, label: 'Panel', href: '/dashboard' },
    { icon: UtensilsCrossed, label: 'Mesas / Venta', href: '/dashboard/service' },
    { icon: ChefHat, label: 'Cocina', href: '/dashboard/kitchen' },
    { icon: Wallet, label: 'Caja', href: '/dashboard/cashier' },
    { icon: Package, label: 'Inventario', href: '/dashboard/inventory' },
    { icon: BarChart3, label: 'Reportes', href: '/dashboard/reports' },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="fixed left-0 top-0 h-screen w-[250px] bg-white border-r border-gray-100 flex flex-col z-50">
            {/* Logo */}
            <div className="px-5 pt-5 pb-3">
                <div className="relative w-full h-24">
                    <Image
                        src="/logos/logo2.png"
                        alt="Terraza Granados"
                        fill
                        className="object-contain"
                        priority
                    />
                </div>
            </div>

            <div className="px-5 mb-2">
                <div className="h-px bg-gray-100" />
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${isActive
                                    ? 'bg-primary text-white'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                        >
                            <item.icon className={`w-[18px] h-[18px] ${isActive ? 'text-secondary' : 'text-gray-400 group-hover:text-gray-600'}`} />
                            <span className="text-[13px] font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Settings */}
            <div className="px-3 pb-4">
                <div className="h-px bg-gray-100 mb-2" />
                <Link
                    href="/dashboard/settings"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all group"
                >
                    <Settings className="w-[18px] h-[18px]" />
                    <span className="text-[13px] font-medium">Ajustes</span>
                </Link>
            </div>
        </aside>
    );
}
