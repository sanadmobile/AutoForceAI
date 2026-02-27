"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode, Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

interface User {
    id: number;
    username: string;
    role?: string;
    org_id?: number | null;
    org_name?: string; // Add Organization Name
    avatar?: string;
    headimgurl?: string; // Add WeChat headimgurl
    nickname?: string;   // Add WeChat nickname
    invite_code?: string; // Add Enterprise Invite Code
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, user: User) => void;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Persist redirect param to handle OAuth callbacks that might strip params
    useEffect(() => {
        const redirect = searchParams?.get('redirect');
        if (redirect) {
            sessionStorage.setItem('login_redirect', redirect);
        }
    }, [searchParams]);

    useEffect(() => {
        // Load from localStorage on mount
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        if (!isLoading) {
            // Public paths that don't satisfy authentication
            const publicPaths = ['/login', '/landing', '/solution'];
            const isPublicPath = publicPaths.includes(pathname || '');

            // If not authenticated and not on a public page, redirect
            if (!token && !isPublicPath) {
                router.push('/login');
            }
            // If authenticated and on login page, redirect to home or requested page
            if (token && pathname === '/login') {
                const redirect = searchParams?.get('redirect');
                const storedRedirect = sessionStorage.getItem('login_redirect');
                const finalRedirect = redirect || storedRedirect || '/';
                
                // Do not remove key immediately to prevent race conditions causing fallthrough to '/'
                // We will let the navigation happen.
                router.push(finalRedirect);
            }
        }
    }, [token, isLoading, pathname, router, searchParams]);

    const login = (newToken: string, newUser: User) => {
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(newUser));
        setToken(newToken);
        setUser(newUser);
        // Clean up any stale redirect param after successful login state set
        // But let useEffect handle the actual routing
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
        router.push('/login');
    };

    // Prevent rendering children until check is done (simple protection)
    // In a real app you might show a loading spinner here
    // But we allowing rendering for now, the useEffect will handle redirect
    
    return (
        <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
