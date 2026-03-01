import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env.local manually
const envFile = readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8');
for (const line of envFile.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...rest] = trimmed.split('=');
    if (key && rest.length) process.env[key.trim()] = rest.join('=').trim();
}

import { Resend } from 'resend';
import { render } from '@react-email/components';
import { WelcomeEmail } from '../src/emails/WelcomeEmail';
import { BillReadyEmail } from '../src/emails/BillReadyEmail';
import { BillPaidEmail } from '../src/emails/BillPaidEmail';
import { SubscriptionChangeEmail } from '../src/emails/SubscriptionChangeEmail';
import { AccountClosureEmail } from '../src/emails/AccountClosureEmail';
import { ChangePasswordEmail } from '../src/emails/ChangePasswordEmail';
import React from 'react';

const resend = new Resend(process.env.RESEND_API_KEY);
const TO = 'llombardi@kdltechnologysolutions.com';
const FROM = 'FadeOdds <onboarding@resend.dev>';

const emails = [
    {
        subject: "You're In. Let's Get to Work.",
        react: React.createElement(WelcomeEmail, { firstName: 'Lou' }),
    },
    {
        subject: "Your Invoice is Ready — Don't Sleep on It",
        react: React.createElement(BillReadyEmail, {
            firstName: 'Lou',
            amount: '19.99',
            planName: 'FadeOdds Pro',
            dueDate: 'March 15, 2026',
            invoiceUrl: 'https://fadeodds.com/account',
        }),
    },
    {
        subject: "Paid. You're Locked In.",
        react: React.createElement(BillPaidEmail, {
            firstName: 'Lou',
            amount: '19.99',
            planName: 'FadeOdds Pro',
            nextBillingDate: 'April 1, 2026',
            receiptUrl: 'https://fadeodds.com/account',
        }),
    },
    {
        subject: 'Level Up. New Plan, More Edge.',
        react: React.createElement(SubscriptionChangeEmail, {
            firstName: 'Lou',
            changeType: 'upgraded',
            newPlan: 'FadeOdds Pro',
            oldPlan: 'FadeOdds Go',
            effectiveDate: 'March 1, 2026',
            manageUrl: 'https://fadeodds.com/account',
        }),
    },
    {
        subject: 'Sad to See You Go. Good Luck Out There.',
        react: React.createElement(AccountClosureEmail, {
            firstName: 'Lou',
            accessEndsDate: 'March 31, 2026',
            reactivateUrl: 'https://fadeodds.com/pricing',
        }),
    },
    {
        subject: 'Your Password Was Changed.',
        react: React.createElement(ChangePasswordEmail, {
            firstName: 'Lou',
            changedAt: 'March 1, 2026 at 05:06 PM EST',
            supportUrl: 'https://fadeodds.com/support',
        }),
    },
];

async function sendAll() {
    console.log(`Sending ${emails.length} test emails to ${TO}...\n`);

    for (const email of emails) {
        const html = await render(email.react);
        const { data, error } = await resend.emails.send({
            from: FROM,
            to: TO,
            subject: email.subject,
            html,
        });

        if (error) {
            console.error(`FAILED: "${email.subject}"`, error.message);
        } else {
            console.log(`SENT:   "${email.subject}" → ${data?.id}`);
        }

        // Stay under Resend's 2 req/sec rate limit on free tier
        await new Promise((r) => setTimeout(r, 600));
    }

    console.log('\nDone.');
}

sendAll();
