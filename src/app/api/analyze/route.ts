import { auth, currentUser } from '@clerk/nextjs/server';
import { getUserTier, getUsage, incrementUsage, syncUser } from '@/lib/user';
import { supabaseAdmin } from '@/lib/supabase';

const TIER_LIMITS: Record<string, { games: number; questions: number }> = {
    free:  { games: 0,        questions: 0 },
    go:    { games: 3,        questions: 10 },
    plus:  { games: 10,       questions: 100 },
    pro:   { games: Infinity, questions: 5000 },
};

async function getCachedAnalysis(gameId: string, state: string): Promise<any | null> {
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await supabaseAdmin
        .from('analysis_cache')
        .select('analysis')
        .eq('game_id', gameId)
        .eq('game_date', today)
        .eq('betting_state', state)
        .single();
    return data?.analysis || null;
}

async function cacheAnalysis(gameId: string, sport: string, state: string, analysis: any): Promise<void> {
    const today = new Date().toISOString().slice(0, 10);
    await supabaseAdmin
        .from('analysis_cache')
        .upsert(
            { game_id: gameId, sport, game_date: today, betting_state: state, analysis },
            { onConflict: 'game_id,game_date,betting_state' }
        );
}

export async function POST(request: Request) {
    const { userId } = await auth();

    if (!userId) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await currentUser();
    const email = user?.emailAddresses[0]?.emailAddress || '';
    await syncUser(userId, email);

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        return Response.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
    }

    let body: any;
    try {
        body = await request.json();
    } catch {
        return Response.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { game, oddsData, userQuery, injuryData, chatHistory, playerSplits, mode, gameId, bettingState } = body;
    const cacheState = bettingState || 'all';

    if (!game) {
        return Response.json({ error: 'Missing game data' }, { status: 400 });
    }

    // Tier enforcement
    const tier = await getUserTier(userId);
    const limits = TIER_LIMITS[tier] || TIER_LIMITS.free;
    const usage = await getUsage(userId);

    if (mode === 'initial') {
        if (limits.games === 0) {
            return Response.json({ error: 'Upgrade required', code: 'TIER_LOCKED' }, { status: 403 });
        }
        if (limits.games !== Infinity && usage.games >= limits.games) {
            return Response.json({ error: 'Daily analysis limit reached', code: 'LIMIT_REACHED' }, { status: 403 });
        }

        // Check analysis cache first
        if (gameId) {
            const cached = await getCachedAnalysis(gameId, cacheState);
            if (cached) return Response.json(cached);
        }
    }

    if (mode === 'chat') {
        if (limits.questions === 0) {
            return Response.json({ error: 'Upgrade required', code: 'TIER_LOCKED' }, { status: 403 });
        }
        if (limits.questions !== Infinity && usage.questions >= limits.questions) {
            return Response.json({ error: 'Daily question limit reached', code: 'LIMIT_REACHED' }, { status: 403 });
        }
    }

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'America/New_York' });

    const injuryContext = (injuryData && injuryData.length > 0)
        ? `\nINJURY REPORT (players with injury designations only — any player NOT listed is healthy and expected to play):\n${injuryData.map((i: any) => `  ${i.team} - ${i.player}: ${i.status}${i.injury ? ` — ${i.injury}` : ''}${i.returnDate ? ` (est. return ${i.returnDate})` : ''}`).join('\n')}`
        : '\nINJURY REPORT: No injury designations for this game — all players are expected to be available.';

    let systemPrompt: string;
    let userMessage: string;

    const splitsContext = playerSplits
        ? `\nPLAYER SPLITS (home vs away this season): ${playerSplits.player} (${playerSplits.team}) — Home: ${JSON.stringify(playerSplits.home)} | Away: ${JSON.stringify(playerSplits.away)}`
        : '';

    if (mode === 'chat') {
        systemPrompt = `You are a sharp sports betting analyst for FadeOdds.
        Today is ${today}. Game: ${game.away_team} @ ${game.home_team} (${game.sport_title}) at ${new Date(game.commence_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' })} ET.
        Real odds data from sportsbooks: ${JSON.stringify(oddsData)}.${injuryContext}${splitsContext}
        IMPORTANT: The injury report only lists players with active injury designations. If a player is NOT on the list, they are healthy and expected to play. Answer follow-up questions concisely and sharply. Keep answers under 3 sentences. Do not use markdown formatting — no bold, no asterisks, no bullet points. Plain text only.`;
                userMessage = userQuery;
            } else {
                systemPrompt = `You are a sharp sports betting AI analyst for FadeOdds. You analyze games for expert bettors.
        You will receive a game, real sportsbook odds data, and an injury report.
        CRITICAL: You MUST respond with ONLY valid JSON. No markdown, no extra text. Use this exact format:
        {
        "tiles": [
            {"label": "string", "val": "string"},
            {"label": "string", "val": "string"},
            {"label": "string", "val": "string"},
            {"label": "string", "val": "string"}
        ],
        "blurb": "string (1 sentence: describe the betting storyline or market context for this game — e.g. sharp money on the home spread, public fading the away team, or line movement signal)",
        "expertTake": "string (2 sharp sentences on the market edge and where the value is)",
        "recommendation": "string (e.g. 'Lakers -3.5' or 'OVER 224.5' or 'PHI Moneyline')",
        "confidence": number (integer 55-92),
        "edge": "string (e.g. 'Line value on home spread' or 'Public overreacting to last game')"
        }
        For the tiles, use sharp betting metrics like: implied probability, best ML value, spread consensus, line movement signal, public bet %, sharp money indicator, key injury impact, or home/away ATS record.`;

                userMessage = `Analyze this game for sharp bettors:
        Game: ${game.away_team} @ ${game.home_team}
        Sport: ${game.sport_title}
        Time: ${game.commence_time}
        Real Sportsbook Odds: ${JSON.stringify(oddsData)}
        ${injuryContext}

        Provide 4 sharp intelligence tiles, your expert take, and your top recommendation.`;
    }

    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json',
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-6',
                max_tokens: mode === 'chat' ? 512 : 1024,
                system: systemPrompt,
                messages: mode === 'chat' && chatHistory?.length
                    ? [
                        ...chatHistory.slice(-6).map((m: { role: 'user' | 'ai'; text: string }) => ({
                            role: m.role === 'ai' ? 'assistant' : 'user',
                            content: m.text,
                        })),
                        { role: 'user', content: userMessage },
                      ]
                    : [{ role: 'user', content: userMessage }],
            }),
        });

        if (!response.ok) {
            const err = await response.json();
            return Response.json({ error: 'Claude API error: ' + JSON.stringify(err) }, { status: response.status });
        }

        const data = await response.json();
        const text = data.content?.[0]?.text;
        // console.log('Claude API raw response:', JSON.stringify(data, null, 2));

        if (!text) {
            return Response.json({ error: 'Empty response from Claude' }, { status: 500 });
        }

        if (mode === 'chat') {
            await incrementUsage(userId, 'questions_count');
            return Response.json({ text });
        }

        let analysis: any;
        try {
            analysis = JSON.parse(text);
        } catch {
            const match = text.match(/\{[\s\S]*\}/);
            if (match) {
                analysis = JSON.parse(match[0]);
            } else {
                return Response.json({ error: 'Could not parse Claude response as JSON' }, { status: 500 });
            }
        }

        await incrementUsage(userId, 'games_count');

        if (gameId) {
            await cacheAnalysis(gameId, game.sport_title, cacheState, analysis);
        }

        return Response.json(analysis);
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return Response.json({ error: 'Analysis failed: ' + message }, { status: 500 });
    }
}