// ─── NBA ─────────────────────────────────────────────────────────────────────
const NBA_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'https://www.nba.com/',
    'Origin': 'https://www.nba.com',
    'x-nba-stats-origin': 'stats',
    'x-nba-stats-token': 'true',
    'Accept': 'application/json',
    'Accept-Language': 'en-US,en;q=0.9',
};

function getNBASeason(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const startYear = month < 10 ? year - 1 : year;
    return `${startYear}-${String(startYear + 1).slice(2)}`;
}

async function getNBAPlayerSplits(name: string, debug: string | null): Promise<Response> {
    const season = getNBASeason();
    const indexRes = await fetch(
        `https://stats.nba.com/stats/playerindex?Historical=0&LeagueID=00&Season=${season}`,
        { headers: NBA_HEADERS, cache: 'no-store' }
    );
    if (debug === 'search') {
        const raw = indexRes.ok ? await indexRes.json() : { httpStatus: indexRes.status };
        return Response.json({ raw, season });
    }
    if (!indexRes.ok) return Response.json({ splits: null, error: `playerindex ${indexRes.status}` });

    const indexData = await indexRes.json();
    const roster = indexData.resultSets?.[0];
    if (!roster) return Response.json({ splits: null });

    const hdrs: string[] = roster.headers;
    const rows: any[][] = roster.rowSet;
    const firstIdx = hdrs.indexOf('PLAYER_FIRST_NAME');
    const lastIdx  = hdrs.indexOf('PLAYER_LAST_NAME');
    const nameIdx  = hdrs.indexOf('DISPLAY_FIRST_LAST') !== -1 ? hdrs.indexOf('DISPLAY_FIRST_LAST')
                   : hdrs.indexOf('PLAYER_NAME') !== -1 ? hdrs.indexOf('PLAYER_NAME') : -1;
    const idIdx    = hdrs.indexOf('PERSON_ID');
    const teamIdx  = hdrs.indexOf('TEAM_ABBREVIATION');

    const nameLower = name.toLowerCase().trim();
    const playerRow = rows.find((row) => {
        if (nameIdx !== -1) {
            const pn = (row[nameIdx] || '').toLowerCase();
            if (pn === nameLower || nameLower.split(' ').every((p) => pn.includes(p))) return true;
        }
        if (firstIdx !== -1 && lastIdx !== -1) {
            const full = `${row[firstIdx] || ''} ${row[lastIdx] || ''}`.toLowerCase().trim();
            if (full === nameLower || nameLower.split(' ').every((p) => full.includes(p))) return true;
        }
        return false;
    });
    if (!playerRow) return Response.json({ splits: null });

    const playerId   = playerRow[idIdx];
    const playerName = nameIdx !== -1 ? (playerRow[nameIdx] || name)
                     : `${playerRow[firstIdx] || ''} ${playerRow[lastIdx] || ''}`.trim() || name;
    const teamAbbr   = playerRow[teamIdx] || '';

    const params = new URLSearchParams({
        PlayerID: String(playerId), Season: season, SeasonType: 'Regular Season',
        PerMode: 'PerGame', MeasureType: 'Base', PaceAdjust: 'N', PlusMinus: 'N',
        Rank: 'N', GameSegment: '', DateFrom: '', DateTo: '', LastNGames: '0',
        LeagueID: '00', Location: '', Month: '0', OpponentTeamID: '0',
        Outcome: '', PORound: '0', Period: '0', ShotClockRange: '',
        VsConference: '', VsDivision: '',
    });
    const splitsRes = await fetch(
        `https://stats.nba.com/stats/playerdashboardbygeneralsplits?${params}`,
        { headers: NBA_HEADERS, cache: 'no-store' }
    );
    if (debug === 'splits') {
        const raw = splitsRes.ok ? await splitsRes.json() : { httpStatus: splitsRes.status };
        return Response.json({ raw, playerId, playerName, season });
    }
    if (!splitsRes.ok) return Response.json({ splits: null, error: `splits ${splitsRes.status}` });

    const splitsData = await splitsRes.json();
    const byLocation = splitsData.resultSets?.find((rs: any) => rs.name === 'LocationPlayerDashboard');
    if (!byLocation) return Response.json({ splits: null });

    const splitHdrs: string[] = byLocation.headers;
    const splitRows: any[][] = byLocation.rowSet;
    const homeRow = splitRows.find((r) => r[1] === 'Home');
    const awayRow = splitRows.find((r) => r[1] === 'Road');

    const KEY_STATS = ['GP', 'MIN', 'PTS', 'REB', 'AST', 'STL', 'BLK', 'FG_PCT', 'FG3_PCT', 'FT_PCT'];
    const parseRow = (row: any[]): Record<string, string> => {
        const result: Record<string, string> = {};
        KEY_STATS.forEach((stat) => {
            const i = splitHdrs.indexOf(stat);
            if (i !== -1 && row[i] != null) result[stat] = String(row[i]);
        });
        return result;
    };

    return Response.json({
        splits: { player: playerName, team: teamAbbr,
            home: homeRow ? parseRow(homeRow) : null,
            away: awayRow ? parseRow(awayRow) : null },
    });
}

