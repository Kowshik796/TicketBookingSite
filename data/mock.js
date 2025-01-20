import { supabase } from '../lib/supabase';

export const districts = [
    { id: 1, name: "Ariyalur" },
    { id: 2, name: "Chengalpattu" },
    { id: 3, name: "Chennai" },
    { id: 4, name: "Coimbatore" },
    { id: 5, name: "Cuddalore" },
    { id: 6, name: "Dharmapuri" },
    { id: 7, name: "Dindigul" },
    { id: 8, name: "Erode" },
    { id: 9, name: "Kallakurichi" },
    { id: 10, name: "Kanchipuram" },
    { id: 11, name: "Kanyakumari" },
    { id: 12, name: "Karur" },
    { id: 13, name: "Krishnagiri" },
    { id: 14, name: "Madurai" },
    { id: 15, name: "Mayiladuthurai" },
    { id: 16, name: "Nagapattinam" },
    { id: 17, name: "Namakkal" },
    { id: 18, name: "Nilgiris" },
    { id: 19, name: "Perambalur" },
    { id: 20, name: "Pudukkottai" },
    { id: 21, name: "Ramanathapuram" },
    { id: 22, name: "Ranipet" },
    { id: 23, name: "Salem" },
    { id: 24, name: "Sivaganga" },
    { id: 25, name: "Tenkasi" },
    { id: 26, name: "Thanjavur" },
    { id: 27, name: "Theni" },
    { id: 28, name: "Thoothukudi" },
    { id: 29, name: "Tiruchirappalli" },
    { id: 30, name: "Tirunelveli" },
    { id: 31, name: "Tirupathur" },
    { id: 32, name: "Tiruppur" },
    { id: 33, name: "Tiruvallur" },
    { id: 34, name: "Tiruvannamalai" },
    { id: 35, name: "Tiruvarur" },
    { id: 36, name: "Vellore" },
    { id: 37, name: "Viluppuram" },
    { id: 38, name: "Virudhunagar" },
];

export async function getDistricts() {
    try {
        const { data, error } = await supabase
            .from('districts')
            .select('*')
            .order('name', { ascending: true });

        if (error) {
            console.error('Error fetching districts:', error);
            return [];
        }
        return data || [];
    } catch (err) {
        console.error('Error fetching districts:', err);
        return [];
    }
}

export async function getTheatersByDistrict(districtId) {
    try {
        const { data, error } = await supabase
            .from('theaters')
            .select('*')
            .eq('district_id', Number(districtId));

        if (error) {
            console.error('Error fetching theaters:', error);
            return [];
        }
        return data || [];
    } catch (err) {
        console.error('Error fetching theaters:', err);
        return [];
    }
}

export async function getShowsByTheater(theaterId) {
    try {
        const { data, error } = await supabase
            .from('shows')
            .select('id, theater_id, show_time, price, movies(title, poster_url, language), theaters(name, address)')
            .eq('theater_id', Number(theaterId));

        if (error) {
            console.error('Error fetching shows:', error);
            return [];
        }

        return (data || []).map((show) => {
            const movie = show.movies || {};
            const theater = show.theaters || {};
            return {
                id: show.id,
                movie_title: movie.title || 'Unknown',
                poster: movie.poster_url || '',
                language: movie.language || '',
                theater_name: theater.name || '',
                address: theater.address || '',
                show_time: show.show_time,
                price: show.price,
            };
        });
    } catch (err) {
        console.error('Error fetching shows:', err);
        return [];
    }
}

export async function getShowById(showId) {
    try {
        const { data, error } = await supabase
            .from('shows')
            .select('id, theater_id, show_time, price, movies(title, poster_url, language), theaters(name, address)')
            .eq('id', Number(showId))
            .single();

        if (error) {
            console.error('Error fetching show:', error);
            return null;
        }
        if (!data) {
            return null;
        }

        const movie = data.movies || {};
        const theater = data.theaters || {};
        return {
            id: data.id,
            movie_title: movie.title || 'Unknown',
            poster: movie.poster_url || '',
            language: movie.language || '',
            theater_name: theater.name || '',
            address: theater.address || '',
            show_time: data.show_time,
            price: data.price,
        };
    } catch (err) {
        console.error('Error fetching show:', err);
        return null;
    }
}

