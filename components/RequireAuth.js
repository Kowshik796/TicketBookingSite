'use client';

import { useAuth } from '../context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function RequireAuth({ children }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (pathname.startsWith('/admin')) {
            return;
        }
        if (!loading && !user && pathname !== '/login' && pathname !== '/signup') {
            router.push('/login');
        }
    }, [user, loading, router, pathname]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-xl text-gray-600 dark:text-gray-400">Loading...</div>
            </div>
        );
    }

    if (pathname.startsWith('/admin')) {
        return children;
    }

    if (!user && pathname !== '/login' && pathname !== '/signup') {
        return null;
    }

    return children;
}
