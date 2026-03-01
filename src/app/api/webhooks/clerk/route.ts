import { headers } from 'next/headers';
import { Webhook } from 'svix';
import { sendEmail } from '@/lib/resend';
import { WelcomeEmail } from '@/emails/WelcomeEmail';
import React from 'react';

// Clerk sends webhook events via Svix — verify the signature before trusting the payload.
// Set CLERK_WEBHOOK_SECRET in your env once you get it from the Clerk dashboard.

interface ClerkEmailAddress {
    email_address: string;
    id: string;
}

interface ClerkUserCreatedEvent {
    type: 'user.created';
    data: {
        id: string;
        email_addresses: ClerkEmailAddress[];
        primary_email_address_id: string;
        first_name: string | null;
        last_name: string | null;
    };
}

type ClerkWebhookEvent = ClerkUserCreatedEvent;

export async function POST(request: Request) {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

    if (!webhookSecret) {
        console.error('[Clerk Webhook] CLERK_WEBHOOK_SECRET is not set');
        return Response.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    // Verify the webhook signature
    const headerPayload = await headers();
    const svixId = headerPayload.get('svix-id');
    const svixTimestamp = headerPayload.get('svix-timestamp');
    const svixSignature = headerPayload.get('svix-signature');

    if (!svixId || !svixTimestamp || !svixSignature) {
        return Response.json({ error: 'Missing svix headers' }, { status: 400 });
    }

    const body = await request.text();
    const wh = new Webhook(webhookSecret);

    let event: ClerkWebhookEvent;
    try {
        event = wh.verify(body, {
            'svix-id': svixId,
            'svix-timestamp': svixTimestamp,
            'svix-signature': svixSignature,
        }) as ClerkWebhookEvent;
    } catch {
        return Response.json({ error: 'Invalid webhook signature' }, { status: 400 });
    }

    // Handle events
    if (event.type === 'user.created') {
        const { data } = event;

        const primaryEmail = data.email_addresses.find(
            (e) => e.id === data.primary_email_address_id
        );

        if (!primaryEmail) {
            return Response.json({ error: 'No primary email found' }, { status: 400 });
        }

        try {
            await sendEmail({
                to: primaryEmail.email_address,
                subject: "You're In. Let's Get to Work.",
                react: React.createElement(WelcomeEmail, {
                    firstName: data.first_name ?? undefined,
                }),
            });
        } catch (err) {
            console.error('[Clerk Webhook] Failed to send welcome email:', err);
            // Return 200 so Clerk doesn't retry — the user was created successfully
        }
    }

    return Response.json({ received: true });
}
