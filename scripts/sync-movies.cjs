// scripts/sync-movies.js
// This script fetches upcoming/now-playing Tamil movies from TMDB
// and inserts/updates them in the Supabase "movies" table.
// Run manually with: node scripts/sync-movies.cjs
// (Later this can be automated with a cron job / scheduled task)

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchTamilMovies(endpoint) {
    const url = `https://api.themoviedb.org/3/movie/${endpoint}?api_key=${TMDB_API_KEY}&region=IN&with_original_language=ta&language=en-US`;
    const res = await fetch(url);
    const data = await res.json();
    return data.results || [];
}

async function fetchMovieDetails(movieId) {
    const url = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${TMDB_API_KEY}&language=en-US`;
    const res = await fetch(url);
    return await res.json();
}

async function fetchMovieCredits(movieId) {
    const url = `https://api.themoviedb.org/3/movie/${movieId}/credits?api_key=${TMDB_API_KEY}`;
    const res = await fetch(url);
    return await res.json();
}

async function fetchMovieReleaseDates(movieId) {
    const url = `https://api.themoviedb.org/3/movie/${movieId}/release_dates?api_key=${TMDB_API_KEY}`;
    const res = await fetch(url);
    return await res.json();
}

async function fetchMovieTrailer(movieId) {
    const url = `https://api.themoviedb.org/3/movie/${movieId}/videos?api_key=${TMDB_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    const videos = data.results || [];
    const trailer = videos.find(v => v.type === 'Trailer' && v.site === 'YouTube');
    return trailer ? trailer.key : null;
}

async function syncMovies() {
    console.log('Fetching Tamil movies from TMDB...');

    const nowPlaying = await fetchTamilMovies('now_playing');
    const upcoming = await fetchTamilMovies('upcoming');

    const allMovies = [...nowPlaying, ...upcoming].filter(
        (m) => m.original_language === 'ta'
    );

    console.log(`Found ${allMovies.length} Tamil movies.`);

    if (allMovies.length === 0) {
        console.log('No Tamil movies found in now_playing/upcoming. Trying discover endpoint...');
        const discoverUrl = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&with_original_language=ta&sort_by=release_date.desc&region=IN`;
        const res = await fetch(discoverUrl);
        const data = await res.json();
        allMovies.push(...(data.results || []));
    }

    let inserted = 0;
    let updated = 0;
    let totalShowsCreated = 0;

    // Cache all theater IDs once for show creation
    let allTheaterIds = [];
    try {
        const { data: theaters } = await supabase.from('theaters').select('id');
        allTheaterIds = (theaters || []).map(t => t.id);
    } catch (err) {
        console.warn('Warning: Could not fetch theaters for show creation:', err.message);
    }

    const showTimes = ['10:00 AM', '1:00 PM', '4:00 PM', '7:00 PM', '9:30 PM'];

    for (const movie of allMovies) {
        const posterUrl = movie.poster_path
            ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
            : null;

        let description = null;
        let runtime = null;
        let director = null;
        let castNames = null;
        let certificate = 'UA';

        try {
            const details = await fetchMovieDetails(movie.id);
            description = details.overview || null;
            runtime = details.runtime || null;
        } catch (err) {
            console.warn(`Warning: Failed to fetch details for movie ${movie.id} (${movie.title}):`, err.message);
        }

        await sleep(250);

        try {
            const credits = await fetchMovieCredits(movie.id);
            const directors = (credits.crew || [])
                .filter(person => person.job === 'Director')
                .map(person => person.name);
            director = directors.length > 0 ? directors.join(', ') : null;
            const topCast = (credits.cast || []).slice(0, 4).map(person => person.name);
            castNames = topCast.length > 0 ? topCast.join(', ') : null;
        } catch (err) {
            console.warn(`Warning: Failed to fetch credits for movie ${movie.id} (${movie.title}):`, err.message);
        }

        await sleep(250);

        try {
            const releaseDates = await fetchMovieReleaseDates(movie.id);
            const indiaResult = (releaseDates.results || []).find(r => r.iso_3166_1 === 'IN');
            if (indiaResult && indiaResult.release_dates) {
                const certEntry = indiaResult.release_dates.find(rd => rd.certification && rd.certification.trim() !== '');
                if (certEntry) {
                    certificate = certEntry.certification;
                }
            }
        } catch (err) {
            console.warn(`Warning: Failed to fetch release dates for movie ${movie.id} (${movie.title}):`, err.message);
        }

        await sleep(250);

        let trailerKey = null;
        try {
            trailerKey = await fetchMovieTrailer(movie.id);
        } catch (err) {
            console.warn(`Warning: Failed to fetch trailer for movie ${movie.id} (${movie.title}):`, err.message);
        }

        await sleep(250);

        const { data: existing } = await supabase
            .from('movies')
            .select('id')
            .eq('tmdb_id', movie.id)
            .single();

        if (existing) {
            await supabase
                .from('movies')
                .update({
                    title: movie.title,
                    poster_url: posterUrl,
                    release_date: movie.release_date || null,
                    description: description,
                    runtime: runtime,
                    director: director,
                    cast_names: castNames,
                    certificate: certificate,
                    trailer_key: trailerKey,
                    synced_at: new Date().toISOString(),
                })
                .eq('tmdb_id', movie.id);
            updated++;
        } else {
            const { data: insertedMovie, error: insertError } = await supabase
                .from('movies')
                .insert({
                    title: movie.title,
                    language: 'Tamil',
                    poster_url: posterUrl,
                    tmdb_id: movie.id,
                    release_date: movie.release_date || null,
                    description: description,
                    runtime: runtime,
                    director: director,
                    cast_names: castNames,
                    certificate: certificate,
                    trailer_key: trailerKey,
                })
                .select('id')
                .single();

            if (insertError) {
                console.warn(`Warning: Failed to insert movie ${movie.title}:`, insertError.message);
                continue;
            }

            inserted++;

            // Auto-create shows for this new movie across all theaters
            if (allTheaterIds.length > 0 && insertedMovie) {
                let showsCreated = 0;
                const showRows = allTheaterIds.map(theaterId => ({
                    theater_id: theaterId,
                    movie_id: insertedMovie.id,
                    show_time: showTimes[Math.floor(Math.random() * showTimes.length)],
                    price: Math.floor(Math.random() * 151) + 150, // 150 to 300
                }));

                // Insert in batches of 50 to avoid request size limits
                for (let i = 0; i < showRows.length; i += 50) {
                    try {
                        const batch = showRows.slice(i, i + 50);
                        const { error: showError } = await supabase.from('shows').insert(batch);
                        if (showError) {
                            console.warn(`Warning: Failed to create shows batch for ${movie.title}:`, showError.message);
                        } else {
                            showsCreated += batch.length;
                        }
                    } catch (err) {
                        console.warn(`Warning: Error creating shows batch for ${movie.title}:`, err.message);
                    }
                }

                totalShowsCreated += showsCreated;
                console.log(`Created ${showsCreated} shows for ${movie.title}`);
            }
        }
    }

    console.log(`Sync complete. Inserted: ${inserted}, Updated: ${updated}, Shows created: ${totalShowsCreated}`);
}

syncMovies().catch((err) => {
    console.error('Sync failed:', err);
    process.exit(1);
});