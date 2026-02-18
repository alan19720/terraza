'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { PAGE_ROUTES } from '@/lib/config/routes';

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login, isLoading: authLoading } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await login({ email, password });

            // Redirect to original destination or dashboard
            const redirect = searchParams.get('redirect') || PAGE_ROUTES.DASHBOARD;
            router.push(redirect);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    if (authLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="text-lg text-gray-600">Loading...</div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
            <div className="w-full max-w-md">
                {/* Login Card */}
                <div className="rounded-2xl bg-white p-8 shadow-xl">
                    {/* Header */}
                    <div className="mb-8 text-center">
                        <h1 className="text-3xl font-bold text-gray-900">POS Mariscos</h1>
                        <p className="mt-2 text-sm text-gray-600">Sign in to your account</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Email Input */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                placeholder="you@example.com"
                                disabled={isLoading}
                            />
                        </div>

                        {/* Password Input */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                placeholder="••••••••"
                                disabled={isLoading}
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {isLoading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="mt-6 text-center">
                        <p className="text-xs text-gray-500">
                            Secure login with JWT authentication
                        </p>
                    </div>
                </div>

                {/* Demo Credentials Info */}
                <div className="mt-4 rounded-lg bg-blue-50 border border-blue-200 p-4">
                    <p className="text-xs text-blue-800 font-medium mb-2">Demo Credentials:</p>
                    <p className="text-xs text-blue-600">
                        You'll need to create a user in the database first using Prisma Studio or migrations.
                    </p>
                </div>
            </div>
        </div>
    );
}
