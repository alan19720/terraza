'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthUser, LoginCredentials } from '@/lib/types/auth.types';
import { AUTH_ROUTES } from '@/lib/config/routes';

interface AuthContextType {
    user: AuthUser | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (credentials: LoginCredentials) => Promise<void>;
    logout: () => Promise<void>;
    refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    /**
     * Logout user and clear cookies
     */
    const logout = useCallback(async () => {
        setUser(null);
        try {
            await fetch(AUTH_ROUTES.LOGOUT, {
                method: 'POST',
                credentials: 'include',
            });
        } catch (error) {
            console.error('Logout error:', error);
        }
    }, []);

    /**
     * Refresh authentication tokens (stored in httpOnly cookies)
     */
    const refreshAuth = useCallback(async () => {
        try {
            const response = await fetch(AUTH_ROUTES.REFRESH, {
                method: 'POST',
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Token refresh failed');
            }
        } catch (error) {
            console.error('Token refresh error:', error);
            logout();
        }
    }, [logout]);

    /**
     * Login user with credentials
     */
    const login = async (credentials: LoginCredentials) => {
        try {
            const response = await fetch(AUTH_ROUTES.LOGIN, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(credentials),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Login failed');
            }

            if (result.success && result.data?.user) {
                setUser(result.data.user);
            }
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    };

    /**
     * Get current user from server (Source of Truth: Cookies)
     */
    const checkUserIdentity = useCallback(async () => {
        try {
            const response = await fetch(AUTH_ROUTES.ME, {
                method: 'GET',
                credentials: 'include',
            });

            const result = await response.json();

            if (response.ok && result.success) {
                setUser(result.data.user);
            } else {
                setUser(null);
            }
        } catch (err) {
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Initialization on mount
     */
    useEffect(() => {
        checkUserIdentity();
    }, [checkUserIdentity]);

    /**
     * Auto-refresh tokens before expiry (50 min)
     */
    useEffect(() => {
        console.log('user', user);
        if (!user) return;

        const refreshInterval = setInterval(() => {
            refreshAuth();
        }, 50 * 60 * 1000);

        return () => clearInterval(refreshInterval);
    }, [user, refreshAuth]);

    const value: AuthContextType = {
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshAuth,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
