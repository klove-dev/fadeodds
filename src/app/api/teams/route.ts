import { auth } from '@clerk/nextjs/server';
import { getMyTeams, saveMyTeams } from '@/lib/user';

export async function GET() {
    const { userId } = await auth();
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const teamIds = await getMyTeams(userId);
    return Response.json(teamIds);
}

export async function POST(request: Request) {
    const { userId } = await auth();
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let body: { teamIds: string[] };
    try {
        body = await request.json();
    } catch {
        return Response.json({ error: 'Invalid request body' }, { status: 400 });
    }

    await saveMyTeams(userId, body.teamIds ?? []);
    return Response.json({ success: true });
}
