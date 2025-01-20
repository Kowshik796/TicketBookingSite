'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import RequireAuth from '../../components/RequireAuth';

export default function MyBookingsPage() {
    const { user } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBookings = async () => {
            if (!user) return;
            const { data, error } = await supabase
                .from('bookings')
                .select(`
                    id, seats, total_amount, payment_status, created_at,
                    show_id,
                    shows!inner(
                        show_time, price,
                        movies!inner(title, poster_url),
                        theaters!inner(name, address)
                    )
                `)
                .eq('user_email', user.email)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching bookings:', error);
            } else {
                setBookings(data || []);
            }
            setLoading(false);
        };
        fetchBookings();
    }, [user]);

    function formatDate(dateStr) {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }

    return (
        <RequireAuth>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 animate-fade-in">
                <div className="mb-6 sm:mb-8">
                    <h1 className="section-title mb-2">My Bookings</h1>
                    <div className="breadcrumb">
                        <Link href="/">Home</Link>
                        <span>/</span>
                        <span className="text-gray-700 dark:text-gray-300 font-medium">My Bookings</span>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-20">
                        <p className="text-gray-600 dark:text-gray-400 text-lg">Loading bookings...</p>
                    </div>
                ) : bookings.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-gray-600 dark:text-gray-400 text-lg">You haven't booked any tickets yet — browse movies to get started!</p>
                        <Link href="/movies" className="text-[#C21807] dark:text-[#FF6B6B] font-semibold mt-4 inline-block hover:underline">Browse Movies</Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {bookings.map((booking) => {
                            const show = booking.shows || {};
                            const movie = show.movies || {};
                            const theater = show.theaters || {};
                            return (
                                <div key={booking.id} className="card p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:gap-6">
                                    {movie.poster_url && (
                                        <div className="w-full sm:w-24 flex-shrink-0">
                                            <img
                                                src={movie.poster_url}
                                                alt={movie.title}
                                                className="w-full sm:w-24 h-36 object-cover rounded-xl"
                                            />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">{movie.title || 'Unknown'}</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{theater.name}{theater.address ? `, ${theater.address}` : ''}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Show Time: {show.show_time}</p>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm">
                                            <span className="text-gray-700 dark:text-gray-300 font-medium">Seats: {booking.seats}</span>
                                            <span className="text-gray-700 dark:text-gray-300 font-medium">Paid: ₹{booking.total_amount}</span>
                                            <span className="text-gray-500 dark:text-gray-400 text-xs">Booked on {formatDate(booking.created_at)}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </RequireAuth>
    );
}