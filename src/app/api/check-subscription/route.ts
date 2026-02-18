import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

function buildTierMap() {
    return {
        [process.env.STRIPE_PRICE_GO]:   'go',
        [process.env.STRIPE_PRICE_PLUS]: 'plus',
        [process.env.STRIPE_PRICE_PRO]:  'pro',
    };
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') { res.status(200).end(); return; }
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { customerId } = req.body;
    if (!customerId) return res.status(200).json({ tier: 'free' });

    try {
        const subscriptions = await stripe.subscriptions.list({
            customer: customerId,
            status: 'active',
            limit: 1,
            expand: ['data.items.data.price'],
        });

        if (!subscriptions.data.length) {
            return res.status(200).json({ tier: 'free' });
        }

        const priceId = subscriptions.data[0].items?.data?.[0]?.price?.id;
        const tierMap = buildTierMap();
        const tier = tierMap[priceId] || 'free';

        return res.status(200).json({ tier });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
