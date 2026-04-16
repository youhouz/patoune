// ---------------------------------------------------------------------------
// Pépète Plus — Stripe Checkout (hosted) + webhook + billing portal.
// Monetization: subscription plans only (monthly / yearly).
// ---------------------------------------------------------------------------

const User = require('../models/User');
const Payment = require('../models/Payment');

let stripeClient = null;
function getStripe() {
  if (stripeClient) return stripeClient;
  if (!process.env.STRIPE_SECRET_KEY) return null;
  const Stripe = require('stripe');
  stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-12-18.acacia',
    appInfo: { name: 'Pepete', version: '1.0.0' },
  });
  return stripeClient;
}

function pickPriceId(plan) {
  if (plan === 'yearly') return process.env.STRIPE_PRICE_YEARLY;
  return process.env.STRIPE_PRICE_MONTHLY;
}

function publicPlans() {
  return [
    {
      id: 'monthly',
      name: 'Mensuel',
      price: 2.99,
      currency: 'EUR',
      period: 'mois',
      priceId: process.env.STRIPE_PRICE_MONTHLY || null,
    },
    {
      id: 'yearly',
      name: 'Annuel',
      price: 19.99,
      currency: 'EUR',
      period: 'an',
      discount: '-44%',
      priceId: process.env.STRIPE_PRICE_YEARLY || null,
    },
  ];
}

