import { supabase } from '../lib/supabase';

export async function getMovieReviews(movieId) {
    try {
        const { data, error } = await supabase
            .from('reviews')
            .select('*')
            .eq('movie_id', Number(movieId))
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching reviews:', error);
            return [];
        }
        return data || [];
    } catch (err) {
        console.error('Error fetching reviews:', err);
        return [];
    }
}

export async function getTheaterAnalytics(theaterId) {
    try {
        const { data: shows, error: showsError } = await supabase
            .from('shows')
            .select('id, movie_id, show_time, price, movies (title)')
            .eq('theater_id', Number(theaterId));

        if (showsError || !shows) {
            console.error('Error fetching shows for analytics:', showsError);
            return null;
        }

        let totalBookings = 0;
        let totalRevenue = 0;
        let totalSeatsSold = 0;
        const movieMap = new Map();

        for (const show of shows) {
            const { data: bookings, error: bookingsError } = await supabase
                .from('bookings')
                .select('seats, total_amount')
                .eq('show_id', show.id);

            if (bookingsError) {
                console.error('Error fetching bookings for show:', bookingsError);
                continue;
            }

            const seatsSold = (bookings || [])
                .map(b => (b.seats || '').split(',').map(s => s.trim()).filter(Boolean))
                .flat().length;
            const revenue = (bookings || []).reduce((sum, b) => sum + Number(b.total_amount || 0), 0);
            const bookingCount = (bookings || []).length;

            totalBookings += bookingCount;
            totalRevenue += revenue;
            totalSeatsSold += seatsSold;

            const title = show.movies?.title || 'Unknown Movie';
            const existing = movieMap.get(title) || { movie_title: title, shows_count: 0, seats_sold: 0, revenue: 0 };
            existing.shows_count += 1;
            existing.seats_sold += seatsSold;
            existing.revenue += revenue;
            movieMap.set(title, existing);
        }

        const perMovie = Array.from(movieMap.values()).sort((a, b) => b.revenue - a.revenue);

        return {
            totalBookings,
            totalRevenue,
            totalSeatsSold,
            perMovie,
        };
    } catch (err) {
        console.error('Error computing theater analytics:', err);
        return null;
    }
}
