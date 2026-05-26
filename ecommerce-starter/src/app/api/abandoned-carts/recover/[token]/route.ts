import { NextResponse } from "next/server";
import { recoverCart } from "@/lib/abandoned-cart";

export async function GET(
  _request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const result = await recoverCart(params.token);

    if (!result) {
      return NextResponse.json(
        { error: "Recovery link is invalid or expired" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      items: result.items,
      subtotal: result.checkout.subtotal,
      email: result.checkout.email,
    });
  } catch (error) {
    console.error("[ABANDONED_CART_RECOVER]", error);
    return NextResponse.json({ error: "Failed to recover cart" }, { status: 500 });
  }
}
