'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { getAllMovies } from '../../data/mock';

function formatReleaseDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}`;
}

export default function MoviesPage() {
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLanguage, setSelectedLanguage] = useState('All');

    useEffect(() => {
        const fetchMovies = async () => {
            const data = await getAllMovies();
            setMovies(data);
            setLoading(false);
        };
        fetchMovies();
    }, []);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const languages = useMemo(() => {
        const langSet = new Set();
        movies.forEach(m => { if (m.language) langSet.add(m.language); });
        return ['All', ...Array.from(langSet).sort()];
    }, [movies]);

    const filteredMovies = useMemo(() => {
        return movies.filter(movie => {
            const matchesSearch = !searchTerm || movie.title.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesLanguage = selectedLanguage === 'All' || movie.language === selectedLanguage;
            return matchesSearch && matchesLanguage;
        });
    }, [movies, searchTerm, selectedLanguage]);

    const nowShowing = useMemo(() => {
        return filteredMovies.filter(m => {
            if (!m.release_date) return true;
            const release = new Date(m.release_date + 'T00:00:00');
            return release <= today;
        });
    }, [filteredMovies, today]);

    const comingSoon = useMemo(() => {
        return filteredMovies.filter(m => {
            if (!m.release_date) return false;
            const release = new Date(m.release_date + 'T00:00:00');
            return release > today;
        });
    }, [filteredMovies, today]);

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="text-center py-20">
                    <p className="text-gray-600 dark:text-gray-400 text-lg">Loading movies...</p>
                </div>
            </div>
        );
    }

    if (movies.length === 0) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="text-center py-20">
                    <p className="text-gray-600 dark:text-gray-400 text-lg">No movies found.</p>
                    <Link href="/" className="text-[#C21807] dark:text-[#FF6B6B] font-semibold mt-4 inline-block hover:underline">Go Home</Link>
                </div>
            </div>
        );
    }

    function renderMovieGrid(movies, showReleaseDate = false) {
        if (movies.length === 0) return null;
        return (
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
                            <div className="aspect-[2/3] w-full bg-gradient-to-br from-gray-100 dark:from-gray-700 to-gray-200 dark:to-gray-600 flex items-center justify-center">
                                <svg className="w-12 h-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"></path>
                                </svg>
                            </div>
                        )}
                        <div className="p-4">
                            <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base truncate">{movie.title}</h3>
                            {showReleaseDate && movie.release_date && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Releasing {formatReleaseDate(movie.release_date)}</p>
                            )}
                            {movie.language && (
                                <span className="inline-block mt-2 text-xs font-medium text-[#C21807] dark:text-[#FF6B6B] bg-red-50 dark:bg-red-900/30 px-2 py-0.5 rounded-full">
                                    {movie.language}
                                </span>
                            )}
                        </div>
                    </Link>
                ))}
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
                    <span className="text-gray-700 dark:text-gray-300 font-medium">Movies</span>
                </div>
            </div>

            {/* Search Input */}
            <div className="relative mb-6">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search movies..."
                    className="input-field pl-12"
                />
            </div>

            {/* Language Filter Pills */}
            <div className="flex flex-wrap gap-2 mb-8">
                {languages.map((lang) => (
                    <button
                        key={lang}
                        onClick={() => setSelectedLanguage(lang)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${selectedLanguage === lang
                            ? 'bg-[#C21807] text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                    >
                        {lang}
                    </button>
                ))}
            </div>

            {filteredMovies.length === 0 ? (
                <div className="text-center py-20">
                    <p className="text-gray-600 dark:text-gray-400 text-lg">No movies found.</p>
                    <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">Try adjusting your search or filter.</p>
                </div>
            ) : (
                <>
                    {nowShowing.length > 0 && (
                        <div className="mb-12">
                            <h2 className="section-title text-2xl mb-6">Now Showing</h2>
                            {renderMovieGrid(nowShowing)}
                        </div>
                    )}
                    {comingSoon.length > 0 && (
                        <div>
                            <h2 className="section-title text-2xl mb-6">Coming Soon</h2>
                            {renderMovieGrid(comingSoon, true)}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
