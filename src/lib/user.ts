import { supabaseAdmin } from './supabase';

export async function syncUser(clerkUserId: string, email: string): Promise<void> {
    const { error } = await supabaseAdmin
        .from('users')
        .upsert(
            {
                id: clerkUserId,
                email,
                updated_at: new Date().toISOString(),
            },
            { onConflict: 'id', ignoreDuplicates: false }
        );

    if (error) {
        if (error.code === '23505') {
            // Email taken by another Clerk ID — retry without email so this user still has a row
            const { error: retryError } = await supabaseAdmin
                .from('users')
                .upsert(
                    { id: clerkUserId, updated_at: new Date().toISOString() },
                    { onConflict: 'id', ignoreDuplicates: false }
                );
            if (retryError) {
                console.error('Failed to sync user:', retryError.message);
            }
        } else {
            console.error('Failed to sync user:', error.message);
        }
    }
}

export async function getUserTier(clerkUserId: string): Promise<string> {
    const { data, error } = await supabaseAdmin
        .from('users')
        .select('tier')
        .eq('id', clerkUserId)
        .single();

    if (error || !data) return 'free';
    return data.tier;
}

export async function getUsage(clerkUserId: string): Promise<{ games: number; questions: number }> {
    const today = new Date().toISOString().slice(0, 10);

    const { data, error } = await supabaseAdmin
        .from('usage')
        .select('games_count, questions_count')
        .eq('user_id', clerkUserId)
        .eq('date', today)
        .single();

    if (error || !data) return { games: 0, questions: 0 };
    return { games: data.games_count, questions: data.questions_count };
}

export async function incrementUsage(
    clerkUserId: string,
    field: 'games_count' | 'questions_count'
): Promise<void> {
    const today = new Date().toISOString().slice(0, 10);
    const { error } = await supabaseAdmin.rpc('increment_usage', {
        p_user_id: clerkUserId,
        p_date: today,
        p_field: field,
    });
    if (error) {
        console.error('Failed to increment usage:', error.message);
    }
}

const TIER_LIMITS_FALLBACK: Record<string, { games: number; questions: number }> = {
    free: { games: 0,        questions: 0 },
    go:   { games: 3,        questions: 10 },
    plus: { games: 10,       questions: 100 },
    pro:  { games: Infinity, questions: Infinity },
};

export async function getTierLimits(tier: string): Promise<{ games: number; questions: number }> {
    const { data, error } = await supabaseAdmin
        .from('tier_limits')
        .select('games_per_day, questions_per_day, is_unlimited')
        .eq('tier', tier)
        .single();

    if (error || !data) return TIER_LIMITS_FALLBACK[tier] ?? TIER_LIMITS_FALLBACK.free;
    if (data.is_unlimited) return { games: Infinity, questions: Infinity };
    return { games: data.games_per_day, questions: data.questions_per_day };
}

export async function getSavedBets(clerkUserId: string): Promise<any[]> {
    const { data, error } = await supabaseAdmin
        .from('saved_bets')
        .select('*')
        .eq('user_id', clerkUserId)
        .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data;
}

export async function saveBet(clerkUserId: string, bet: {
    id: string;
    bookName: string;
    awayTeam: string;
    homeTeam: string;
    sport: string;
    commenceTime: string;
    pick: string;
}): Promise<void> {
    await supabaseAdmin
        .from('saved_bets')
        .upsert({
            id: bet.id,
            user_id: clerkUserId,
            book_name: bet.bookName,
            away_team: bet.awayTeam,
            home_team: bet.homeTeam,
            sport: bet.sport,
            commence_time: bet.commenceTime,
            pick: bet.pick,
        }, { onConflict: 'id' });
}

export async function deleteSavedBet(clerkUserId: string, betId: string): Promise<void> {
    await supabaseAdmin
        .from('saved_bets')
        .delete()
        .eq('id', betId)
        .eq('user_id', clerkUserId);
}

export async function getMyTeams(clerkUserId: string): Promise<string[]> {
    const { data, error } = await supabaseAdmin
        .from('user_teams')
        .select('team_id')
        .eq('user_id', clerkUserId)
        .order('created_at', { ascending: true });

    if (error || !data) return [];
    return data.map((row: { team_id: string }) => row.team_id);
}

export async function saveMyTeams(clerkUserId: string, teamIds: string[]): Promise<void> {
    await supabaseAdmin
        .from('user_teams')
        .delete()
        .eq('user_id', clerkUserId);

    if (teamIds.length === 0) return;

    await supabaseAdmin
        .from('user_teams')
        .insert(teamIds.map((team_id) => ({ user_id: clerkUserId, team_id })));
}