'use client';

import Link from 'next/link';

export default function AboutPage() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 animate-fade-in">
            <div className="mb-6 sm:mb-8">
                <h1 className="section-title mb-2">About Us</h1>
                <div className="breadcrumb">
                    <Link href="/">Home</Link>
                    <span>/</span>
                    <span className="text-gray-700 dark:text-gray-300 font-medium">About</span>
                </div>
            </div>

            <div className="card p-4 sm:p-8 max-w-3xl">
                <div className="prose prose-gray dark:prose-invert max-w-none">
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-base">
                        Watch Your Show is a movie ticket booking platform built specifically for Tamil Nadu,
                        connecting moviegoers with theaters across all 38 districts of the state.
                        Our platform lets you browse the latest Tamil releases, check real-time showtimes
                        and pricing, and book your seats in just a few taps.
                    </p>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-base mt-4">
                        We work directly with local theaters to keep showtimes and pricing accurate and up to date.
                        Whether you're in Chennai or a smaller district, we aim to bring the same convenient
                        movie-booking experience to everyone in Tamil Nadu.
                    </p>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-base mt-4">
                        Our movie catalog updates automatically as new Tamil films release, so you'll always find
                        what's currently playing. We're constantly working to add more theaters and improve the experience.
                    </p>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-base mt-6 font-semibold">
                        Thank you for using Watch Your Show — enjoy the movies!
                    </p>
                </div>
            </div>
        </div>
    );
}