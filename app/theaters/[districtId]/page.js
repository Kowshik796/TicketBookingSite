'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { getTheatersByDistrict, getDistricts } from '../../../data/mock';

export default function TheatersPage() {
    const params = useParams();
    const districtId = params.districtId;
    const [theaters, setTheaters] = useState([]);
    const [allDistricts, setAllDistricts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const [theatersData, districtsData] = await Promise.all([
                getTheatersByDistrict(districtId),
                getDistricts(),
            ]);
            setTheaters(theatersData);
            setAllDistricts(districtsData);
            setLoading(false);
        };
        fetchData();
    }, [districtId]);

    const district = allDistricts.find(d => d.id === Number(districtId));

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
            <div className="mb-8">
                <h1 className="section-title mb-2">
                    {district ? district.name : 'District'} Theaters
                </h1>
                <div className="breadcrumb">
                    <Link href="/">Home</Link>
                    <span>/</span>
                    <span className="text-gray-700 font-medium">{district ? district.name : 'Theaters'}</span>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-20">
                    <p className="text-gray-600 text-lg">Loading theaters...</p>
                </div>
            ) : theaters.length === 0 ? (
                <div className="error-state">
                    <p className="text-gray-600 text-lg">No theaters listed yet in this district — check back soon.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {theaters.map((theater, index) => (
                        <Link
                            key={theater.id}
                            href={`/theaters/${districtId}/${theater.id}`}
                            className="theater-card animate-slide-up"
                            style={{ animationDelay: `${index * 0.1}s` }}
                        >
                            <h3 className="text-lg font-bold text-gray-900 mb-2">{theater.name}</h3>
                            <p className="text-gray-600 text-sm flex items-start gap-2">
                                <svg className="w-5 h-5 text-[#C21807] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                </svg>
                                <span>{theater.address}</span>
                            </p>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}