// ─── MLB ─────────────────────────────────────────────────────────────────────
function getMLBSeason(): number {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    return month < 4 ? year - 1 : year; // season runs Apr–Oct
}

async function getMLBPlayerSplits(name: string, debug: string | null): Promise<Response> {
    const season = getMLBSeason();
    const UA = { 'User-Agent': 'Mozilla/5.0' };

    // Search
    const searchUrl = `https://statsapi.mlb.com/api/v1/people/search?names=${encodeURIComponent(name)}&sportIds=1&fields=people,id,fullName,currentTeam`;
    const searchRes = await fetch(searchUrl, { headers: UA, cache: 'no-store' });
    if (debug === 'search') {
        const raw = searchRes.ok ? await searchRes.json() : { httpStatus: searchRes.status, url: searchUrl };
        return Response.json({ raw });
    }
    if (!searchRes.ok) return Response.json({ splits: null, error: `mlb search ${searchRes.status}` });

    const searchData = await searchRes.json();
    const people = searchData.people || [];
    if (!people.length) return Response.json({ splits: null });

    const player = people[0];
    const playerId = player.id;
    const playerName = player.fullName || name;
    const teamName = player.currentTeam?.name || '';

    // Home/away splits
    const splitsUrl = `https://statsapi.mlb.com/api/v1/people/${playerId}/stats?stats=homeAndAway&season=${season}&group=hitting&sportId=1`;
    const splitsRes = await fetch(splitsUrl, { headers: UA, cache: 'no-store' });
    if (debug === 'splits') {
        const raw = splitsRes.ok ? await splitsRes.json() : { httpStatus: splitsRes.status };
        return Response.json({ raw, playerId, playerName, season });
    }
    if (!splitsRes.ok) return Response.json({ splits: null });

    const splitsData = await splitsRes.json();
    const statGroups: any[] = splitsData.stats || [];
    let homeStat: any = null, awayStat: any = null;

    for (const group of statGroups) {
        for (const split of (group.splits || [])) {
            const code = split.split?.code || '';
            const desc = (split.split?.description || '').toLowerCase();
            const isHome = code === 'H' || desc === 'home' || split.isHome === true;
            const isAway = code === 'A' || desc === 'away' || split.isHome === false;
            if (isHome && !homeStat) homeStat = split.stat;
            if (isAway && !awayStat) awayStat = split.stat;
        }
    }

    if (!homeStat && !awayStat) return Response.json({ splits: null });

    const MLB_KEYS = ['gamesPlayed', 'avg', 'obp', 'slg', 'ops', 'homeRuns', 'rbi', 'hits', 'strikeOuts', 'walks'];
    const parseMLB = (stat: any): Record<string, string> => {
        const r: Record<string, string> = {};
        MLB_KEYS.forEach((k) => { if (stat[k] != null) r[k] = String(stat[k]); });
        return r;
    };

    return Response.json({
        splits: { player: playerName, team: teamName,
            home: homeStat ? parseMLB(homeStat) : null,
            away: awayStat ? parseMLB(awayStat) : null },
    });
}

