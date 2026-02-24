'use client';

import { useAuth } from '@/app/contexts/AuthContext';
import { LogOut, Bell, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PAGE_ROUTES } from '@/lib/config/routes';

export default function DashboardHeader() {
    const { user, logout } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        await logout();
        router.push(PAGE_ROUTES.LOGIN);
    };

    return (
        <header className="h-14 bg-white sticky top-0 z-40 px-6 flex items-center justify-between border-b border-gray-100">
            <div className="flex items-center gap-3 flex-1 max-w-md">
                <div className="relative w-full group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Buscar..."
                        className="w-full h-9 pl-9 pr-4 rounded-lg bg-gray-50 border border-gray-100 focus:ring-2 focus:ring-primary/10 focus:border-primary/20 focus:bg-white transition-all outline-none text-sm text-gray-700 placeholder-gray-300"
                    />
                </div>
            </div>

            <div className="flex items-center gap-3">
                <button className="relative p-2 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
                    <Bell className="w-[18px] h-[18px]" />
                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-accent rounded-full"></span>
                </button>

                <div className="h-6 w-px bg-gray-100" />

                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center text-xs font-semibold">
                        {user?.name?.charAt(0)}
                    </div>
                    <div className="hidden sm:block">
                        <p className="text-sm font-medium text-gray-800 leading-tight">{user?.name}</p>
                        <p className="text-[10px] text-gray-400 leading-tight">{user?.role.name}</p>
                    </div>
                </div>

                <button
                    onClick={handleLogout}
                    className="p-2 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors cursor-pointer"
                    title="Cerrar Sesión"
                >
                    <LogOut className="w-[18px] h-[18px]" />
                </button>
            </div>
        </header>
    );
}
