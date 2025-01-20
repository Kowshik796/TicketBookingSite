'use client';

import { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getShowById } from '../../../data/mock';

export default function BookingPage() {
    const params = useParams();
    const router = useRouter();
    const showId = params.showId;
    const [show, setShow] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedSeats, setSelectedSeats] = useState([]);

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
                    <p className="text-gray-600 text-lg">Loading show details...</p>
                </div>
            </div>
        );
    }

    if (!show) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="text-center py-20">
                    <p className="text-gray-600 text-lg">Show not found.</p>
                    <Link href="/" className="text-primary font-semibold mt-4 inline-block hover:underline">Go Home</Link>
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
                <h1 className="section-title mb-2">Select Seats</h1>
                <div className="breadcrumb">
                    <Link href="/">Home</Link>
                    <span>/</span>
                    <span className="text-gray-700 font-medium">Booking</span>
                </div>
            </div>

            <div className="card p-6 mb-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-1">{show.movie_title}</h2>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
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
                    <div className="flex items-center justify-center gap-8 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-white border-2 border-gray-300"></div>
                            <span className="font-medium">Available</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#C21807] to-[#E63946] border-2 border-[#C21807]"></div>
                            <span className="font-medium">Selected</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-center gap-3">
                    {rows.map(row => (
                        <div key={row} className="flex items-center gap-2">
                            <span className="w-8 text-center text-sm font-bold text-gray-700">{row}</span>
                            {Array.from({ length: seatsPerRow }).map((_, i) => {
                                const seatId = `${row}${i + 1}`;
                                const isSelected = selectedSeats.includes(seatId);
                                return (
                                    <button
                                        key={seatId}
                                        onClick={() => toggleSeat(seatId)}
                                        className={`seat-btn ${isSelected ? 'seat-selected' : 'seat-available'}`}
                                    >
                                        {i + 1}
                                    </button>
                                );
                            })}
                            <span className="w-8 text-center text-sm font-bold text-gray-700">{row}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="card p-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex-1">
                        <p className="text-sm text-gray-600 mb-1">Selected Seats</p>
                        <p className="font-semibold text-gray-900 text-lg">
                            {sortedSeats.length > 0 ? sortedSeats.join(', ') : 'None'}
                        </p>
                    </div>
                    <div className="text-center sm:text-right">
                        <p className="text-sm text-gray-600 mb-1">Total Amount</p>
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