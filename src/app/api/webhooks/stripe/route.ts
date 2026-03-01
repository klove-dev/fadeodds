import { headers } from 'next/headers';
import Stripe from 'stripe';
import { sendEmail } from '@/lib/resend';
import { BillReadyEmail } from '@/emails/BillReadyEmail';
import { BillPaidEmail } from '@/emails/BillPaidEmail';
import { SubscriptionChangeEmail } from '@/emails/SubscriptionChangeEmail';
import { AccountClosureEmail } from '@/emails/AccountClosureEmail';
import React from 'react';

// Set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET in your env from the Stripe dashboard.

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '');

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://fadeodds.com';

function formatAmount(cents: number): string {
    return (cents / 100).toFixed(2);
}

function formatDate(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });
}

// In Stripe v20, subscription period fields moved from Subscription → SubscriptionItem
function subPeriodEnd(sub: Stripe.Subscription): number | null {
    return sub.items.data[0]?.current_period_end ?? null;
}

function subPeriodStart(sub: Stripe.Subscription): number | null {
    return sub.items.data[0]?.current_period_start ?? null;
}

// In Stripe v20, invoice.subscription moved to invoice.parent.subscription_details.subscription
function invoiceSubId(invoice: Stripe.Invoice): string | null {
    const parent = invoice.parent as Stripe.Invoice.Parent | null;
    const subId = parent?.subscription_details?.subscription;
    return typeof subId === 'string' ? subId : null;
}

async function getCustomerEmail(customerId: string): Promise<{ email: string; firstName?: string } | null> {
    try {
        const customer = await stripe.customers.retrieve(customerId);
        if (customer.deleted) return null;
        const email = customer.email;
        if (!email) return null;
        const firstName = customer.name?.split(' ')[0] ?? undefined;
        return { email, firstName };
    } catch {
        return null;
    }
}

export async function POST(request: Request) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
        console.error('[Stripe Webhook] STRIPE_WEBHOOK_SECRET is not set');
        return Response.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    const headerPayload = await headers();
    const signature = headerPayload.get('stripe-signature');

    if (!signature) {
        return Response.json({ error: 'Missing stripe-signature header' }, { status: 400 });
    }

    const body = await request.text();
    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch {
        return Response.json({ error: 'Invalid webhook signature' }, { status: 400 });
    }

    try {
        switch (event.type) {
            case 'invoice.upcoming': {
                const invoice = event.data.object as Stripe.Invoice;
                if (!invoice.customer || typeof invoice.customer !== 'string') break;

                const customer = await getCustomerEmail(invoice.customer);
                if (!customer) break;

                const planName = invoice.lines.data[0]?.description ?? 'FadeOdds Subscription';

                await sendEmail({
                    to: customer.email,
                    subject: "Your Invoice is Ready — Don't Sleep on It",
                    react: React.createElement(BillReadyEmail, {
                        firstName: customer.firstName,
                        amount: formatAmount(invoice.amount_due),
                        planName,
                        dueDate: formatDate(invoice.due_date ?? Math.floor(Date.now() / 1000)),
                        invoiceUrl: invoice.hosted_invoice_url ?? `${appUrl}/account`,
                    }),
                });
                break;
            }

            case 'invoice.payment_succeeded': {
                const invoice = event.data.object as Stripe.Invoice;
                if (!invoice.customer || typeof invoice.customer !== 'string') break;

                const customer = await getCustomerEmail(invoice.customer);
                if (!customer) break;

                const subId = invoiceSubId(invoice);
                const subscription = subId
                    ? await stripe.subscriptions.retrieve(subId)
                    : null;

                const planName = invoice.lines.data[0]?.description ?? 'FadeOdds Subscription';
                const periodEnd = subscription ? subPeriodEnd(subscription) : null;
                const nextBillingDate = periodEnd ? formatDate(periodEnd) : 'N/A';

                await sendEmail({
                    to: customer.email,
                    subject: "Paid. You're Locked In.",
                    react: React.createElement(BillPaidEmail, {
                        firstName: customer.firstName,
                        amount: formatAmount(invoice.amount_paid),
                        planName,
                        nextBillingDate,
                        receiptUrl: invoice.hosted_invoice_url ?? `${appUrl}/account`,
                    }),
                });
                break;
            }

            case 'customer.subscription.created': {
                const sub = event.data.object as Stripe.Subscription;
                if (!sub.customer || typeof sub.customer !== 'string') break;

                const customer = await getCustomerEmail(sub.customer);
                if (!customer) break;

                const planName = sub.items.data[0]?.price.nickname ?? 'FadeOdds Subscription';
                const periodStart = subPeriodStart(sub);

                await sendEmail({
                    to: customer.email,
                    subject: "You're Subscribed. Let's Ride.",
                    react: React.createElement(SubscriptionChangeEmail, {
                        firstName: customer.firstName,
                        changeType: 'created',
                        newPlan: planName,
                        effectiveDate: periodStart ? formatDate(periodStart) : 'Today',
                        manageUrl: `${appUrl}/account`,
                    }),
                });
                break;
            }

            case 'customer.subscription.updated': {
                const sub = event.data.object as Stripe.Subscription;
                const prevSub = event.data.previous_attributes as Partial<Stripe.Subscription>;

                if (!sub.customer || typeof sub.customer !== 'string') break;

                const customer = await getCustomerEmail(sub.customer);
                if (!customer) break;

                const newPlan = sub.items.data[0]?.price.nickname ?? 'FadeOdds Subscription';
                const oldPlanItem = (prevSub?.items as Stripe.ApiList<Stripe.SubscriptionItem> | undefined)?.data?.[0];
                const oldPlan = oldPlanItem?.price?.nickname ?? undefined;

                const newAmount = sub.items.data[0]?.price.unit_amount ?? 0;
                const oldAmount = oldPlanItem?.price?.unit_amount ?? 0;
                const changeType = newAmount > oldAmount ? 'upgraded' : newAmount < oldAmount ? 'downgraded' : 'updated';

                const periodStart = subPeriodStart(sub);

                await sendEmail({
                    to: customer.email,
                    subject: changeType === 'upgraded' ? 'Level Up. New Plan, More Edge.' : 'Your Plan Just Changed.',
                    react: React.createElement(SubscriptionChangeEmail, {
                        firstName: customer.firstName,
                        changeType,
                        newPlan,
                        oldPlan,
                        effectiveDate: periodStart ? formatDate(periodStart) : 'Today',
                        manageUrl: `${appUrl}/account`,
                    }),
                });
                break;
            }

            case 'customer.subscription.deleted': {
                const sub = event.data.object as Stripe.Subscription;
                if (!sub.customer || typeof sub.customer !== 'string') break;

                const customer = await getCustomerEmail(sub.customer);
                if (!customer) break;

                const periodEnd = subPeriodEnd(sub);

                await sendEmail({
                    to: customer.email,
                    subject: 'Sad to See You Go. Good Luck Out There.',
                    react: React.createElement(AccountClosureEmail, {
                        firstName: customer.firstName,
                        accessEndsDate: periodEnd ? formatDate(periodEnd) : 'immediately',
                        reactivateUrl: `${appUrl}/pricing`,
                    }),
                });
                break;
            }

            default:
                // Unhandled event — safe to ignore
                break;
        }
    } catch (err) {
        console.error('[Stripe Webhook] Failed to process event:', event.type, err);
        // Return 200 so Stripe doesn't retry endlessly — log and investigate
    }

    return Response.json({ received: true });
}