// @desc    Lister les plans + etat de l'abonnement courant
// @route   GET /api/payments/status
exports.getStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Utilisateur introuvable' });
    }

    res.json({
      success: true,
      plans: publicPlans(),
      subscription: {
        isPremium: user.isPremium(),
        status: user.subscriptionStatus,
        plan: user.subscriptionPlan,
        premiumUntil: user.premiumUntil,
        aiQueriesToday: user.aiQueriesToday || 0,
        scansToday: user.scansToday || 0,
        limits: {
          aiQueries: 5,
          scans: 10,
        },
      },
      stripeConfigured: Boolean(process.env.STRIPE_SECRET_KEY),
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Creer une session Stripe Checkout et renvoyer son URL (redirect hosted)
// @route   POST /api/payments/create-checkout-session  { plan: 'monthly'|'yearly' }
exports.createCheckoutSession = async (req, res, next) => {
  try {
    const stripe = getStripe();
    if (!stripe) {
      return res.status(503).json({
        success: false,
        error: 'Paiements non configures. Contactez le support.'
      });
    }

    const { plan = 'monthly' } = req.body || {};
    if (!['monthly', 'yearly'].includes(plan)) {
      return res.status(400).json({ success: false, error: 'Plan invalide' });
    }

    const priceId = pickPriceId(plan);
    if (!priceId) {
      return res.status(503).json({
        success: false,
        error: 'Plan non configure dans Stripe (STRIPE_PRICE_* manquant).'
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Utilisateur introuvable' });
    }

    // Reuse or create Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: user._id.toString() },
      });
      customerId = customer.id;
      user.stripeCustomerId = customerId;
      await user.save();
    }

    const clientUrl = process.env.CLIENT_URL || 'https://pepete.fr';
    const successUrl = `${clientUrl}/?subscription=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${clientUrl}/?subscription=cancel`;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      // Apple Pay / Google Pay / card available by default on Checkout
      locale: 'fr',
      client_reference_id: user._id.toString(),
      subscription_data: {
        metadata: { userId: user._id.toString(), plan },
      },
      metadata: { userId: user._id.toString(), plan },
    });

    res.json({ success: true, url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('[payments] createCheckoutSession error:', err.message);
    next(err);
  }
};

// @desc    Ouvrir le portail Stripe pour gerer l'abonnement (resilier, changer de carte, factures)
// @route   POST /api/payments/portal
exports.createPortalSession = async (req, res, next) => {
  try {
    const stripe = getStripe();
    if (!stripe) {
      return res.status(503).json({ success: false, error: 'Paiements non configures' });
    }

    const user = await User.findById(req.user.id);
    if (!user?.stripeCustomerId) {
      return res.status(400).json({
        success: false,
        error: "Aucun abonnement trouve. Souscrivez d'abord a Pepete Plus."
      });
    }

    const clientUrl = process.env.CLIENT_URL || 'https://pepete.fr';
    const portal = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${clientUrl}/?subscription=managed`,
    });

    res.json({ success: true, url: portal.url });
  } catch (err) {
    console.error('[payments] createPortalSession error:', err.message);
    next(err);
  }
};

// ─── Webhook handler ────────────────────────────────────────────────────────
// Source of truth: Stripe tells us when to flip premium on/off.
// NOTE: the route must use express.raw({ type: 'application/json' }) so that
// req.body is a Buffer and the signature can be verified.

async function upsertSubscription(subscription) {
  const userId = subscription.metadata?.userId;
  if (!userId) return;

  const user = await User.findById(userId);
  if (!user) return;

  const status = subscription.status; // active, trialing, past_due, canceled, unpaid, incomplete, incomplete_expired
  const priceId = subscription.items?.data?.[0]?.price?.id;
  let plan = subscription.metadata?.plan || null;
  if (!plan && priceId) {
    if (priceId === process.env.STRIPE_PRICE_YEARLY) plan = 'yearly';
    else if (priceId === process.env.STRIPE_PRICE_MONTHLY) plan = 'monthly';
  }

  user.stripeSubscriptionId = subscription.id;
  user.subscriptionStatus = status;
  user.subscriptionPlan = plan;
  if (subscription.current_period_end) {
    user.premiumUntil = new Date(subscription.current_period_end * 1000);
  }
  user.hasEverSubscribed = true;
  await user.save();
}

async function recordInvoicePayment(invoice) {
  if (!invoice.customer) return;
  const user = await User.findOne({ stripeCustomerId: invoice.customer });
  if (!user) return;

  const priceId = invoice.lines?.data?.[0]?.price?.id;
  let plan = null;
  if (priceId === process.env.STRIPE_PRICE_YEARLY) plan = 'yearly';
  else if (priceId === process.env.STRIPE_PRICE_MONTHLY) plan = 'monthly';

  await Payment.updateOne(
    { stripeInvoiceId: invoice.id },
    {
      $set: {
        user: user._id,
        stripeCustomerId: invoice.customer,
        stripeSubscriptionId: invoice.subscription || null,
        stripePaymentIntentId: invoice.payment_intent || null,
        plan,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        status: invoice.status === 'paid' ? 'succeeded' : invoice.status,
        paidAt: invoice.status_transitions?.paid_at
          ? new Date(invoice.status_transitions.paid_at * 1000)
          : new Date(),
        periodStart: invoice.period_start ? new Date(invoice.period_start * 1000) : null,
        periodEnd: invoice.period_end ? new Date(invoice.period_end * 1000) : null,
        receiptUrl: invoice.hosted_invoice_url || null,
      },
    },
    { upsert: true }
  );
}

// @desc    Stripe webhook
// @route   POST /api/payments/webhook
exports.webhook = async (req, res) => {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !webhookSecret) {
    return res.status(503).json({ success: false, error: 'Webhook non configure' });
  }

  const signature = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
  } catch (err) {
    console.error('[stripe webhook] signature error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        if (session.mode === 'subscription' && session.subscription) {
          const sub = await stripe.subscriptions.retrieve(session.subscription);
          await upsertSubscription(sub);
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        await upsertSubscription(event.data.object);
        break;
      }
      case 'invoice.paid':
      case 'invoice.payment_succeeded': {
        await recordInvoicePayment(event.data.object);
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        if (invoice.customer) {
          const user = await User.findOne({ stripeCustomerId: invoice.customer });
          if (user) {
            user.subscriptionStatus = 'past_due';
            await user.save();
          }
        }
        break;
      }
      default:
        // Events we do not handle explicitly
        break;
    }
    res.json({ received: true });
  } catch (err) {
    console.error('[stripe webhook] handler error:', err.message);
    res.status(500).json({ received: false });
  }
};
