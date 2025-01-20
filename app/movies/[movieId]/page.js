'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getMovieDetails } from '../../../data/mock';
import { getMovieReviews } from '../../../data/db';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';

function formatRelativeDate(dateStr) {
    if (!dateStr) return '';
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
}

function StarRating({ rating, interactive, onChange, size }) {
    const starSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map(star => (
                <button
                    key={star}
                    type="button"
                    disabled={!interactive}
                    onClick={() => interactive && onChange?.(star)}
                    className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform duration-150`}
                >
                    <svg className={`${starSize} ${star <= rating ? 'text-[#C21807]' : 'text-gray-300 dark:text-gray-600'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                </button>
            ))}
        </div>
    );
}

export default function MovieDetailPage() {
    const params = useParams();
    const { user } = useAuth();
    const { t, language } = useLanguage();
    const movieId = params.movieId;
    const [movie, setMovie] = useState(null);
    const [showtimes, setShowtimes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showTrailer, setShowTrailer] = useState(false);
    const [showReviews, setShowReviews] = useState(false);
    const [copied, setCopied] = useState(false);

    // Reviews state
    const [reviews, setReviews] = useState([]);
    const [reviewsLoading, setReviewsLoading] = useState(true);
    const [userRating, setUserRating] = useState(0);
    const [userComment, setUserComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [editingReview, setEditingReview] = useState(null);

    const fetchReviews = useCallback(async () => {
        setReviewsLoading(true);
        const data = await getMovieReviews(movieId);
        setReviews(data);
        setReviewsLoading(false);

        // Check if current user already has a review
        if (user) {
            const existing = data.find(r => r.user_email === user.email);
            if (existing) {
                setEditingReview(existing);
                setUserRating(existing.rating);
                setUserComment(existing.comment || '');
            } else {
                setEditingReview(null);
                setUserRating(0);
                setUserComment('');
            }
        }
    }, [movieId, user]);

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
        fetchReviews();
    }, [movieId, fetchReviews]);

    const avgRating = reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : null;

    const handleSubmitReview = async () => {
        if (!user || userRating === 0) return;
        setSubmitting(true);
        setSubmitError('');

        if (editingReview) {
            // Update existing review
            const { error } = await supabase
                .from('reviews')
                .update({ rating: userRating, comment: userComment || null })
                .eq('id', editingReview.id);

            if (error) {
                setSubmitError('Failed to update review. Please try again.');
                setSubmitting(false);
                return;
            }
        } else {
            // Insert new review
            const { error } = await supabase
                .from('reviews')
                .insert({
                    movie_id: Number(movieId),
                    user_email: user.email,
                    user_name: user.name || null,
                    rating: userRating,
                    comment: userComment || null,
                });

            if (error) {
                // If unique constraint violation, update instead
                if (error.code === '23505') {
                    const { error: updateError } = await supabase
                        .from('reviews')
                        .update({ rating: userRating, comment: userComment || null })
                        .eq('movie_id', Number(movieId))
                        .eq('user_email', user.email);

                    if (updateError) {
                        setSubmitError('Failed to update review. Please try again.');
                        setSubmitting(false);
                        return;
                    }
                } else {
                    setSubmitError('Failed to submit review. Please try again.');
                    setSubmitting(false);
                    return;
                }
            }
        }

        setSubmitting(false);
        await fetchReviews();
    };

    const handleCancelEdit = () => {
        setEditingReview(null);
        setUserRating(0);
        setUserComment('');
        setSubmitError('');
    };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="text-center py-20">
                    <p className="text-gray-600 dark:text-gray-400 text-lg">Loading movie details...</p>
                </div>
            </div>
        );
    }

    if (!movie) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="text-center py-20">
                    <p className="text-gray-600 dark:text-gray-400 text-lg">Movie not found.</p>
                    <Link href="/movies" className="text-[#C21807] dark:text-[#FF6B6B] font-semibold mt-4 inline-block hover:underline">Browse Movies</Link>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 animate-fade-in">
            <div className="mb-6 sm:mb-8">
                <div className="breadcrumb mb-4">
                    <Link href="/">Home</Link>
                    <span>/</span>
                    <Link href="/movies" className="hover:text-[#C21807]">Movies</Link>
                    <span>/</span>
                    <span className="text-gray-700 dark:text-gray-300 font-medium">{movie.title}</span>
                </div>
            </div>

            <div className="card p-4 sm:p-6 mb-8 sm:mb-10 overflow-hidden">
                <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
                    {movie.poster_url ? (
                        <div className="w-full sm:w-56 md:w-72 flex-shrink-0">
                            <img
                                src={movie.poster_url}
                                alt={movie.title}
                                className="w-full rounded-xl shadow-lg"
                            />
                        </div>
                    ) : (
                        <div className="w-full sm:w-56 md:w-72 flex-shrink-0 aspect-[2/3] bg-gray-200 dark:bg-gray-700 rounded-xl shadow-lg flex flex-col items-center justify-center gap-3">
                            <span className="text-5xl">🎬</span>
                            <span className="text-sm text-gray-500 dark:text-gray-300 font-medium">Poster Coming Soon</span>
                        </div>
                    )}
                    <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">{movie.title}</h1>
                            {movie.trailer_key && (
                                <button
                                    onClick={() => setShowTrailer(true)}
                                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-[#C21807] hover:bg-[#a01406] rounded-full transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M8 5v14l11-7z" />
                                    </svg>
                                    Watch Trailer
                                </button>
                            )}
                            <button
                                onClick={async () => {
                                    if (navigator.share) {
                                        await navigator.share({ title: movie.title, text: `Check out ${movie.title} on Watch Your Show!`, url: window.location.href });
                                    } else {
                                        await navigator.clipboard.writeText(window.location.href);
                                        setCopied(true);
                                        setTimeout(() => setCopied(false), 2000);
                                    }
                                }}
                                className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                                title="Share"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                </svg>
                                {copied ? 'Link copied!' : 'Share'}
                            </button>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                            {movie.language && (
                                <span className="text-sm font-medium text-[#C21807] dark:text-[#FF6B6B] bg-red-50 dark:bg-red-900/30 px-3 py-1 rounded-full">
                                    {movie.language}
                                </span>
                            )}
                            {movie.certificate && (
                                <span className="text-sm font-medium text-white bg-gray-700 dark:bg-gray-600 px-3 py-1 rounded-full">
                                    {movie.certificate}
                                </span>
                            )}
                            <button
                                onClick={() => setShowReviews(prev => !prev)}
                                className={`inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full border-2 transition-all duration-200 ${showReviews
                                    ? 'bg-[#C21807] text-white border-[#C21807]'
                                    : 'text-[#C21807] dark:text-[#FF6B6B] bg-red-50 dark:bg-red-900/30 border-transparent hover:border-[#C21807]'
                                    }`}
                            >
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                {avgRating ? `${avgRating} Reviews & Ratings` : 'Reviews & Ratings'}
                                <span className={`transition-transform duration-200 ${showReviews ? 'rotate-180' : ''}`}>▼</span>
                            </button>
                        </div>
                        <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                            {movie.runtime != null && (
                                <p>
                                    <span className="font-semibold text-gray-900 dark:text-white">Runtime:</span>{' '}
                                    {Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m
                                </p>
                            )}
                            {movie.director && (
                                <p>
                                    <span className="font-semibold text-gray-900 dark:text-white">Director:</span> {movie.director}
                                </p>
                            )}
                            {movie.cast_names && (
                                <p>
                                    <span className="font-semibold text-gray-900 dark:text-white">Cast:</span> {movie.cast_names}
                                </p>
                            )}
                        </div>
                        {movie.description && (
                            <p className="mt-4 text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-4">
                                {language === 'ta' && movie.description_ta
                                    ? movie.description_ta
                                    : movie.description}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Expandable Reviews Panel */}
            {showReviews && (
                <div className="card p-6 mb-8 sm:mb-10 animate-fade-in">
                    {/* Average Rating Header */}
                    <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                        {reviewsLoading ? (
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Loading reviews...</p>
                        ) : avgRating ? (
                            <>
                                <div className="text-4xl font-bold text-gray-900 dark:text-white">{avgRating}</div>
                                <div>
                                    <StarRating rating={Math.round(Number(avgRating))} size="sm" />
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                                    </p>
                                </div>
                            </>
                        ) : (
                            <p className="text-gray-500 dark:text-gray-400 text-sm">No ratings yet</p>
                        )}
                    </div>

                    {/* Write a Review Form (only if logged in) */}
                    {user && (
                        <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                                {editingReview ? 'Your Review' : 'Write a Review'}
                            </h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Rating</label>
                                    <StarRating
                                        rating={userRating}
                                        interactive={true}
                                        onChange={setUserRating}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Comment (optional)</label>
                                    <textarea
                                        value={userComment}
                                        onChange={(e) => setUserComment(e.target.value)}
                                        placeholder="Share your thoughts about this movie..."
                                        rows={3}
                                        className="input-field resize-none"
                                    />
                                </div>
                                {submitError && (
                                    <p className="text-red-600 dark:text-red-400 text-sm">{submitError}</p>
                                )}
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={handleSubmitReview}
                                        disabled={submitting || userRating === 0}
                                        className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {submitting ? 'Submitting...' : editingReview ? 'Update Review' : 'Submit Review'}
                                    </button>
                                    {editingReview && (
                                        <button
                                            onClick={handleCancelEdit}
                                            className="text-sm text-gray-600 dark:text-gray-400 hover:text-[#C21807] font-semibold transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Individual Reviews List */}
                    {reviewsLoading ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500 dark:text-gray-400">Loading reviews...</p>
                        </div>
                    ) : reviews.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500 dark:text-gray-400">
                                {user ? 'Be the first to review this movie!' : 'No reviews yet. Log in to leave a review.'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {reviews.map(review => (
                                <div
                                    key={review.id}
                                    className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-100 dark:border-gray-700"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-gray-900 dark:text-white text-sm">
                                                {review.user_name || 'Anonymous'}
                                            </span>
                                            <span className="text-xs text-gray-400 dark:text-gray-500">
                                                {formatRelativeDate(review.created_at)}
                                            </span>
                                        </div>
                                        <StarRating rating={review.rating} size="sm" />
                                    </div>
                                    {review.comment && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                            {review.comment}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Trailer Modal */}
            {showTrailer && movie.trailer_key && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setShowTrailer(false)}>
                    <div className="relative w-full max-w-4xl bg-black rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => setShowTrailer(false)}
                            className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <div className="aspect-video">
                            <iframe
                                src={`https://www.youtube.com/embed/${movie.trailer_key}?autoplay=1`}
                                title="Trailer"
                                className="w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                    </div>
                </div>
            )}

            {showtimes.length === 0 ? (
                <div className="error-state dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900 dark:border-gray-700">
                    <p className="text-gray-600 dark:text-gray-400 text-lg">No shows currently scheduled for this movie.</p>
                    <Link href="/movies" className="text-[#C21807] dark:text-[#FF6B6B] font-semibold mt-4 inline-block hover:underline">Browse other movies</Link>
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
                                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{show.theater_name}</h3>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-2">
                                                        <svg className="w-4 h-4 text-[#C21807] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                                        </svg>
                                                        {show.theater_address}
                                                    </p>
                                                    <div className="flex items-center gap-4 mt-2">
                                                        <span className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                                                            <svg className="w-4 h-4 text-[#C21807]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                                            </svg>
                                                            {show.show_time}
                                                        </span>
                                                        <span className="text-sm font-semibold text-[#C21807]">₹{show.price}</span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-2">
                                                    <span className={`text-sm font-medium ${isSoldOut ? 'text-red-600 dark:text-red-400' : seatsLeft <= 10 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}`}>
                                                        {isSoldOut ? '80/80 seats booked' : `${show.seats_booked}/80 seats booked`}
                                                    </span>
                                                    {isSoldOut ? (
                                                        <span className="bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-xs font-bold px-3 py-1.5 rounded-full">
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