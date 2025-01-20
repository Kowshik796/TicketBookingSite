'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { AdminAuthProvider, useAdminAuth } from '../../context/AdminAuthContext';

function AdminLayoutInner({ children }) {
    const { admin, logoutAdmin } = useAdminAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const isLoginPage = pathname === '/admin/login';
        if (!admin && !isLoginPage) {
            router.replace('/admin/login');
        }
    }, [admin, pathname, router]);

    const handleLogout = () => {
        logoutAdmin();
        router.replace('/admin/login');
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {admin && (
                <header className="sticky top-0 z-50 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-bold bg-gradient-to-r from-[#C21807] to-[#E63946] bg-clip-text text-transparent">
                                Theater Admin — Watch Your Show
                            </span>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 text-sm font-semibold text-white bg-[#C21807] rounded-lg hover:bg-red-700 transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                </header>
            )}
            <main className={admin ? 'py-8' : ''}>
                {children}
            </main>
        </div>
    );
}

export default function AdminLayout({ children }) {
    return (
        <AdminAuthProvider>
            <AdminLayoutInner>{children}</AdminLayoutInner>
        </AdminAuthProvider>
    );
}