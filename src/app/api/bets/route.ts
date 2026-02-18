import { auth } from '@clerk/nextjs/server';
import { getSavedBets, saveBet, deleteSavedBet } from '@/lib/user';

export async function GET() {
    const { userId } = await auth();
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const bets = await getSavedBets(userId);
    return Response.json(bets);
}

export async function POST(request: Request) {
    const { userId } = await auth();
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let body: any;
    try {
        body = await request.json();
    } catch {
        return Response.json({ error: 'Invalid request body' }, { status: 400 });
    }

    await saveBet(userId, body);
    return Response.json({ success: true });
}

export async function DELETE(request: Request) {
    const { userId } = await auth();
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const betId = searchParams.get('id');

    if (!betId) return Response.json({ error: 'Missing bet id' }, { status: 400 });

    await deleteSavedBet(userId, betId);
    return Response.json({ success: true });
}