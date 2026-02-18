import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PRICE_IDS = {
    go:   process.env.STRIPE_PRICE_GO,
    plus: process.env.STRIPE_PRICE_PLUS,
    pro:  process.env.STRIPE_PRICE_PRO,
};

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') { res.status(200).end(); return; }
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { email, tier } = req.body;

    if (!email || !tier) return res.status(400).json({ error: 'Missing email or tier' });

    const priceId = PRICE_IDS[tier];
    if (!priceId) return res.status(400).json({ error: `Unknown tier: ${tier}. Set STRIPE_PRICE_${tier.toUpperCase()} in env vars.` });

    const origin = req.headers.origin || process.env.APP_URL || 'https://fadeodds.vercel.app';

    try {
        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            customer_email: email,
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: `${origin}/?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/`,
            allow_promotion_codes: true,
        });

        return res.status(200).json({ url: session.url });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
