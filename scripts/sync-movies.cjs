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
                    synced_at: new Date().toISOString(),
                })
                .eq('tmdb_id', movie.id);
            updated++;
        } else {
            await supabase.from('movies').insert({
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
            });
            inserted++;
        }
    }

    console.log(`Sync complete. Inserted: ${inserted}, Updated: ${updated}`);
}

syncMovies().catch((err) => {
    console.error('Sync failed:', err);
    process.exit(1);
});