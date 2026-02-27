import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
    const { userId } = await auth();
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabaseAdmin
        .from('users')
        .select('betting_state')
        .eq('id', userId)
        .single();

    if (error || !data) return Response.json({ state: null });
    return Response.json({ state: data.betting_state ?? null });
}

export async function POST(request: Request) {
    const { userId } = await auth();
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { state } = await request.json();
    if (typeof state !== 'string' && state !== null) {
        return Response.json({ error: 'Invalid state value' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
        .from('users')
        .update({ betting_state: state, updated_at: new Date().toISOString() })
        .eq('id', userId);

    if (error) {
        console.error('Failed to save betting state:', error.message);
        return Response.json({ error: 'Failed to save state' }, { status: 500 });
    }

    return Response.json({ ok: true });
}