// ─── NHL ─────────────────────────────────────────────────────────────────────
async function getNHLPlayerSplits(name: string, debug: string | null): Promise<Response> {
    const UA = { 'User-Agent': 'Mozilla/5.0' };

    // Search via NHL search API
    const searchUrl = `https://search.d3.nhle.com/api/v1/search/player?culture=en-us&limit=5&q=${encodeURIComponent(name)}&active=true`;
    const searchRes = await fetch(searchUrl, { headers: UA, cache: 'no-store' });
    if (debug === 'search') {
        const raw = searchRes.ok ? await searchRes.json() : { httpStatus: searchRes.status };
        return Response.json({ raw, url: searchUrl });
    }
    if (!searchRes.ok) return Response.json({ splits: null });

    const players = await searchRes.json();
    if (!players.length) return Response.json({ splits: null });

    const player = players[0];
    const playerId = player.playerId;
    const playerName = player.name || name;
    const teamAbbr = player.teamAbbrev || '';

    // Game log — aggregate home/away from individual games
    const gameLogUrl = `https://api-web.nhle.com/v1/player/${playerId}/game-log/now`;
    const gameLogRes = await fetch(gameLogUrl, { headers: UA, cache: 'no-store' });
    if (debug === 'splits') {
        const raw = gameLogRes.ok ? await gameLogRes.json() : { httpStatus: gameLogRes.status };
        return Response.json({ raw, playerId, playerName });
    }
    if (!gameLogRes.ok) return Response.json({ splits: null });

    const gameLogData = await gameLogRes.json();
    const games: any[] = gameLogData.gameLog || [];
    const homeGames = games.filter((g) => g.homeRoadFlag === 'H');
    const awayGames = games.filter((g) => g.homeRoadFlag === 'R');

    if (!homeGames.length && !awayGames.length) return Response.json({ splits: null });

    const avgStat = (gms: any[], key: string) =>
        gms.length ? (gms.reduce((s, g) => s + (g[key] || 0), 0) / gms.length).toFixed(2) : '0';

    const aggregateNHL = (gms: any[]): Record<string, string> | null => {
        if (!gms.length) return null;
        return {
            GP: String(gms.length),
            G: avgStat(gms, 'goals'),
            A: avgStat(gms, 'assists'),
            PTS: avgStat(gms, 'points'),
            SOG: avgStat(gms, 'shots'),
            PIM: avgStat(gms, 'pim'),
        };
    };

    return Response.json({
        splits: { player: playerName, team: teamAbbr,
            home: aggregateNHL(homeGames),
            away: aggregateNHL(awayGames) },
    });
}

// ─── NFL ─────────────────────────────────────────────────────────────────────
async function getNFLPlayerSplits(_name: string, _debug: string | null): Promise<Response> {
    // All public ESPN NFL athlete search endpoints are auth-gated or deprecated.
    // NFL also has only 8–9 home/away games per season — statistically marginal splits.
    return Response.json({ splits: null });
}

// ─── NCAAB ───────────────────────────────────────────────────────────────────
async function getNCAABPlayerSplits(_name: string, _debug: string | null): Promise<Response> {
    // ESPN athlete search endpoint returns 404 for college basketball (searchTerm param deprecated).
    // No reliable free public API provides NCAAB home/away splits by player name.
    return Response.json({ splits: null });
}

// ─── Router ───────────────────────────────────────────────────────────────────
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const name  = searchParams.get('name') || '';
    const sport = searchParams.get('sport') || 'basketball_nba';
    const debug = searchParams.get('debug') as 'search' | 'splits' | null;

    if (!name) return Response.json({ splits: null });

    try {
        if (sport === 'basketball_nba')       return getNBAPlayerSplits(name, debug);
        if (sport === 'baseball_mlb')         return getMLBPlayerSplits(name, debug);
        if (sport === 'icehockey_nhl')        return getNHLPlayerSplits(name, debug);
        if (sport === 'americanfootball_nfl') return getNFLPlayerSplits(name, debug);
        if (sport === 'basketball_ncaab')     return getNCAABPlayerSplits(name, debug);
        return Response.json({ splits: null });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return Response.json({ splits: null, error: message });
    }
}
