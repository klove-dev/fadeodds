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

        const debug = searchParams.get('debug') === 'true';
        if (debug) return Response.json({ raw: data });

        const injuries: any[] = [];

        // ESPN returns { injuries: [ { displayName: "Team Name", injuries: [...] } ] }
        for (const teamEntry of (data.injuries || [])) {
            const teamName = teamEntry.displayName || teamEntry.team?.displayName || '';
            for (const item of (teamEntry.injuries || [])) {
                const player = item.athlete?.displayName || '';
                const status = item.status || item.type?.description || '';
                const injury = item.shortComment || item.longComment || '';
                const returnDate = item.details?.returnDate || '';
                if (player) injuries.push({ team: teamName, player, status, injury, returnDate });
            }
        }

        return Response.json({ injuries });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return Response.json({ injuries: [], error: message });
    }
}