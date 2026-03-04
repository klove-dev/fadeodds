const SPORT_MAP: Record<string, string> = {
    basketball_nba: 'basketball/nba',
    basketball_ncaab: 'basketball/mens-college-basketball',
    americanfootball_nfl: 'football/nfl',
    icehockey_nhl: 'hockey/nhl',
    baseball_mlb: 'baseball/mlb',
};

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name') || '';
    const sport = searchParams.get('sport') || 'basketball_nba';
    const debug = searchParams.get('debug') as 'search' | 'stats' | null;
    const espnPath = SPORT_MAP[sport];

    if (!name || !espnPath) return Response.json({ splits: null });

    try {
        // Step 1: Search for athlete by name
        const searchUrl = `https://site.api.espn.com/apis/site/v2/sports/${espnPath}/athletes?limit=5&active=true&searchTerm=${encodeURIComponent(name)}`;
        const searchRes = await fetch(searchUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (!searchRes.ok) return Response.json({ splits: null });

        const searchData = await searchRes.json();
        if (debug === 'search') return Response.json({ raw: searchData });

        const athletes = searchData.athletes || searchData.items || [];
        const athlete = athletes[0];
        if (!athlete?.id) return Response.json({ splits: null });

        const athleteId = athlete.id;
        const playerName = athlete.displayName || athlete.fullName || name;
        const teamName = athlete.team?.displayName || '';

        // Step 2: Fetch statistics
        const statsUrl = `https://site.api.espn.com/apis/site/v2/sports/${espnPath}/athletes/${athleteId}/statistics`;
        const statsRes = await fetch(statsUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (!statsRes.ok) return Response.json({ splits: null });

        const statsData = await statsRes.json();
        if (debug === 'stats') return Response.json({ raw: statsData, athleteId, playerName });

        // Step 3: Extract home/away splits
        const splitCategories = statsData.splits?.categories || [];
        let homeSplit: any = null;
        let awaySplit: any = null;

        for (const cat of splitCategories) {
            const n = (cat.name || cat.displayName || '').toLowerCase();
            if (n === 'home') homeSplit = cat;
            if (n === 'away' || n === 'road') awaySplit = cat;
        }

        if (!homeSplit && !awaySplit) return Response.json({ splits: null });

        const parseSplit = (cat: any): Record<string, string> => {
            const labels: string[] = cat.labels || cat.names || [];
            const values: string[] = cat.totals || cat.values || cat.stats || [];
            const result: Record<string, string> = {};
            labels.forEach((label, i) => {
                if (values[i] !== undefined && values[i] !== '') result[label] = values[i];
            });
            return result;
        };

        return Response.json({
            splits: {
                player: playerName,
                team: teamName,
                home: homeSplit ? parseSplit(homeSplit) : null,
                away: awaySplit ? parseSplit(awaySplit) : null,
            },
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return Response.json({ splits: null, error: message });
    }
}