export async function getAllMovies() {
    try {
        const { data, error } = await supabase
            .from('movies')
            .select('id, title, poster_url, language, release_date')
            .order('release_date', { ascending: false });

        if (error) {
            console.error('Error fetching all movies:', error);
            return [];
        }
        return data || [];
    } catch (err) {
        console.error('Error fetching all movies:', err);
        return [];
    }
}

export async function getMovieDetails(movieId) {
    try {
        let { data: movie, error: movieError } = await supabase
            .from('movies')
            .select('id, title, poster_url, language, description, director, cast_names, runtime, certificate, trailer_key')
            .eq('id', Number(movieId))
            .single();

        // If trailer_key column doesn't exist yet, retry without it
        if (movieError && movieError.message && movieError.message.includes('trailer_key')) {
            console.warn('trailer_key column not found, querying without it.');
            const retry = await supabase
                .from('movies')
                .select('id, title, poster_url, language, description, director, cast_names, runtime, certificate')
                .eq('id', Number(movieId))
                .single();
            movie = retry.data;
            movieError = retry.error;
        }

        if (movieError || !movie) {
            console.error('Error fetching movie:', movieError?.message || movieError || 'Unknown error');
            return null;
        }

        const { data: shows, error: showsError } = await supabase
            .from('shows')
            .select('*, theaters(*, districts(*))')
            .eq('movie_id', Number(movieId));

        if (showsError) {
            console.error('Error fetching shows:', showsError);
            return { movie, showtimes: [] };
        }

        const showtimes = await Promise.all((shows || []).map(async (show) => {
            const theater = show.theaters || {};
            const district = theater.districts || {};

            let seatsBooked = 0;
            try {
                const { data: bookings, error: bookingsError } = await supabase
                    .from('bookings')
                    .select('seats')
                    .eq('show_id', show.id);

                if (!bookingsError && bookings) {
                    seatsBooked = bookings.reduce((sum, b) => {
                        return sum + (b.seats ? b.seats.split(',').filter(s => s.trim()).length : 0);
                    }, 0);
                }
            } catch (err) {
                console.error('Error fetching bookings for show', show.id, err);
            }

            return {
                show_id: show.id,
                theater_name: theater.name || 'Unknown',
                theater_address: theater.address || '',
                district_name: district.name || 'Unknown',
                show_time: show.show_time,
                price: show.price,
                seats_booked: seatsBooked,
                seats_total: 80,
            };
        }));

        return { movie, showtimes };
    } catch (err) {
        console.error('Error fetching movie details:', err);
        return null;
    }
}

export async function getMoviesByDistrict(districtId) {
    try {
        const theaters = await getTheatersByDistrict(districtId);
        const theaterIds = theaters.map(t => t.id);

        if (theaterIds.length === 0) {
            return [];
        }

        const { data: shows, error } = await supabase
            .from('shows')
            .select('id, theater_id, show_time, price, movies(title, poster_url, language), theaters(name)')
            .in('theater_id', theaterIds);

        if (error) {
            console.error('Error fetching movies by district:', error);
            return [];
        }

        const movieMap = new Map();
        shows.forEach(show => {
            const movieTitle = show.movies?.title || 'Unknown';
            if (!movieMap.has(movieTitle)) {
                movieMap.set(movieTitle, {
                    title: movieTitle,
                    poster: show.movies?.poster_url || '',
                    language: show.movies?.language || '',
                    shows: [],
                });
            }
            movieMap.get(movieTitle).shows.push({
                show_id: show.id,
                theater_name: show.theaters?.name || '',
                show_time: show.show_time,
                price: show.price,
            });
        });

        return Array.from(movieMap.values());
    } catch (err) {
        console.error('Error fetching movies by district:', err);
        return [];
    }
}