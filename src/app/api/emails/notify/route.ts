import { auth } from '@clerk/nextjs/server';
import { sendEmail } from '@/lib/resend';
import { ChangePasswordEmail } from '@/emails/ChangePasswordEmail';
import React from 'react';

// Protected endpoint — the frontend calls this after a successful password change
// to send the user a security notification email.

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://fadeodds.com';

export async function POST(request: Request) {
    const { userId, sessionClaims } = await auth();

    if (!userId) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type } = body as { type: string };

    if (type !== 'change-password') {
        return Response.json({ error: 'Invalid notification type' }, { status: 400 });
    }

    const email = sessionClaims?.email as string | undefined;

    if (!email) {
        return Response.json({ error: 'No email on session' }, { status: 400 });
    }

    const firstName = (sessionClaims?.firstName as string | undefined) ?? undefined;

    const changedAt = new Date().toLocaleString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
    });

    try {
        await sendEmail({
            to: email,
            subject: 'Your Password Was Changed.',
            react: React.createElement(ChangePasswordEmail, {
                firstName,
                changedAt,
                supportUrl: `${appUrl}/support`,
            }),
        });

        return Response.json({ success: true });
    } catch (err) {
        console.error('[Email Notify] Failed to send change-password email:', err);
        return Response.json({ error: 'Failed to send email' }, { status: 500 });
    }
}
