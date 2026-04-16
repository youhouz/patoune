// ---------------------------------------------------------------------------
// Pepete Plus — Stripe payments API
// ---------------------------------------------------------------------------

import api from './client';

// GET /api/payments/status
// -> { subscription: { isPremium, status, plan, premiumUntil, ... }, plans: [...] }
export const getPaymentStatusAPI = () => api.get('/payments/status');

// POST /api/payments/create-checkout-session { plan: 'monthly' | 'yearly' }
// -> { url } — open in browser, user pays via Stripe Checkout (Apple/Google Pay/CB)
export const createCheckoutSessionAPI = (plan) =>
  api.post('/payments/create-checkout-session', { plan });

// POST /api/payments/portal
// -> { url } — Stripe billing portal to manage/cancel the subscription
export const createPortalSessionAPI = () => api.post('/payments/portal');
