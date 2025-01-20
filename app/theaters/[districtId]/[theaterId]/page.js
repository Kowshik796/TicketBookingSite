'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { getShowsByTheater, getDistricts } from '../../../../data/mock';

export default function TheaterDetailPage() {
    const params = useParams();
    const { districtId, theaterId } = params;
    const [shows, setShows] = useState([]);
    const [allDistricts, setAllDistricts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const [showsData, districtsData] = await Promise.all([
                getShowsByTheater(theaterId),
                getDistricts(),
            ]);
            setShows(showsData);
            setAllDistricts(districtsData);
            setLoading(false);
        };
        fetchData();
    }, [theaterId]);

    const district = allDistricts.find(d => d.id === Number(districtId));

    const showsByMovie = shows.reduce((acc, show) => {
        if (!acc[show.movie_title]) {
            acc[show.movie_title] = [];
        }
        acc[show.movie_title].push(show);
        return acc;
    }, {});

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="text-center py-20">
                    <p className="text-gray-600 dark:text-gray-400 text-lg">Loading shows...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
            <div className="mb-8">
                <h1 className="section-title mb-2">Theater Details</h1>
                <div className="breadcrumb">
                    <Link href="/">Home</Link>
                    <span>/</span>
                    <Link href={`/theaters/${districtId}`} className="hover:text-[#C21807]">
                        {district ? district.name : 'District'}
                    </Link>
                    <span>/</span>
                    <span className="text-gray-700 dark:text-gray-300 font-medium">Theater</span>
                </div>
            </div>

            {shows.length === 0 ? (
                <div className="error-state dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900 dark:border-gray-700">
                    <p className="text-gray-600 dark:text-gray-400 text-lg">No shows available at this theater right now.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {Object.entries(showsByMovie).map(([movieTitle, movieShows], idx) => (
                        <div key={movieTitle} className="card p-6 animate-slide-up" style={{ animationDelay: `${idx * 0.1}s` }}>
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{movieTitle}</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{movieShows.length} showtimes available</p>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    {movieShows.map(show => (
                                        <Link
                                            key={show.id}
                                            href={`/booking/${show.id}`}
                                            className="showtime-btn"
                                        >
                                            <svg className="w-5 h-5 text-[#C21807]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                            </svg>
                                            <span className="text-sm font-semibold text-gray-900 dark:text-white">{show.show_time}</span>
                                            <span className="text-xs font-bold text-[#C21807]">₹{show.price}</span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}