const SPORT_MAP: Record<string, string> = {
    basketball_nba: 'basketball/nba',
    basketball_ncaab: 'basketball/mens-college-basketball',
    americanfootball_nfl: 'football/nfl',
    icehockey_nhl: 'hockey/nhl',
    baseball_mlb: 'baseball/mlb'
};

function getPeriodLabel(sport: string, period: number | null): string {
    if (!period) return '';
    switch (sport) {
        case 'basketball_nba': return `Q${period}`;
        case 'basketball_ncaab': return period <= 2 ? `H${period}` : 'OT';
        case 'americanfootball_nfl': return period <= 4 ? `Q${period}` : 'OT';
        case 'icehockey_nhl': return `P${period}`;
        case 'baseball_mlb': return `Inn ${period}`;
        default: return `P${period}`;
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const sport = searchParams.get('sport') || 'basketball_nba';
    const espnPath = SPORT_MAP[sport];

    if (!espnPath) {
        return Response.json({ error: 'Unknown sport' }, { status: 400 });
    }

    try {
        const url = `https://site.api.espn.com/apis/site/v2/sports/${espnPath}/scoreboard`;
        const response = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        if (!response.ok) throw new Error(`ESPN error: ${response.status}`);
        const data = await response.json();

        const games = (data.events || []).map((event: any) => {
            const comp = event.competitions?.[0];
            const status = comp?.status;
            const competitors = comp?.competitors || [];
            const home = competitors.find((c: any) => c.homeAway === 'home');
            const away = competitors.find((c: any) => c.homeAway === 'away');
            const statusName = status?.type?.name || '';

            return {
                espnId: event.id,
                homeTeam: home?.team?.displayName || '',
                awayTeam: away?.team?.displayName || '',
                homeScore: home?.score ?? null,
                awayScore: away?.score ?? null,
                isLive: statusName === 'STATUS_IN_PROGRESS',
                isFinal: statusName === 'STATUS_FINAL',
                period: status?.period || null,
                periodLabel: getPeriodLabel(sport, status?.period),
                displayClock: status?.displayClock || '',
                startTime: event.date
            };
        });

        return Response.json(games);
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return Response.json({ error: message }, { status: 500 });
    }
}