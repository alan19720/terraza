'use client';

import DashboardHeader from '@/app/components/Dashboard/Header';
import Sidebar from '@/app/components/Dashboard/Sidebar';
import { useState } from 'react';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50/80">
            <Sidebar
                mobileOpen={sidebarOpen}
                onMobileClose={() => setSidebarOpen(false)}
            />

            <div className="lg:pl-[250px] flex flex-col min-h-screen">
                <DashboardHeader onMenuToggle={() => setSidebarOpen(true)} />
                <main className="flex-1">
                    {children}
                </main>
            </div>
        </div>
    );
}
