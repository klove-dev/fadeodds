const SCOREBOARD_PATH: Record<string, string> = {
    basketball_nba:         'basketball/nba',
    basketball_ncaab:       'basketball/mens-college-basketball',
    americanfootball_nfl:   'football/nfl',
    icehockey_nhl:          'hockey/nhl',
    baseball_mlb:           'baseball/mlb',
};

// ESPN v2 standings paths for fallback
const STANDINGS_PATH: Record<string, string> = {
    basketball_nba:         'basketball/nba',
    basketball_ncaab:       'basketball/mens-college-basketball',
    americanfootball_nfl:   'football/nfl',
    icehockey_nhl:          'hockey/nhl',
    baseball_mlb:           'baseball/mlb',
};

function findRecord(teamRecords: Record<string, string>, searchName: string): string | null {
    if (!searchName) return null;
    const lower = searchName.toLowerCase();

    // Exact match
    for (const [name, record] of Object.entries(teamRecords)) {
        if (name.toLowerCase() === lower) return record;
    }
    // Last word match (team mascot e.g. "Lakers", "Knicks")
    const lastWord = lower.split(' ').pop() || '';
    if (lastWord.length > 2) {
        for (const [name, record] of Object.entries(teamRecords)) {
            if (name.toLowerCase().endsWith(lastWord)) return record;
        }
    }
    return null;
}

async function getRecordsFromScoreboard(espnPath: string): Promise<Record<string, string>> {
    const url = `https://site.api.espn.com/apis/site/v2/sports/${espnPath}/scoreboard?limit=100`;
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) return {};

    const data = await res.json();
    const records: Record<string, string> = {};

    for (const event of (data.events || [])) {
        const comp = event.competitions?.[0];
        for (const competitor of (comp?.competitors || [])) {
            const name: string = competitor.team?.displayName || '';
            if (!name) continue;
            const overall = (competitor.records || []).find(
                (r: any) => r.name === 'overall' || r.type === 'total' || r.description === 'Overall Record'
            );
            if (overall?.summary) records[name] = overall.summary;
        }
    }
    return records;
}

async function getRecordsFromStandings(standingsPath: string): Promise<Record<string, string>> {
    const url = `https://site.api.espn.com/apis/v2/sports/${standingsPath}/standings`;
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) return {};

    const data = await res.json();
    const records: Record<string, string> = {};

    const entries = data?.standings?.entries || data?.children?.[0]?.standings?.entries || [];
    for (const entry of entries) {
        const name: string = entry.team?.displayName || '';
        if (!name) continue;
        const wins   = entry.stats?.find((s: any) => s.name === 'wins')?.value;
        const losses = entry.stats?.find((s: any) => s.name === 'losses')?.value;
        if (wins != null && losses != null) {
            records[name] = `${Math.round(wins)}-${Math.round(losses)}`;
        }
    }
    return records;
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const sport    = searchParams.get('sport') || 'basketball_nba';
    const awayTeam = searchParams.get('away') || '';
    const homeTeam = searchParams.get('home') || '';

    const espnPath      = SCOREBOARD_PATH[sport];
    const standingsPath = STANDINGS_PATH[sport];
    if (!espnPath) return Response.json({ away: null, home: null });

    try {
        // Primary: today's scoreboard (fast, covers most cases)
        const scoreboardRecords = await getRecordsFromScoreboard(espnPath);

        const awayRecord = findRecord(scoreboardRecords, awayTeam);
        const homeRecord = findRecord(scoreboardRecords, homeTeam);

        // If either team is missing, fall back to ESPN standings (covers all teams year-round)
        if (!awayRecord || !homeRecord) {
            const standingsRecords = await getRecordsFromStandings(standingsPath);
            return Response.json({
                away: awayRecord ?? findRecord(standingsRecords, awayTeam),
                home: homeRecord ?? findRecord(standingsRecords, homeTeam),
            });
        }

        return Response.json({ away: awayRecord, home: homeRecord });
    } catch {
        return Response.json({ away: null, home: null });
    }
}
