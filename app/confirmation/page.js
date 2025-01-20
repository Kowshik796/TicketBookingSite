'use client';

import { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { useLanguage } from '../../context/LanguageContext';

export default function ConfirmationPage() {
    const searchParams = useSearchParams();
    const { t } = useLanguage();
    const seats = searchParams.get('seats');
    const total = searchParams.get('total');
    const bookingId = searchParams.get('bookingId');
    const movieTitle = searchParams.get('movieTitle');
    const theaterName = searchParams.get('theaterName');
    const theaterAddress = searchParams.get('theaterAddress');
    const showTime = searchParams.get('showTime');
    const [pdfLoading, setPdfLoading] = useState(false);

    const seatsArray = useMemo(() => {
        if (!seats) return [];
        return seats.split(',').filter(Boolean);
    }, [seats]);

    const booking = useMemo(() => ({
        bookingId: bookingId || 'N/A',
        movieTitle: movieTitle || 'N/A',
        theaterName: theaterName || 'N/A',
        theaterAddress: theaterAddress || 'N/A',
        showTime: showTime || 'N/A',
        seats: seats || 'N/A',
        totalAmount: total || '0',
    }), [bookingId, movieTitle, theaterName, theaterAddress, showTime, seats, total]);

    const downloadTicketPDF = async () => {
        setPdfLoading(true);
        try {
            const doc = new jsPDF();

            doc.setFontSize(20);
            doc.setTextColor(194, 24, 7);
            doc.text('Watch Your Show', 20, 20);

            doc.setFontSize(14);
            doc.setTextColor(0, 0, 0);
            doc.text(`Movie: ${booking.movieTitle}`, 20, 40);
            doc.text(`Theater: ${booking.theaterName}`, 20, 50);
            doc.text(`Address: ${booking.theaterAddress}`, 20, 60);
            doc.text(`Show Time: ${booking.showTime}`, 20, 70);
            doc.text(`Seats: ${booking.seats}`, 20, 80);
            doc.text(`Total Paid: ₹${booking.totalAmount}`, 20, 90);
            doc.text(`Booking ID: ${booking.bookingId}`, 20, 100);

            const qrDataUrl = await QRCode.toDataURL(`Booking:${booking.bookingId}`);
            doc.addImage(qrDataUrl, 'PNG', 20, 110, 50, 50);

            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            doc.text('Please arrive 15 minutes before showtime.', 20, 170);

            doc.save(`ticket-${booking.bookingId}.pdf`);
        } catch (err) {
            console.error('PDF generation failed:', err);
        } finally {
            setPdfLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 animate-fade-in">
            <div className="max-w-2xl mx-auto card p-4 sm:p-8 text-center">
                <div className="success-checkmark mx-auto mb-6">
                    <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                    </svg>
                </div>

                <h1 className="section-title mb-2">{t('bookingConfirmed')}</h1>
                <p className="text-gray-600 dark:text-gray-400 mb-8">{t('ticketsBooked')}</p>

                <div className="bg-gradient-to-br from-gray-50 dark:from-gray-700 to-white dark:to-gray-800 rounded-xl p-6 mb-8 text-left border border-gray-100 dark:border-gray-600">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Movie</span>
                            <span className="text-gray-900 dark:text-white font-medium">{booking.movieTitle}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Theater</span>
                            <span className="text-gray-900 dark:text-white font-medium">{booking.theaterName}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Show Time</span>
                            <span className="text-gray-900 dark:text-white font-medium">{booking.showTime}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Seats</span>
                            <span className="text-gray-900 dark:text-white font-medium">{seatsArray.join(', ')}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Total Paid</span>
                            <span className="text-gray-900 dark:text-white font-medium">₹{total}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Booking ID</span>
                            <span className="text-gray-900 dark:text-white font-medium font-mono text-xs">{booking.bookingId}</span>
                        </div>
                    </div>
                </div>

                <div className="qr-placeholder dark:bg-gradient-to-br dark:from-gray-700 dark:to-gray-800 dark:border-gray-600 inline-block mb-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 font-medium">Mock QR Code</p>
                    <div className="w-40 h-40 bg-gray-100 dark:bg-gray-600 rounded-xl flex items-center justify-center">
                        <div className="w-32 h-32 bg-gray-300 dark:bg-gray-500 rounded-lg grid grid-cols-5 gap-1 p-2">
                            {Array.from({ length: 50 }).map((_, i) => (
                                <div key={i} className={`rounded-sm ${Math.random() > 0.5 ? 'bg-gray-700 dark:bg-gray-900' : 'bg-white dark:bg-gray-300'}`}></div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button
                        onClick={downloadTicketPDF}
                        disabled={pdfLoading}
                        className="btn-primary inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {pdfLoading ? (
                            <>
                                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                </svg>
                                Generating...
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                </svg>
                                {t('downloadTicket')}
                            </>
                        )}
                    </button>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold px-6 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 hover:border-[#C21807] hover:text-[#C21807] transition-all duration-200"
                    >
                        Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}