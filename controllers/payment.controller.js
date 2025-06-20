const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const FRONTEND_URL = process.env.FRONTEND_URL;

const createCheckoutSession = async (req, res) => {
    const { price, lockerId, duration } = req.body;

    if (!price || typeof price !== 'number') {
        return res.status(400).json({ error: 'Prix invalide' });
    }

    if (!lockerId) {
        return res.status(400).json({ error: 'Locker ID manquant' });
    }

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            line_items: [{
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: `Réservation Casier #${lockerId}`,
                    },
                    unit_amount: price,
                },
                quantity: 1,
            }],
            success_url: `${FRONTEND_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}&lockerId=${lockerId}&duree=${duration}`,
            cancel_url: `${FRONTEND_URL}/lockers`,
        });

        res.status(200).json({ url: session.url });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { createCheckoutSession };
