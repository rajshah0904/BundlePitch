import express from 'express';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

const stripe = new Stripe(stripeSecret, { apiVersion: '2024-04-10' });
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const app = express();
app.use(express.json());

const PRICE_ID = process.env.STRIPE_PRICE_ID; // monthly plan price id

app.post('/create-checkout-session', async (req, res) => {
  try {
    const { userId } = req.body;
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: PRICE_ID, quantity: 1 }],
      success_url: `${process.env.FRONTEND_URL}/success`,
      cancel_url: `${process.env.FRONTEND_URL}`,
      client_reference_id: userId,
      metadata: { userId },
    });
    res.json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout error', error);
    res.status(500).json({ error: 'Stripe error' });
  }
});

app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature error', err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.metadata.userId;
    await supabase.auth.admin.updateUserById(userId, { user_metadata: { is_subscribed: true } });
  }

  res.json({ received: true });
});

app.listen(3001, () => console.log('Server running on port 3001'));
