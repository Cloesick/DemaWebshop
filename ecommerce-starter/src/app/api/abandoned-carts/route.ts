import { NextResponse } from "next/server";
import {
  trackCheckoutStart,
  getRecoverableCheckouts,
  getAbandonmentStats,
  type AbandonedCartItem,
} from "@/lib/abandoned-cart";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  try {
    if (action === "stats") {
      const stats = await getAbandonmentStats();
      return NextResponse.json(stats);
    }

    if (action === "recoverable") {
      const checkouts = await getRecoverableCheckouts();
      return NextResponse.json(checkouts);
    }

    return NextResponse.json({ error: "Use ?action=stats or ?action=recoverable" }, { status: 400 });
  } catch (error) {
    console.error("[ABANDONED_CARTS_GET]", error);
    return NextResponse.json({ error: "Failed to fetch abandoned carts" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cartId, userId, email, items, subtotal } = body as {
      cartId?: string;
      userId?: string;
      email?: string;
      items: AbandonedCartItem[];
      subtotal: number;
    };

    if (!items || !subtotal) {
      return NextResponse.json(
        { error: "items and subtotal are required" },
        { status: 400 }
      );
    }

    const checkout = await trackCheckoutStart({
      cartId,
      userId,
      email,
      items,
      subtotal,
    });

    return NextResponse.json(checkout, { status: 201 });
  } catch (error) {
    console.error("[ABANDONED_CARTS_POST]", error);
    return NextResponse.json({ error: "Failed to track checkout" }, { status: 500 });
  }
}
