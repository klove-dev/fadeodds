import { supabaseAdmin } from '@/lib/supabase';

const CACHE_TTL_HOURS = 0.5;

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const sport = searchParams.get('sport') || 'basketball_nba';
    const apiKey = process.env.ODDS_API_KEY;

    if (!apiKey) {
        return Response.json({ error: 'ODDS_API_KEY not configured' }, { status: 500 });
    }

    // Check Supabase cache first
    const { data: cached } = await supabaseAdmin
        .from('odds_cache')
        .select('data, cached_at')
        .eq('sport', sport)
        .single();

    if (cached) {
        const cachedAt = new Date(cached.cached_at).getTime();
        const ageHours = (Date.now() - cachedAt) / (1000 * 60 * 60);
        if (ageHours < CACHE_TTL_HOURS) {
            return Response.json(cached.data, {
                headers: {
                    'X-Requests-Remaining': 'cached',
                    'X-Cache': 'HIT',
                    'X-Cache-Age': `${Math.round(ageHours * 60)}m`
                }
            });
        }
    }

    // Cache miss - fetch from Odds API
    try {
        const url = `https://api.the-odds-api.com/v4/sports/${sport}/odds/?apiKey=${apiKey}&regions=us&markets=h2h,spreads,totals&oddsFormat=american&dateFormat=iso`;
        const response = await fetch(url);

        if (!response.ok) {
            // If API fails but we have stale cache, return it
            if (cached) {
                return Response.json(cached.data, {
                    headers: { 'X-Cache': 'STALE' }
                });
            }
            const text = await response.text();
            return Response.json({ error: `Odds API error: ${text}` }, { status: response.status });
        }

        const data = await response.json();
        const remaining = response.headers.get('x-requests-remaining') || 'unknown';

        // Upsert into Supabase cache
        await supabaseAdmin
            .from('odds_cache')
            .upsert(
                { sport, data, cached_at: new Date().toISOString() },
                { onConflict: 'sport' }
            );

        return Response.json(data, {
            headers: {
                'X-Requests-Remaining': remaining,
                'X-Cache': 'MISS'
            }
        });
    } catch (err) {
        // If fetch fails but we have stale cache, return it
        if (cached) {
            return Response.json(cached.data, {
                headers: { 'X-Cache': 'STALE' }
            });
        }
        const message = err instanceof Error ? err.message : 'Unknown error';
        return Response.json({ error: 'Failed to fetch odds: ' + message }, { status: 500 });
    }
}