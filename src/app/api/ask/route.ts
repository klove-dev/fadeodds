import { supabaseAdmin } from '@/lib/supabase';

const ALL_SPORTS = [
    'basketball_nba',
    'basketball_ncaab',
    'americanfootball_nfl',
    'icehockey_nhl',
    'baseball_mlb',
] as const;

export async function POST(request: Request) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        return Response.json({ error: 'AI not configured' }, { status: 500 });
    }

    let query: string;
    try {
        const body = await request.json();
        query = (body.query || '').trim();
    } catch {
        return Response.json({ error: 'Invalid request' }, { status: 400 });
    }

    if (!query) {
        return Response.json({ error: 'Missing query' }, { status: 400 });
    }

    // Pull all cached odds from Supabase — no Odds API credits consumed
    const { data: caches } = await supabaseAdmin
        .from('odds_cache')
        .select('sport, data')
        .in('sport', ALL_SPORTS);

    const gameSummaries: object[] = [];

    for (const cache of caches || []) {
        if (!Array.isArray(cache.data)) continue;

        for (const game of cache.data) {
            // Use the bookmaker with the most markets (typically the first with all three)
            const bm = (game.bookmakers || []).find(
                (b: any) => b.markets?.length >= 3
            ) || game.bookmakers?.[0];

            const h2h = bm?.markets?.find((m: any) => m.key === 'h2h');
            const spreads = bm?.markets?.find((m: any) => m.key === 'spreads');
            const totals = bm?.markets?.find((m: any) => m.key === 'totals');

            const awayH2H = h2h?.outcomes?.find((o: any) => o.name === game.away_team)?.price ?? null;
            const homeH2H = h2h?.outcomes?.find((o: any) => o.name === game.home_team)?.price ?? null;
            const awaySpread = spreads?.outcomes?.find((o: any) => o.name === game.away_team);
            const homeSpread = spreads?.outcomes?.find((o: any) => o.name === game.home_team);
            const overLine = totals?.outcomes?.find((o: any) => o.name === 'Over');

            gameSummaries.push({
                id: game.id,
                sport: game.sport_title,
                sportKey: cache.sport,
                away: game.away_team,
                home: game.home_team,
                time: game.commence_time,
                h2h: { away: awayH2H, home: homeH2H },
                spread: {
                    away: awaySpread ? { pts: awaySpread.point, price: awaySpread.price } : null,
                    home: homeSpread ? { pts: homeSpread.point, price: homeSpread.price } : null,
                },
                ou: overLine ? { line: overLine.point, price: overLine.price } : null,
            });
        }
    }

    if (gameSummaries.length === 0) {
        return Response.json({
            text: "I don't have live game data loaded right now. Refresh the page and try again.",
        });
    }

    const systemPrompt = `You are FadeOdds AI, a Market Insights assistant with access to real-time odds for all upcoming games across NBA, NCAAB, NFL, NHL, and MLB.

You are scoped to the following supported questions only:
1. What team is the biggest underdog today?
2. What team has the highest implied win probability today?
3. What game has the closest odds today?
4. What game has the largest spread today?
5. What team has the best moneyline price available right now?
6. What game has the highest total today?
7. What game has the lowest total today?
8. Which underdog has the best payout today?

For implied probability calculations, convert American odds as follows:
- Positive odds (e.g. +240): implied probability = 100 / (odds + 100)
- Negative odds (e.g. -150): implied probability = (-odds) / ((-odds) + 100)

If the user asks about anything outside of these supported Market Insights questions — including betting splits, line movement, player props, or sportsbook promotions — respond clearly that this feature is not supported yet, and suggest one of the supported questions above.

Answer the user's question directly and confidently in 1–3 sentences. Reference specific games using EXACTLY this format:
[[GAME:GAMEID:SPORTKEY|Away Team @ Home Team]]

Where GAMEID = the game's id field, SPORTKEY = the game's sportKey field, and the label is "Away @ Home".

Rules:
- Only link games directly relevant to the answer
- Use American odds format (+240, -110, etc.)
- Be sharp and concise — no filler
- If multiple games qualify, highlight the top 1–2
- Never fabricate odds; only use what's in the data`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
        },
        body: JSON.stringify({
            model: 'claude-sonnet-4-6',
            max_tokens: 400,
            system: systemPrompt,
            messages: [
                {
                    role: 'user',
                    content: `Games:\n${JSON.stringify(gameSummaries)}\n\nQuestion: ${query}`,
                },
            ],
        }),
    });

    if (!response.ok) {
        const err = await response.json();
        return Response.json({ error: 'Claude API error: ' + JSON.stringify(err) }, { status: response.status });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text ?? '';
    return Response.json({ text });
}
