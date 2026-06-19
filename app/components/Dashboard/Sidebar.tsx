'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import {
    LayoutDashboard,
    UtensilsCrossed,
    ChefHat,
    Wallet,
    Package,
    BookOpen,
    BarChart3,
    Users,
    Settings,
    ClipboardList,
    LayoutGrid,
    GlassWater,
    Tv,
    Warehouse
} from 'lucide-react';

import { useAuth } from '@/app/contexts/AuthContext';

const menuItems = [
    { icon: LayoutDashboard, label: 'Panel', href: '/dashboard', roles: ['ADMIN', 'MESERO'] },
    { icon: UtensilsCrossed, label: 'Mesas / Venta', href: '/dashboard/service', roles: ['ADMIN'] },
    { icon: ChefHat, label: 'Cocina', href: '/dashboard/kitchen', roles: ['ADMIN', 'COCINA'] },
    { icon: GlassWater, label: 'Barra', href: '/dashboard/bartender', roles: ['ADMIN', 'BARRA'] },
    { icon: Wallet, label: 'Caja', href: '/dashboard/cashier', roles: ['ADMIN'] },
    { icon: Package, label: 'Inventario', href: '/dashboard/inventory', roles: ['ADMIN'] },
    { icon: Tv, label: 'Inventario Inicial', href: '/dashboard/inventory/assets', roles: ['ADMIN'] },
    { icon: Warehouse, label: 'Banco', href: '/dashboard/inventory/warehouse', roles: ['ADMIN', 'COCINA'] },
    { icon: ClipboardList, label: 'Recetario', href: '/dashboard/recipes', roles: ['ADMIN', 'COCINA'] },
    { icon: BookOpen, label: 'Menú', href: '/dashboard/menu', roles: ['ADMIN', 'COCINA'] },
    { icon: LayoutGrid, label: 'Mesas', href: '/dashboard/tables', roles: ['ADMIN'] },
    { icon: BarChart3, label: 'Reportes', href: '/dashboard/reports', roles: ['ADMIN'] },
    { icon: Users, label: 'Usuarios', href: '/dashboard/users', roles: ['ADMIN'] },
];

type Props = {
    mobileOpen?: boolean;
    onMobileClose?: () => void;
};

export default function Sidebar({ mobileOpen, onMobileClose }: Props) {
    const pathname = usePathname();
    const { user } = useAuth();
    const userRole = user?.role?.name || '';
    
    const visibleMenuItems = menuItems.filter(item => 
        !item.roles || item.roles.includes(userRole)
    );

    const sidebarContent = (
        <>
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
                {visibleMenuItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onMobileClose}
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
            {userRole === 'ADMIN' && (
                <div className="px-3 pb-4">
                    <div className="h-px bg-gray-100 mb-2" />
                    <Link
                        href="/dashboard/settings"
                        onClick={onMobileClose}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all group"
                    >
                        <Settings className="w-[18px] h-[18px]" />
                        <span className="text-[13px] font-medium">Ajustes</span>
                    </Link>
                </div>
            )}
        </>
    );

    return (
        <>
            {/* Desktop sidebar — hidden on tablet and below */}
            <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-[250px] bg-white border-r border-gray-100 flex-col z-50">
                {sidebarContent}
            </aside>

            {/* Mobile/Tablet drawer overlay */}
            {mobileOpen && (
                <div className="lg:hidden fixed inset-0 z-50 flex">
                    <div className="absolute inset-0 bg-black/40" onClick={onMobileClose} />
                    <aside className="relative w-[280px] max-w-[80vw] bg-white flex flex-col h-full shadow-2xl animate-slide-in">
                        <button
                            type="button"
                            onClick={onMobileClose}
                            className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 cursor-pointer z-10"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        {sidebarContent}
                    </aside>
                </div>
            )}
        </>
    );
}
