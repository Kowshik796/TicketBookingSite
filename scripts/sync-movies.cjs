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

async function fetchTamilMovies(endpoint) {
    const url = `https://api.themoviedb.org/3/movie/${endpoint}?api_key=${TMDB_API_KEY}&region=IN&with_original_language=ta&language=en-US`;
    const res = await fetch(url);
    const data = await res.json();
    return data.results || [];
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