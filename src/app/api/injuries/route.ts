const SPORT_MAP: Record<string, string> = {
    basketball_nba: 'basketball/nba',
    basketball_ncaab: 'basketball/mens-college-basketball',
    americanfootball_nfl: 'football/nfl',
    icehockey_nhl: 'hockey/nhl',
    baseball_mlb: 'baseball/mlb'
};

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const sport = searchParams.get('sport') || 'basketball_nba';
    const espnPath = SPORT_MAP[sport];

    if (!espnPath) {
        return Response.json({ injuries: [] });
    }

    try {
        const url = `https://site.api.espn.com/apis/site/v2/sports/${espnPath}/injuries`;
        const response = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        if (!response.ok) return Response.json({ injuries: [] });

        const data = await response.json();
        const injuries: any[] = [];

        for (const item of (data.items || [])) {
            const player = item.athlete?.displayName || item.athlete?.fullName || '';
            const team = item.athlete?.team?.displayName
                || item.athlete?.team?.name
                || item.team?.displayName
                || '';
            const status = item.status || item.type?.description || '';
            const injury = item.shortComment || item.longComment || item.comment || '';

            if (player) injuries.push({ team, player, status, injury });
        }

        return Response.json({ injuries });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return Response.json({ injuries: [], error: message });
    }
}