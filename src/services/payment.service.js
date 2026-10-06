import crypto from 'node:crypto';
import { ApiError } from '../utils/ApiError.js';

/**
 * Mock payment gateway.
 *
 * To go live, replace the body of `chargePayment` with a real gateway:
 *  - Razorpay: create an order server-side, open Razorpay Checkout on the client,
 *    then verify the returned signature here before marking the order paid.
 *  - Stripe: create a PaymentIntent here and confirm it on the client.
 * Never send full card numbers to this server — real gateways tokenise them on the client.
 */
export async function chargePayment({ method, amount, details = {} }) {
  if (method === 'cod') return { status: 'pending', transactionId: null };

  await new Promise((r) => setTimeout(r, 800)); // simulate gateway latency

  // Test hook: a card ending in 0000 is declined.
  if (method === 'card' && details.cardLast4 === '0000') {
    throw ApiError.badRequest('Payment declined by bank. Please try another card.');
  }
  if (method === 'upi' && !/^[\w.-]{2,}@[a-zA-Z]{2,}$/.test(details.upiId ?? '')) {
    throw ApiError.badRequest('Invalid UPI ID.');
  }

  return {
    status: 'paid',
    transactionId: `TXN${crypto.randomBytes(5).toString('hex').toUpperCase()}`,
    amount,
  };
}
