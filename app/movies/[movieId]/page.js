'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getMovieDetails } from '../../../data/mock';

export default function MovieDetailPage() {
    const params = useParams();
    const movieId = params.movieId;
    const [movie, setMovie] = useState(null);
    const [showtimes, setShowtimes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMovie = async () => {
            const data = await getMovieDetails(movieId);
            if (data) {
                setMovie(data.movie);
                setShowtimes(data.showtimes);
            }
            setLoading(false);
        };
        fetchMovie();
    }, [movieId]);

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="text-center py-20">
                    <p className="text-gray-600 text-lg">Loading movie details...</p>
                </div>
            </div>
        );
    }

    if (!movie) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="text-center py-20">
                    <p className="text-gray-600 text-lg">Movie not found.</p>
                    <Link href="/movies" className="text-[#C21807] font-semibold mt-4 inline-block hover:underline">Browse Movies</Link>
                </div>
            </div>
        );
    }

    const groupedByDistrict = showtimes.reduce((acc, show) => {
        if (!acc[show.district_name]) {
            acc[show.district_name] = [];
        }
        acc[show.district_name].push(show);
        return acc;
    }, {});

    const districtNames = Object.keys(groupedByDistrict).sort();

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
            <div className="mb-8">
                <div className="breadcrumb mb-4">
                    <Link href="/">Home</Link>
                    <span>/</span>
                    <Link href="/movies" className="hover:text-[#C21807]">Movies</Link>
                    <span>/</span>
                    <span className="text-gray-700 font-medium">{movie.title}</span>
                </div>
            </div>

            <div className="card p-6 mb-10 overflow-hidden">
                <div className="flex flex-col md:flex-row gap-8">
                    {movie.poster_url ? (
                        <div className="w-full md:w-72 flex-shrink-0">
                            <img
                                src={movie.poster_url}
                                alt={movie.title}
                                className="w-full rounded-xl shadow-lg"
                            />
                        </div>
                    ) : (
                        <div className="w-full md:w-72 h-96 flex-shrink-0 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
                            <svg className="w-20 h-20 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"></path>
                            </svg>
                        </div>
                    )}
                    <div className="flex-1">
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">{movie.title}</h1>
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                            {movie.language && (
                                <span className="text-sm font-medium text-[#C21807] bg-red-50 px-3 py-1 rounded-full">
                                    {movie.language}
                                </span>
                            )}
                            {movie.certificate && (
                                <span className="text-sm font-medium text-white bg-gray-700 px-3 py-1 rounded-full">
                                    {movie.certificate}
                                </span>
                            )}
                        </div>
                        <div className="space-y-2 text-sm text-gray-700">
                            {movie.runtime != null && (
                                <p>
                                    <span className="font-semibold text-gray-900">Runtime:</span>{' '}
                                    {Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m
                                </p>
                            )}
                            {movie.director && (
                                <p>
                                    <span className="font-semibold text-gray-900">Director:</span> {movie.director}
                                </p>
                            )}
                            {movie.cast_names && (
                                <p>
                                    <span className="font-semibold text-gray-900">Cast:</span> {movie.cast_names}
                                </p>
                            )}
                        </div>
                        {movie.description && (
                            <p className="mt-4 text-gray-600 leading-relaxed line-clamp-4">
                                {movie.description}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {showtimes.length === 0 ? (
                <div className="error-state">
                    <p className="text-gray-600 text-lg">No shows currently scheduled for this movie.</p>
                    <Link href="/movies" className="text-[#C21807] font-semibold mt-4 inline-block hover:underline">Browse other movies</Link>
                </div>
            ) : (
                <div className="space-y-8">
                    {districtNames.map(districtName => (
                        <div key={districtName}>
                            <h2 className="section-title text-2xl mb-4">{districtName}</h2>
                            <div className="space-y-4">
                                {groupedByDistrict[districtName].map((show, idx) => {
                                    const seatsLeft = show.seats_total - show.seats_booked;
                                    const isSoldOut = seatsLeft <= 0;

                                    return (
                                        <div
                                            key={show.show_id}
                                            className="card p-6 animate-slide-up"
                                            style={{ animationDelay: `${idx * 0.05}s` }}
                                        >
                                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                                <div className="flex-1">
                                                    <h3 className="text-lg font-bold text-gray-900">{show.theater_name}</h3>
                                                    <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                                                        <svg className="w-4 h-4 text-[#C21807] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                                        </svg>
                                                        {show.theater_address}
                                                    </p>
                                                    <div className="flex items-center gap-4 mt-2">
                                                        <span className="flex items-center gap-1 text-sm text-gray-600">
                                                            <svg className="w-4 h-4 text-[#C21807]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                                            </svg>
                                                            {show.show_time}
                                                        </span>
                                                        <span className="text-sm font-semibold text-[#C21807]">₹{show.price}</span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-2">
                                                    <span className={`text-sm font-medium ${isSoldOut ? 'text-red-600' : seatsLeft <= 10 ? 'text-orange-600' : 'text-green-600'}`}>
                                                        {isSoldOut ? '80/80 seats booked' : `${show.seats_booked}/80 seats booked`}
                                                    </span>
                                                    {isSoldOut ? (
                                                        <span className="bg-red-100 text-red-700 text-xs font-bold px-3 py-1.5 rounded-full">
                                                            SOLD OUT
                                                        </span>
                                                    ) : (
                                                        <Link
                                                            href={`/booking/${show.show_id}`}
                                                            className="btn-primary text-sm"
                                                        >
                                                            Book Now
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}