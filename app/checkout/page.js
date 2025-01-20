'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getShowById } from '../../data/mock';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export default function CheckoutPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user } = useAuth();
    const showId = searchParams.get('showId');
    const seats = searchParams.get('seats');
    const total = Number(searchParams.get('total')) || 0;
    const [show, setShow] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const seatsArray = useMemo(() => {
        if (!seats) return [];
        return seats.split(',').filter(Boolean);
    }, [seats]);

    useEffect(() => {
        const fetchShow = async () => {
            if (!showId) {
                setLoading(false);
                return;
            }
            const data = await getShowById(showId);
            setShow(data);
            setLoading(false);
        };
        fetchShow();
    }, [showId]);

    const handlePay = async () => {
        if (!show || seatsArray.length === 0 || !user) return;
        setSaving(true);
        setError('');

        const { error: insertError } = await supabase.from('bookings').insert({
            show_id: Number(showId),
            seats: seats,
            total_amount: total,
            payment_status: 'completed',
            user_email: user.email,
        });

        if (insertError) {
            setError('Failed to complete booking. Please try again.');
            setSaving(false);
            return;
        }

        const params = new URLSearchParams();
        params.set('showId', showId);
        params.set('seats', seats);
        params.set('total', String(total));
        router.push(`/confirmation?${params.toString()}`);
    };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="text-center py-20">
                    <p className="text-gray-600 dark:text-gray-400 text-lg">Loading booking details...</p>
                </div>
            </div>
        );
    }

    if (!show) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="text-center py-20">
                    <p className="text-gray-600 dark:text-gray-400 text-lg">Booking details not found.</p>
                    <Link href="/" className="text-primary dark:text-[#FF6B6B] font-semibold mt-4 inline-block hover:underline">Go Home</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
            <div className="mb-8">
                <h1 className="section-title mb-2">Checkout</h1>
                <div className="breadcrumb">
                    <Link href="/">Home</Link>
                    <span>/</span>
                    <span className="text-gray-700 dark:text-gray-300 font-medium">Checkout</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="card p-6">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Movie & Show</h2>
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="font-semibold text-gray-900 dark:text-white">{show.movie_title}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Time: {show.time}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Price per seat: ₹{show.price}</p>
                            </div>
                        </div>
                    </div>

                    <div className="card p-6">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Selected Seats</h2>
                        <div className="flex flex-wrap gap-2">
                            {seatsArray.map(seat => (
                                <span key={seat} className="inline-flex items-center rounded-md bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
                                    {seat}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="card p-6 h-fit">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Order Summary</h2>
                    <div className="space-y-3 mb-6">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Seats ({seatsArray.length})</span>
                            <span className="text-gray-900 dark:text-white">₹{total}</span>
                        </div>
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-3 flex items-center justify-between">
                            <span className="font-semibold text-gray-900 dark:text-white">Total</span>
                            <span className="text-xl font-bold text-gradient">₹{total}</span>
                        </div>
                    </div>
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/30 border-2 border-red-100 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl text-sm animate-slide-up mb-4">
                            {error}
                        </div>
                    )}
                    <button
                        onClick={handlePay}
                        disabled={saving}
                        className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? 'Processing...' : 'Pay Now'}
                    </button>
                </div>
            </div>
        </div>
    );
}