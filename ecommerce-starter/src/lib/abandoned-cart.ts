/**
 * Abandoned Cart Recovery
 * Tracks incomplete checkouts and provides recovery mechanisms.
 */

import { db } from "./db";

const ABANDONMENT_THRESHOLD_MS = 60 * 60 * 1000; // 1 hour after last activity
const EXPIRY_DAYS = 30; // stop trying after 30 days
const MAX_REMINDERS = 3;

export interface AbandonedCartItem {
  productId: string;
  variantId?: string | null;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

/**
 * Called when a user begins checkout (enters email/payment page).
 * Creates an abandoned checkout record that will be used for recovery
 * if they don't complete the purchase.
 */
export async function trackCheckoutStart(params: {
  cartId?: string;
  userId?: string | null;
  email?: string | null;
  items: AbandonedCartItem[];
  subtotal: number;
}) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + EXPIRY_DAYS);

  const abandoned = await db.abandonedCheckout.create({
    data: {
      cartId: params.cartId,
      userId: params.userId,
      email: params.email,
      items: JSON.stringify(params.items),
      subtotal: params.subtotal,
      expiresAt,
    },
  });

  return abandoned;
}

/**
 * Called when an order is successfully placed.
 * Marks any matching abandoned checkout as recovered.
 */
export async function markAsRecovered(params: {
  email?: string | null;
  userId?: string | null;
  cartId?: string | null;
}) {
  const where: any = {
    status: { in: ["ABANDONED", "REMINDED"] },
  };

  if (params.email) where.email = params.email;
  else if (params.userId) where.userId = params.userId;
  else if (params.cartId) where.cartId = params.cartId;
  else return;

  await db.abandonedCheckout.updateMany({
    where,
    data: {
      status: "RECOVERED",
      recoveredAt: new Date(),
    },
  });
}

/**
 * Gets all abandoned checkouts that are eligible for a reminder email.
 * Criteria:
 * - Status is "ABANDONED" or "REMINDED" (but under max reminders)
 * - Created more than 1 hour ago (threshold)
 * - Not expired
 * - Has an email address
 */
export async function getRecoverableCheckouts() {
  const thresholdDate = new Date(Date.now() - ABANDONMENT_THRESHOLD_MS);
  const now = new Date();

  return db.abandonedCheckout.findMany({
    where: {
      status: { in: ["ABANDONED", "REMINDED"] },
      email: { not: null },
      reminderCount: { lt: MAX_REMINDERS },
      createdAt: { lt: thresholdDate },
      expiresAt: { gt: now },
    },
    orderBy: { createdAt: "asc" },
  });
}

/**
 * Marks a checkout as reminded (after sending email).
 */
export async function markAsReminded(checkoutId: string) {
  await db.abandonedCheckout.update({
    where: { id: checkoutId },
    data: {
      status: "REMINDED",
      remindedAt: new Date(),
      reminderCount: { increment: 1 },
    },
  });
}

/**
 * Get recovery URL for a specific abandoned checkout.
 */
export function getRecoveryUrl(recoveryToken: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return `${baseUrl}/checkout/recover/${recoveryToken}`;
}

/**
 * Recover a cart from a recovery token.
 * Returns the cart items to restore into the user's session.
 */
export async function recoverCart(recoveryToken: string) {
  const checkout = await db.abandonedCheckout.findUnique({
    where: { recoveryToken },
  });

  if (!checkout) return null;
  if (checkout.status === "RECOVERED") return null;
  if (checkout.expiresAt < new Date()) return null;

  const items: AbandonedCartItem[] = JSON.parse(checkout.items);
  return { checkout, items };
}

/**
 * Expire old abandoned checkouts (run as a cron job or scheduled task).
 */
export async function expireOldCheckouts() {
  const now = new Date();

  const result = await db.abandonedCheckout.updateMany({
    where: {
      status: { in: ["ABANDONED", "REMINDED"] },
      expiresAt: { lt: now },
    },
    data: { status: "EXPIRED" },
  });

  return result.count;
}

/**
 * Get abandonment analytics.
 */
export async function getAbandonmentStats() {
  const [total, recovered, reminded, abandoned] = await Promise.all([
    db.abandonedCheckout.count(),
    db.abandonedCheckout.count({ where: { status: "RECOVERED" } }),
    db.abandonedCheckout.count({ where: { status: "REMINDED" } }),
    db.abandonedCheckout.count({ where: { status: "ABANDONED" } }),
  ]);

  return {
    total,
    recovered,
    reminded,
    abandoned,
    recoveryRate: total > 0 ? ((recovered / total) * 100).toFixed(1) : "0",
  };
}
