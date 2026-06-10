import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const discounts = await db.discount.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { redemptions: true } } },
    });

    return NextResponse.json(discounts);
  } catch (error) {
    console.error("[DISCOUNTS_GET]", error);
    return NextResponse.json({ error: "Failed to fetch discounts" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      code,
      description,
      type,
      value,
      minPurchase,
      maxUses,
      maxUsesPerUser,
      appliesToAll,
      productIds,
      categoryIds,
      startsAt,
      expiresAt,
    } = body;

    if (!code || !type || value === undefined) {
      return NextResponse.json(
        { error: "code, type, and value are required" },
        { status: 400 }
      );
    }

    const validTypes = ["PERCENTAGE", "FIXED_AMOUNT", "FREE_SHIPPING", "BUY_X_GET_Y"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `type must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    if (type === "PERCENTAGE" && (value < 0 || value > 100)) {
      return NextResponse.json(
        { error: "Percentage value must be between 0 and 100" },
        { status: 400 }
      );
    }

    const discount = await db.discount.create({
      data: {
        code: code.toUpperCase(),
        description,
        type,
        value,
        minPurchase: minPurchase ?? null,
        maxUses: maxUses ?? null,
        maxUsesPerUser: maxUsesPerUser ?? null,
        appliesToAll: appliesToAll ?? true,
        productIds: productIds ? JSON.stringify(productIds) : null,
        categoryIds: categoryIds ? JSON.stringify(categoryIds) : null,
        startsAt: startsAt ? new Date(startsAt) : new Date(),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    return NextResponse.json(discount, { status: 201 });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "A discount with this code already exists" }, { status: 409 });
    }
    console.error("[DISCOUNTS_POST]", error);
    return NextResponse.json({ error: "Failed to create discount" }, { status: 500 });
  }
}
