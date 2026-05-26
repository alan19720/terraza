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
        <div className="min-h-screen bg-gray-50/80 print:bg-white print:overflow-visible">
            <div className="print:hidden">
                <Sidebar
                    mobileOpen={sidebarOpen}
                    onMobileClose={() => setSidebarOpen(false)}
                />
            </div>

            <div className="lg:pl-[250px] flex flex-col min-h-screen print:pl-0 print:block print:overflow-visible">
                <div className="print:hidden">
                    <DashboardHeader onMenuToggle={() => setSidebarOpen(true)} />
                </div>
                <main className="flex-1 print:overflow-visible">
                    {children}
                </main>
            </div>
        </div>
    );
}
