'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import { getTheaterAnalytics } from '../../../data/db';

export default function AdminDashboardPage() {
    const { admin } = useAdminAuth();
    const [theater, setTheater] = useState(null);
    const [shows, setShows] = useState([]);
    const [movies, setMovies] = useState([]);
    const [newShow, setNewShow] = useState({ movieId: '', time: '', price: '' });
    const [loading, setLoading] = useState(true);
    const [analytics, setAnalytics] = useState(null);
    const [analyticsLoading, setAnalyticsLoading] = useState(true);

    useEffect(() => {
        if (!admin?.theaterId) return;
        fetchTheater();
        fetchShows();
        fetchMovies();
        fetchAnalytics();
    }, [admin]);

    const fetchTheater = async () => {
        const { data, error } = await supabase
            .from('theaters')
            .select('name, address')
            .eq('id', admin.theaterId)
            .single();
        if (data) setTheater(data);
    };

    const fetchShows = async () => {
        const { data, error } = await supabase
            .from('shows')
            .select('id, show_time, price, movie_id, movies (title)')
            .eq('theater_id', admin.theaterId)
            .order('show_time', { ascending: true });
        if (data) setShows(data || []);
        setLoading(false);
    };

    const fetchMovies = async () => {
        const { data, error } = await supabase
            .from('movies')
            .select('id, title')
            .order('title', { ascending: true });
        if (data) setMovies(data || []);
    };

    const fetchAnalytics = async () => {
        setAnalyticsLoading(true);
        const data = await getTheaterAnalytics(admin.theaterId);
        setAnalytics(data);
        setAnalyticsLoading(false);
    };

    const handleDeleteShow = async (showId) => {
        if (!confirm('Delete this show?')) return;
        await supabase.from('shows').delete().eq('id', showId);
        fetchShows();
        fetchAnalytics();
    };

    const handleAddShow = async (e) => {
        e.preventDefault();
        if (!newShow.movieId || !newShow.time || !newShow.price) return;
        const { data, error } = await supabase.from('shows').insert({
            theater_id: Number(admin.theaterId),
            movie_id: Number(newShow.movieId),
            show_time: String(newShow.time),
            price: Number(newShow.price),
        });
        if (error) {
            console.error('Supabase insert error:', error);
        }
        setNewShow({ movieId: '', time: '', price: '' });
        fetchShows();
        fetchAnalytics();
    };

    if (!admin) return null;

    const hasBookings = analytics && analytics.totalBookings > 0;

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
            <div className="mb-6 sm:mb-8">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-[#C21807] to-[#E63946] bg-clip-text text-transparent mb-2">
                    Theater Admin
                </h1>
                <p className="text-gray-600 dark:text-gray-400">Manage shows for your theater</p>
                {theater && (
                    <div className="card p-6 mt-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{theater.name}</h2>
                        <p className="text-gray-600 dark:text-gray-400">{theater.address}</p>
                    </div>
                )}
            </div>

            <div className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Analytics Overview</h2>
                {analyticsLoading ? (
                    <div className="card p-6 text-gray-600 dark:text-gray-400">Loading analytics...</div>
                ) : !hasBookings ? (
                    <div className="card p-6 text-gray-600 dark:text-gray-400">
                        No bookings yet — analytics will appear here once customers start booking.
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                            <div className="card p-6 text-center">
                                <p className="text-4xl font-bold text-[#C21807]">{analytics.totalBookings}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Total Bookings</p>
                            </div>
                            <div className="card p-6 text-center">
                                <p className="text-4xl font-bold text-[#C21807]">₹{analytics.totalRevenue}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Total Revenue</p>
                            </div>
                            <div className="card p-6 text-center">
                                <p className="text-4xl font-bold text-[#C21807]">{analytics.totalSeatsSold}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Total Seats Sold</p>
                            </div>
                        </div>

                        <div className="card p-4 sm:p-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Per-Movie Breakdown</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-200 dark:border-gray-700">
                                            <th className="py-2 font-semibold text-gray-700 dark:text-gray-300">Movie</th>
                                            <th className="py-2 font-semibold text-gray-700 dark:text-gray-300">Shows</th>
                                            <th className="py-2 font-semibold text-gray-700 dark:text-gray-300">Seats Sold</th>
                                            <th className="py-2 font-semibold text-gray-700 dark:text-gray-300">Revenue</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {analytics.perMovie.map((item) => (
                                            <tr key={item.movie_title} className="border-b border-gray-100 dark:border-gray-700 last:border-0">
                                                <td className="py-2 text-gray-900 dark:text-white">{item.movie_title}</td>
                                                <td className="py-2 text-gray-700 dark:text-gray-300">{item.shows_count}</td>
                                                <td className="py-2 text-gray-700 dark:text-gray-300">{item.seats_sold}</td>
                                                <td className="py-2 text-[#C21807] font-semibold">₹{item.revenue}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <div className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Current Shows</h2>
                {loading ? (
                    <div className="card p-6 text-gray-600 dark:text-gray-400">Loading shows...</div>
                ) : shows.length === 0 ? (
                    <div className="card p-6 text-gray-600 dark:text-gray-400">No shows found. Add one below.</div>
                ) : (
                    <div className="space-y-3">
                        {shows.map((show) => (
                            <div key={show.id} className="card p-4 flex items-center justify-between">
                                <div>
                                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                        {show.movies?.title || 'Unknown Movie'}
                                    </p>
                                    <p className="text-gray-600 dark:text-gray-400">
                                        {show.show_time} • ₹{Number(show.price).toFixed(2)}
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleDeleteShow(show.id)}
                                    className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Add New Show</h2>
                <form onSubmit={handleAddShow} className="card p-6 space-y-4">
                    <div>
                        <label htmlFor="movieId" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Movie
                        </label>
                        <select
                            id="movieId"
                            value={newShow.movieId}
                            onChange={(e) => setNewShow({ ...newShow, movieId: e.target.value })}
                            required
                            className="input-field"
                        >
                            <option value="">Select movie</option>
                            {movies.map((m) => (
                                <option key={m.id} value={m.id}>{m.title}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="time" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Show Time
                        </label>
                        <input
                            id="time"
                            type="text"
                            value={newShow.time}
                            onChange={(e) => setNewShow({ ...newShow, time: e.target.value })}
                            required
                            className="input-field"
                            placeholder="7:00 PM"
                        />
                    </div>
                    <div>
                        <label htmlFor="price" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Price (₹)
                        </label>
                        <input
                            id="price"
                            type="number"
                            step="0.01"
                            value={newShow.price}
                            onChange={(e) => setNewShow({ ...newShow, price: e.target.value })}
                            required
                            className="input-field"
                            placeholder="150"
                        />
                    </div>
                    <button type="submit" className="btn-primary w-full">
                        Add Show
                    </button>
                </form>
            </div>
        </div>
    );
}