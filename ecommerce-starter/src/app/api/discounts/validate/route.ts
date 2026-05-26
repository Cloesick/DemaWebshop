import { NextResponse } from "next/server";
import { validateDiscount, type CartItemForDiscount } from "@/lib/discounts";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, items, subtotal, userId } = body as {
      code: string;
      items: CartItemForDiscount[];
      subtotal: number;
      userId?: string;
    };

    if (!code || !items || subtotal === undefined) {
      return NextResponse.json(
        { error: "code, items, and subtotal are required" },
        { status: 400 }
      );
    }

    const result = await validateDiscount(code, items, subtotal, userId);

    return NextResponse.json(result);
  } catch (error) {
    console.error("[DISCOUNT_VALIDATE]", error);
    return NextResponse.json({ error: "Failed to validate discount" }, { status: 500 });
  }
}
