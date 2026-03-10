import { supabaseAdmin } from '@/lib/supabase';
import type { TeamDef } from '@/lib/teams';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const leaguesOnly = searchParams.get('leagues') === 'true';

    if (leaguesOnly) {
        const { data, error } = await supabaseAdmin
            .from('teams')
            .select('league')
            .order('league');

        if (error) return Response.json({ error: error.message }, { status: 500 });

        const leagues = [...new Set(data.map((r) => r.league))];
        return Response.json(leagues);
    }

    const [teamsResult, aliasesResult] = await Promise.all([
        supabaseAdmin.from('teams').select('*').order('league').order('name'),
        supabaseAdmin.from('team_aliases').select('league, espn_abbr, alias'),
    ]);

    if (teamsResult.error) return Response.json({ error: teamsResult.error.message }, { status: 500 });

    const aliasMap: Record<string, string[]> = {};
    for (const row of aliasesResult.data ?? []) {
        const key = `${row.league}:${row.espn_abbr}`;
        if (!aliasMap[key]) aliasMap[key] = [];
        aliasMap[key].push(row.alias);
    }

    const teams: TeamDef[] = teamsResult.data.map((row) => ({
        id: row.id,
        name: row.name,
        city: row.city,
        mascot: row.mascot,
        league: row.league,
        sport: row.sport,
        espnAbbr: row.espn_abbr,
        aliases: aliasMap[`${row.league}:${row.espn_abbr}`] ?? [],
    }));

    return Response.json(teams);
}