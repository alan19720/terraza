'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { PAGE_ROUTES } from '@/lib/config/routes';
import { Mail, Lock, Eye, EyeOff, LogIn, Loader2, AlertCircle } from 'lucide-react';
import Image from 'next/image';

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login, isLoading: authLoading } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await login({ email, password });
            const redirect = searchParams.get('redirect') || PAGE_ROUTES.DASHBOARD;
            router.push(redirect);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
        } finally {
            setIsLoading(false);
        }
    };

    if (authLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center login-bg">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-white animate-spin" />
                    <p className="text-white/60 text-sm tracking-widest uppercase">Cargando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen flex items-center justify-center px-4 py-12 login-bg overflow-hidden">
            {/* Decorative ambient blobs */}
            <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-[#F7B731]/15 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-15%] right-[-10%] w-[600px] h-[600px] bg-[#1a6fa0]/20 rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] bg-[#EB3B5A]/8 rounded-full blur-[100px] pointer-events-none" />

            {/* Card */}
            <div className="relative z-10 w-full max-w-[420px]">
                <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.3)] p-8 sm:p-10 border border-white/50">
                    {/* Brand Header */}
                    <div className="text-center mb-8">
                        <div className="relative w-72 h-44 mx-auto mb-1">
                            <Image
                                src="/logos/logo2.png"
                                alt="Terraza Granados"
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="mb-5 flex items-center gap-2.5 rounded-xl bg-accent/5 border border-accent/15 px-4 py-3 login-shake">
                            <AlertCircle className="w-4 h-4 text-accent shrink-0" />
                            <p className="text-sm text-accent">{error}</p>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-foreground/60 pl-0.5">
                                Correo electrónico
                            </label>
                            <div className="relative group">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-foreground/25 group-focus-within:text-primary/60 transition-colors" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full h-11 rounded-lg bg-foreground/3 border border-foreground/10 pl-10 pr-4 text-foreground placeholder-foreground/25 focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/30 focus:bg-white transition-all text-sm"
                                    placeholder="tu@correo.com"
                                    required
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-foreground/60 pl-0.5">
                                Contraseña
                            </label>
                            <div className="relative group">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-foreground/25 group-focus-within:text-primary/60 transition-colors" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full h-11 rounded-lg bg-foreground/3 border border-foreground/10 pl-10 pr-10 text-foreground placeholder-foreground/25 focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/30 focus:bg-white transition-all text-sm"
                                    placeholder="••••••••"
                                    required
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-foreground/25 hover:text-foreground/50 transition-colors cursor-pointer"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-11 rounded-lg bg-primary hover:bg-primary/90 active:bg-primary text-white font-medium text-sm shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-1 cursor-pointer"
                        >
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <LogIn className="w-4 h-4" />
                            )}
                            {isLoading ? 'Ingresando...' : 'Ingresar'}
                        </button>
                    </form>

                    <div className="mt-8 pt-5 border-t border-foreground/5 text-center">
                        <p className="text-foreground/25 text-[11px]">
                            Terraza Granados &copy; {new Date().getFullYear()} &middot; POS v1.0
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
