export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const sport = searchParams.get('sport') || 'basketball_nba';
    const apiKey = process.env.ODDS_API_KEY;

    if (!apiKey) {
        return Response.json({ error: 'ODDS_API_KEY not configured' }, { status: 500 });
    }

    try {
        const url = `https://api.the-odds-api.com/v4/sports/${sport}/odds/?apiKey=${apiKey}&regions=us&markets=h2h,spreads,totals&oddsFormat=american&dateFormat=iso`;
        const response = await fetch(url);

        if (!response.ok) {
            const text = await response.text();
            return Response.json({ error: `Odds API error: ${text}` }, { status: response.status });
        }

        const data = await response.json();
        const remaining = response.headers.get('x-requests-remaining') || 'unknown';

        return Response.json(data, {
            headers: { 'X-Requests-Remaining': remaining }
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return Response.json({ error: 'Failed to fetch odds: ' + message }, { status: 500 });
    }
}