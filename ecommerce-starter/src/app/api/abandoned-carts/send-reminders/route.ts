import { NextResponse } from "next/server";
import {
  getRecoverableCheckouts,
  markAsReminded,
  getRecoveryUrl,
  type AbandonedCartItem,
} from "@/lib/abandoned-cart";

/**
 * POST /api/abandoned-carts/send-reminders
 *
 * Processes all eligible abandoned checkouts and sends reminder emails.
 * This endpoint should be called by a cron job (e.g., every hour).
 *
 * In production, integrate with your email provider (SendGrid, Resend, etc.).
 * For now, it logs what would be sent and marks checkouts as reminded.
 */
export async function POST() {
  try {
    const checkouts = await getRecoverableCheckouts();

    const results = [];

    for (const checkout of checkouts) {
      const items: AbandonedCartItem[] = JSON.parse(checkout.items);
      const recoveryUrl = getRecoveryUrl(checkout.recoveryToken);

      // In production, replace this with actual email sending:
      // await sendEmail({
      //   to: checkout.email!,
      //   subject: reminderSubject(checkout.reminderCount),
      //   template: "abandoned-cart",
      //   data: { items, recoveryUrl, subtotal: checkout.subtotal },
      // });

      console.log(`[REMINDER ${checkout.reminderCount + 1}] → ${checkout.email}`);
      console.log(`  Recovery URL: ${recoveryUrl}`);
      console.log(`  Items: ${items.length}, Subtotal: €${(checkout.subtotal / 100).toFixed(2)}`);

      await markAsReminded(checkout.id);

      results.push({
        id: checkout.id,
        email: checkout.email,
        reminderNumber: checkout.reminderCount + 1,
        recoveryUrl,
      });
    }

    return NextResponse.json({
      processed: results.length,
      reminders: results,
    });
  } catch (error) {
    console.error("[SEND_REMINDERS]", error);
    return NextResponse.json({ error: "Failed to send reminders" }, { status: 500 });
  }
}
