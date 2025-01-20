'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getDistricts } from '../data/mock';

export default function HomePage() {
    const [search, setSearch] = useState('');
    const [districts, setDistricts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDistricts = async () => {
            const data = await getDistricts();
            setDistricts(data);
            setLoading(false);
        };
        fetchDistricts();
    }, []);

    const filtered = districts.filter(d =>
        d.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
            <div className="text-center mb-12">
                <h1 className="section-title mb-3">Select Your District</h1>
                <p className="section-subtitle mx-auto">
                    Choose your district in Tamil Nadu to explore theaters and book movie tickets.
                </p>
            </div>

            <div className="mb-10 max-w-xl mx-auto">
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search districts..."
                    className="input-field"
                />
            </div>

            {loading ? (
                <div className="text-center py-20">
                    <p className="text-gray-600 text-lg">Loading districts...</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="error-state">
                    <p className="text-gray-600 text-lg">No districts found.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {filtered.map((district, index) => (
                        <Link
                            key={district.id}
                            href={`/theaters/${district.id}`}
                            className="district-card animate-slide-up"
                            style={{ animationDelay: `${index * 0.05}s` }}
                        >
                            <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{district.name}</h3>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}