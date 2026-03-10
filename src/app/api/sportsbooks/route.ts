import { supabaseAdmin } from '@/lib/supabase';
import { LEGAL_BETTING_STATES, STATE_BOOKS } from '@/lib/sportsbooks';

export async function GET() {
    const [statesResult, bookStatesResult] = await Promise.all([
        supabaseAdmin
            .from('betting_states')
            .select('abbr, name')
            .eq('is_active', true)
            .order('name'),
        supabaseAdmin
            .from('sportsbook_states')
            .select('state_abbr, sportsbook_key')
            .eq('is_active', true),
    ]);

    if (statesResult.error || bookStatesResult.error) {
        return Response.json({ bettingStates: LEGAL_BETTING_STATES, stateBooks: STATE_BOOKS });
    }

    const bettingStates = statesResult.data.map((r) => ({ abbr: r.abbr, name: r.name }));

    const stateBooks: Record<string, string[]> = {};
    for (const row of bookStatesResult.data) {
        if (!stateBooks[row.state_abbr]) stateBooks[row.state_abbr] = [];
        stateBooks[row.state_abbr].push(row.sportsbook_key);
    }

    return Response.json({ bettingStates, stateBooks });
}
