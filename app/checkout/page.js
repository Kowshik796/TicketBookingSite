'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getShowById } from '../../data/mock';

export default function CheckoutPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const showId = searchParams.get('showId');
    const seats = searchParams.get('seats');
    const total = Number(searchParams.get('total')) || 0;
    const [show, setShow] = useState(null);
    const [loading, setLoading] = useState(true);

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

    const handlePay = () => {
        if (!show || seatsArray.length === 0) return;
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
                    <p className="text-gray-600 text-lg">Loading booking details...</p>
                </div>
            </div>
        );
    }

    if (!show) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="text-center py-20">
                    <p className="text-gray-600 text-lg">Booking details not found.</p>
                    <Link href="/" className="text-primary font-semibold mt-4 inline-block hover:underline">Go Home</Link>
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
                    <span className="text-gray-700 font-medium">Checkout</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="card p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Movie & Show</h2>
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="font-semibold text-gray-900">{show.movie_title}</p>
                                <p className="text-sm text-gray-600">Time: {show.time}</p>
                                <p className="text-sm text-gray-600">Price per seat: ₹{show.price}</p>
                            </div>
                        </div>
                    </div>

                    <div className="card p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Selected Seats</h2>
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
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>
                    <div className="space-y-3 mb-6">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Seats ({seatsArray.length})</span>
                            <span className="text-gray-900">₹{total}</span>
                        </div>
                        <div className="border-t border-gray-200 pt-3 flex items-center justify-between">
                            <span className="font-semibold text-gray-900">Total</span>
                            <span className="text-xl font-bold text-gradient">₹{total}</span>
                        </div>
                    </div>
                    <button
                        onClick={handlePay}
                        className="btn-primary w-full"
                    >
                        Pay Now
                    </button>
                </div>
            </div>
        </div>
    );
}