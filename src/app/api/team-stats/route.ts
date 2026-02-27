const SPORT_MAP: Record<string, string> = {
    basketball_nba: 'basketball/nba',
    basketball_ncaab: 'basketball/mens-college-basketball',
    americanfootball_nfl: 'football/nfl',
    icehockey_nhl: 'hockey/nhl',
    baseball_mlb: 'baseball/mlb',
};

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const sport = searchParams.get('sport') || 'basketball_nba';
    const awayTeam = searchParams.get('away') || '';
    const homeTeam = searchParams.get('home') || '';

    const espnPath = SPORT_MAP[sport];
    if (!espnPath) return Response.json({ away: null, home: null });

    try {
        const url = `https://site.api.espn.com/apis/site/v2/sports/${espnPath}/scoreboard?limit=100`;
        const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (!response.ok) return Response.json({ away: null, home: null });
        const data = await response.json();

        // Build a map of team display name → record
        const teamRecords: Record<string, string> = {};
        for (const event of (data.events || [])) {
            const comp = event.competitions?.[0];
            for (const competitor of (comp?.competitors || [])) {
                const name: string = competitor.team?.displayName || '';
                if (!name) continue;
                const overall = (competitor.records || []).find(
                    (r: any) => r.name === 'overall' || r.type === 'total' || r.description === 'Overall Record'
                );
                if (overall?.summary) teamRecords[name] = overall.summary;
            }
        }

        const findRecord = (searchName: string): string | null => {
            if (!searchName) return null;
            const lower = searchName.toLowerCase();
            // Exact match
            for (const [name, record] of Object.entries(teamRecords)) {
                if (name.toLowerCase() === lower) return record;
            }
            // Last word match (team mascot)
            const lastWord = lower.split(' ').pop() || '';
            if (lastWord.length > 2) {
                for (const [name, record] of Object.entries(teamRecords)) {
                    if (name.toLowerCase().endsWith(lastWord)) return record;
                }
            }
            return null;
        };

        return Response.json({
            away: findRecord(awayTeam),
            home: findRecord(homeTeam),
        });
    } catch {
        return Response.json({ away: null, home: null });
    }
}
