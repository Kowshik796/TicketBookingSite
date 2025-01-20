'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAllMovies } from '../../data/mock';

export default function MoviesPage() {
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMovies = async () => {
            const data = await getAllMovies();
            setMovies(data);
            setLoading(false);
        };
        fetchMovies();
    }, []);

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="text-center py-20">
                    <p className="text-gray-600 text-lg">Loading movies...</p>
                </div>
            </div>
        );
    }

    if (movies.length === 0) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="text-center py-20">
                    <p className="text-gray-600 text-lg">No movies found.</p>
                    <Link href="/" className="text-[#C21807] font-semibold mt-4 inline-block hover:underline">Go Home</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
            <div className="mb-8">
                <h1 className="section-title mb-2">All Movies</h1>
                <div className="breadcrumb">
                    <Link href="/">Home</Link>
                    <span>/</span>
                    <span className="text-gray-700 font-medium">Movies</span>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {movies.map((movie, index) => (
                    <Link
                        key={movie.id}
                        href={`/movies/${movie.id}`}
                        className="card overflow-hidden animate-slide-up"
                        style={{ animationDelay: `${index * 0.05}s` }}
                    >
                        {movie.poster_url ? (
                            <div className="aspect-[2/3] w-full overflow-hidden">
                                <img
                                    src={movie.poster_url}
                                    alt={movie.title}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                />
                            </div>
                        ) : (
                            <div className="aspect-[2/3] w-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"></path>
                                </svg>
                            </div>
                        )}
                        <div className="p-4">
                            <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{movie.title}</h3>
                            {movie.language && (
                                <span className="inline-block mt-2 text-xs font-medium text-[#C21807] bg-red-50 px-2 py-0.5 rounded-full">
                                    {movie.language}
                                </span>
                            )}
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}