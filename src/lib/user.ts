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
        console.error('Failed to sync user:', error.message);
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

    const { data } = await supabaseAdmin
        .from('usage')
        .select('id, games_count, questions_count')
        .eq('user_id', clerkUserId)
        .eq('date', today)
        .single();

    if (data) {
        await supabaseAdmin
            .from('usage')
            .update({
                [field]: (data[field] || 0) + 1,
                updated_at: new Date().toISOString(),
            })
            .eq('id', data.id);
    } else {
        await supabaseAdmin
            .from('usage')
            .insert({
                user_id: clerkUserId,
                date: today,
                games_count: field === 'games_count' ? 1 : 0,
                questions_count: field === 'questions_count' ? 1 : 0,
            });
    }
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