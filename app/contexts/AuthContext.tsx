'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthUser, LoginCredentials } from '@/lib/types/auth.types';
import { AUTH_ROUTES } from '@/lib/config/routes';

interface AuthContextType {
    user: AuthUser | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (credentials: LoginCredentials) => Promise<void>;
    logout: () => void;
    refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Local storage key for user data only
const USER_KEY = 'user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    /**
     * Refresh authentication tokens (stored in httpOnly cookies)
     */
    const refreshAuth = useCallback(async () => {
        try {
            const response = await fetch(AUTH_ROUTES.REFRESH, {
                method: 'POST',
                credentials: 'include', // Important: include cookies
            });

            if (!response.ok) {
                throw new Error('Token refresh failed');
            }

            // Tokens are automatically set in cookies by the server
            // No need to handle them client-side
        } catch (error) {
            console.error('Token refresh error:', error);
            // If refresh fails, logout user
            logout();
        }
    }, []);

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
                credentials: 'include', // Important: include cookies
                body: JSON.stringify(credentials),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Login failed');
            }

            if (result.success && result.data?.user) {
                const { user } = result.data;

                // Store user data (tokens are in httpOnly cookies)
                setUser(user);
                localStorage.setItem(USER_KEY, JSON.stringify(user));
            }
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    };

    /**
     * Logout user and clear cookies
     */
    const logout = useCallback(() => {
        setUser(null);
        localStorage.removeItem(USER_KEY);

        // Call logout endpoint to clear cookies
        fetch(AUTH_ROUTES.LOGOUT, {
            method: 'POST',
            credentials: 'include',
        }).catch(console.error);
    }, []);

    /**
     * Load user data from localStorage on mount
     * Tokens are in httpOnly cookies, managed by browser
     */
    useEffect(() => {
        const storedUser = localStorage.getItem(USER_KEY);

        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }

        setIsLoading(false);
    }, []);

    /**
     * Auto-refresh tokens before expiry
     * Access token expires in 1 hour, refresh at 50 minutes
     */
    useEffect(() => {
        if (!user) return;

        // Refresh token every 50 minutes (before 1 hour expiry)
        const refreshInterval = setInterval(() => {
            refreshAuth();
        }, 50 * 60 * 1000); // 50 minutes

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

/**
 * Hook to use auth context
 */
export function useAuth() {
    const context = useContext(AuthContext);

    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    return context;
}
