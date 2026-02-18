import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') { res.status(200).end(); return; }
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { customerId } = req.body;
    if (!customerId) return res.status(400).json({ error: 'Missing customerId' });

    const returnUrl = req.headers.origin || process.env.APP_URL || 'https://fadeodds.vercel.app';

    try {
        const session = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: returnUrl,
        });
        return res.status(200).json({ url: session.url });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
