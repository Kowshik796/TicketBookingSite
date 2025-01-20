'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function ConfirmationPage() {
    const searchParams = useSearchParams();
    const seats = searchParams.get('seats');
    const total = searchParams.get('total');

    const seatsArray = useMemo(() => {
        if (!seats) return [];
        return seats.split(',').filter(Boolean);
    }, [seats]);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
            <div className="max-w-2xl mx-auto card p-8 text-center">
                <div className="success-checkmark mx-auto mb-6">
                    <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                    </svg>
                </div>

                <h1 className="section-title mb-2">Booking Confirmed!</h1>
                <p className="text-gray-600 dark:text-gray-400 mb-8">Your tickets have been booked successfully.</p>

                <div className="bg-gradient-to-br from-gray-50 dark:from-gray-700 to-white dark:to-gray-800 rounded-xl p-6 mb-8 text-left border border-gray-100 dark:border-gray-600">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Seats</span>
                            <span className="text-gray-900 dark:text-white font-medium">{seatsArray.join(', ')}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Total Paid</span>
                            <span className="text-gray-900 dark:text-white font-medium">₹{total}</span>
                        </div>
                    </div>
                </div>

                <div className="qr-placeholder dark:bg-gradient-to-br dark:from-gray-700 dark:to-gray-800 dark:border-gray-600 inline-block mb-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 font-medium">Mock QR Code</p>
                    <div className="w-40 h-40 bg-gray-100 dark:bg-gray-600 rounded-xl flex items-center justify-center">
                        <div className="w-32 h-32 bg-gray-300 dark:bg-gray-500 rounded-lg grid grid-cols-5 gap-1 p-2">
                            {Array.from({ length: 50 }).map((_, i) => (
                                <div key={i} className={`rounded-sm ${Math.random() > 0.5 ? 'bg-gray-700 dark:bg-gray-900' : 'bg-white dark:bg-gray-300'}`}></div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-8">
                    <Link
                        href="/"
                        className="btn-primary inline-block"
                    >
                        Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}