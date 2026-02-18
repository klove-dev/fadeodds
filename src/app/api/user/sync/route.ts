import { auth } from '@clerk/nextjs/server';
import { syncUser } from '@/lib/user';

export async function POST(request: Request) {
    const { userId, sessionClaims } = await auth();

    if (!userId) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = sessionClaims?.email as string || '';
    await syncUser(userId, email);

    return Response.json({ success: true });
}