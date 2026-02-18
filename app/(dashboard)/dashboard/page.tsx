'use client';

import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { PAGE_ROUTES } from '@/lib/config/routes';

export default function DashboardPage() {
    const { user, logout, isLoading } = useAuth();
    const router = useRouter();

    const handleLogout = () => {
        logout();
        router.push(PAGE_ROUTES.LOGIN);
    };

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-lg text-gray-600">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm">
                <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-gray-900">POS Mariscos Dashboard</h1>
                        <button
                            onClick={handleLogout}
                            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Welcome Card */}
                <div className="rounded-xl bg-white p-6 shadow-md mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        Welcome back, {user?.name}!
                    </h2>
                    <p className="text-gray-600">You are logged in as <span className="font-medium text-indigo-600">{user?.role.name}</span></p>
                </div>

                {/* User Info Card */}
                <div className="rounded-xl bg-white p-6 shadow-md">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Account Information</h3>
                    <dl className="space-y-3">
                        <div className="flex justify-between">
                            <dt className="text-sm font-medium text-gray-500">User ID:</dt>
                            <dd className="text-sm text-gray-900 font-mono">{user?.id}</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-sm font-medium text-gray-500">Email:</dt>
                            <dd className="text-sm text-gray-900">{user?.email}</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-sm font-medium text-gray-500">Role:</dt>
                            <dd className="text-sm">
                                <span className="inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-800">
                                    {user?.role.name}
                                </span>
                            </dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-sm font-medium text-gray-500">Status:</dt>
                            <dd className="text-sm">
                                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${user?.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                    {user?.active ? 'Active' : 'Inactive'}
                                </span>
                            </dd>
                        </div>
                    </dl>
                </div>

                {/* Info Box */}
                <div className="mt-6 rounded-lg bg-blue-50 border border-blue-200 p-4">
                    <p className="text-sm text-blue-800">
                        <span className="font-semibold">🎉 Authentication is working!</span> This is a protected route.
                        Your access token will automatically refresh every 50 minutes.
                    </p>
                </div>
            </main>
        </div>
    );
}
