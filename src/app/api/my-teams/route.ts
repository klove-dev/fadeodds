import { auth } from '@clerk/nextjs/server';
import { getMyTeams, saveMyTeams } from '@/lib/user';

export async function GET() {
    const { userId } = await auth();
    if (!userId) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teamIds = await getMyTeams(userId);
    return Response.json(teamIds);
}

export async function POST(request: Request) {
    const { userId } = await auth();
    if (!userId) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { teamIds } = await request.json();
    await saveMyTeams(userId, teamIds);
    return Response.json({ ok: true });
}