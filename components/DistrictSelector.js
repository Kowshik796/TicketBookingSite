'use client';

import { useState, useRef, useEffect } from 'react';
import { useDistrict } from '../context/DistrictContext';

export default function DistrictSelector() {
    const { selectedDistrict, districts, changeDistrict, loading } = useDistrict();
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const dropdownRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(e) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false);
                setSearch('');
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filtered = districts.filter(d =>
        d.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleSelect = (district) => {
        changeDistrict(district);
        setOpen(false);
        setSearch('');
    };

    if (loading || !selectedDistrict) {
        return (
            <div className="text-sm text-white/70 px-2 py-1">
                Loading...
            </div>
        );
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setOpen(prev => !prev)}
                className="flex items-center gap-1.5 text-sm font-semibold bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
            >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="hidden sm:inline">{selectedDistrict.name}</span>
                <span className="sm:hidden">{selectedDistrict.name.substring(0, 4)}</span>
                <svg className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {open && (
                <div className="absolute right-0 sm:right-auto sm:left-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50 animate-fade-in">
                    <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search districts..."
                            className="w-full px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-[#C21807] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                            autoFocus
                        />
                    </div>
                    <div className="max-h-60 overflow-y-auto py-1">
                        {filtered.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                                No districts found
                            </div>
                        ) : (
                            filtered.map((district) => (
                                <button
                                    key={district.id}
                                    onClick={() => handleSelect(district)}
                                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2 ${selectedDistrict.id === district.id
                                            ? 'bg-[#C21807]/10 text-[#C21807] dark:text-[#FF6B6B] font-semibold'
                                            : 'text-gray-700 dark:text-gray-200 hover:bg-red-50 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    {selectedDistrict.id === district.id && (
                                        <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                        </svg>
                                    )}
                                    {selectedDistrict.id !== district.id && (
                                        <span className="w-4 flex-shrink-0" />
                                    )}
                                    {district.name}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}