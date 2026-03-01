import { Resend } from 'resend';
import { ReactElement } from 'react';

export const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_ADDRESS = process.env.RESEND_FROM_EMAIL ?? 'FadeOdds <onboarding@resend.dev>';

export type EmailType =
    | 'welcome'
    | 'bill-ready'
    | 'bill-paid'
    | 'subscription-change'
    | 'account-closure'
    | 'change-password';

interface SendEmailOptions {
    to: string;
    subject: string;
    react: ReactElement;
}

export async function sendEmail({ to, subject, react }: SendEmailOptions) {
    const { data, error } = await resend.emails.send({
        from: FROM_ADDRESS,
        to,
        subject,
        react,
    });

    if (error) {
        console.error('[Resend] Failed to send email:', error);
        throw new Error(error.message);
    }

    return data;
}
