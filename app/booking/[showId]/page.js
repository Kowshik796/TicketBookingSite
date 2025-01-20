'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getShowById } from '../../../data/mock';
import { supabase } from '../../../lib/supabase';
import { useLanguage } from '../../../context/LanguageContext';

export default function BookingPage() {
    const params = useParams();
    const router = useRouter();
    const { t } = useLanguage();
    const showId = params.showId;
    const [show, setShow] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [bookedSeats, setBookedSeats] = useState([]);
    const [conflictMessage, setConflictMessage] = useState('');

    const fetchBookedSeats = useCallback(async () => {
        if (!showId) return;
        try {
            const { data: bookings } = await supabase
                .from('bookings')
                .select('seats')
                .eq('show_id', Number(showId));

            if (bookings) {
                const allBooked = bookings.flatMap(b =>
                    (b.seats || '').split(',').map(s => s.trim()).filter(Boolean)
                );
                setBookedSeats(allBooked);
            }
        } catch (err) {
            console.warn('Failed to fetch booked seats:', err.message);
        }
    }, [showId]);

    // Detect if a selected seat became booked during polling
    useEffect(() => {
        const newlyBooked = selectedSeats.filter(seat => bookedSeats.includes(seat));
        if (newlyBooked.length > 0) {
            setSelectedSeats(prev => prev.filter(seat => !bookedSeats.includes(seat)));
            setConflictMessage(
                `Seat${newlyBooked.length > 1 ? 's' : ''} ${newlyBooked.join(', ')} ${newlyBooked.length > 1 ? 'were' : 'was'} just booked by someone else — please choose another.`
            );
            const timer = setTimeout(() => setConflictMessage(''), 6000);
            return () => clearTimeout(timer);
        }
    }, [bookedSeats, selectedSeats]);

    // Initial fetch + polling every 10 seconds
    useEffect(() => {
        fetchBookedSeats();
        const interval = setInterval(fetchBookedSeats, 10000);
        return () => clearInterval(interval);
    }, [fetchBookedSeats]);

    useEffect(() => {
        const fetchShow = async () => {
            const data = await getShowById(showId);
            setShow(data);
            setLoading(false);
        };
        fetchShow();
    }, [showId]);

    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const seatsPerRow = 10;
    const price = show ? show.price : 0;

    const toggleSeat = (seatId) => {
        if (bookedSeats.includes(seatId)) return;
        setSelectedSeats(prev =>
            prev.includes(seatId) ? prev.filter(id => id !== seatId) : [...prev, seatId]
        );
    };

    const sortedSeats = useMemo(() => {
        return [...selectedSeats].sort((a, b) => {
            const rowA = a.charAt(0);
            const rowB = b.charAt(0);
            if (rowA !== rowB) return rowA.localeCompare(rowB);
            return parseInt(a.slice(1)) - parseInt(b.slice(1));
        });
    }, [selectedSeats]);

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="text-center py-20">
                    <p className="text-gray-600 dark:text-gray-400 text-lg">{t('loadingShowDetails')}</p>
                </div>
            </div>
        );
    }

    if (!show) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="text-center py-20">
                    <p className="text-gray-600 dark:text-gray-400 text-lg">{t('showNotFound')}</p>
                    <Link href="/" className="text-primary dark:text-[#FF6B6B] font-semibold mt-4 inline-block hover:underline">{t('goHome')}</Link>
                </div>
            </div>
        );
    }

    const handleProceed = () => {
        if (selectedSeats.length === 0) return;
        const params = new URLSearchParams();
        params.set('showId', showId);
        params.set('seats', selectedSeats.join(','));
        params.set('total', selectedSeats.length * price);
        router.push(`/checkout?${params.toString()}`);
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
            <div className="mb-8">
                <h1 className="section-title mb-2">{t('selectSeats')}</h1>
                <div className="breadcrumb">
                    <Link href="/">{t('home')}</Link>
                    <span>/</span>
                    <span className="text-gray-700 dark:text-gray-300 font-medium">{t('booking')}</span>
                </div>
            </div>

            <div className="card p-6 mb-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{show.movie_title}</h2>
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                                <svg className="w-4 h-4 text-[#C21807]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                                {show.time}
                            </span>
                            <span className="flex items-center gap-1">
                                <svg className="w-4 h-4 text-[#C21807]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z"></path>
                                </svg>
                                ₹{price} per seat
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card p-6 mb-8">
                <div className="mb-8">
                    <div className="flex items-center justify-center gap-6 sm:gap-8 text-sm text-gray-600 dark:text-gray-400 flex-wrap">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-white dark:bg-gray-600 border-2 border-gray-300 dark:border-gray-500"></div>
                            <span className="font-medium">{t('available')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#C21807] to-[#E63946] border-2 border-[#C21807]"></div>
                            <span className="font-medium">{t('selected')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gray-300 dark:bg-gray-700 border-2 border-gray-400 dark:border-gray-600 flex items-center justify-center">
                                <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </div>
                            <span className="font-medium">{t('booked')}</span>
                        </div>
                    </div>
                </div>

                {conflictMessage && (
                    <div className="bg-red-50 dark:bg-red-900/30 border-2 border-red-100 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl text-sm animate-slide-up mb-6 text-center">
                        {conflictMessage}
                    </div>
                )}

                <div className="flex flex-col items-center gap-1.5 sm:gap-3 overflow-x-auto pb-2">
                    {rows.map(row => (
                        <div key={row} className="flex items-center gap-1 sm:gap-2">
                            <span className="w-5 sm:w-8 text-center text-[11px] sm:text-sm font-bold text-gray-700 dark:text-gray-300">{row}</span>
                            {Array.from({ length: seatsPerRow }).map((_, i) => {
                                const seatId = `${row}${i + 1}`;
                                const isSelected = selectedSeats.includes(seatId);
                                const isBooked = bookedSeats.includes(seatId);
                                return (
                                    <button
                                        key={seatId}
                                        onClick={() => toggleSeat(seatId)}
                                        disabled={isBooked}
                                        className={`seat-btn ${isBooked ? 'seat-booked' : isSelected ? 'seat-selected' : 'seat-available'}`}
                                    >
                                        {i + 1}
                                    </button>
                                );
                            })}
                            <span className="w-5 sm:w-8 text-center text-[11px] sm:text-sm font-bold text-gray-700 dark:text-gray-300">{row}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="card p-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex-1">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Selected Seats</p>
                        <p className="font-semibold text-gray-900 dark:text-white text-lg">
                            {sortedSeats.length > 0 ? sortedSeats.join(', ') : 'None'}
                        </p>
                    </div>
                    <div className="text-center sm:text-right">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Amount</p>
                        <p className="text-3xl font-bold text-gradient">₹{selectedSeats.length * price}</p>
                    </div>
                    <button
                        onClick={handleProceed}
                        disabled={selectedSeats.length === 0}
                        className="btn-primary w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Proceed to Pay
                    </button>
                </div>
            </div>
        </div>
    );
}