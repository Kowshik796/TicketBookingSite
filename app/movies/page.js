'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MoviesPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/');
    }, [router]);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="text-center py-20">
                <p className="text-gray-600 dark:text-gray-400 text-lg">Redirecting...</p>
            </div>
        </div>
    );
}