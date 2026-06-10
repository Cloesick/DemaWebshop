/**
 * Discount Engine
 * Validates and applies discount codes to cart/order totals.
 */

import { db } from "./db";

export interface CartItemForDiscount {
  productId: string;
  categoryId?: string | null;
  price: number; // cents
  quantity: number;
}

export interface DiscountResult {
  valid: boolean;
  error?: string;
  discountId?: string;
  code?: string;
  type?: string;
  description?: string;
  discountAmount: number; // cents saved
  freeShipping: boolean;
}

export async function validateDiscount(
  code: string,
  cartItems: CartItemForDiscount[],
  subtotal: number,
  userId?: string | null
): Promise<DiscountResult> {
  const discount = await db.discount.findUnique({ where: { code: code.toUpperCase() } });

  if (!discount) {
    return { valid: false, error: "Invalid discount code", discountAmount: 0, freeShipping: false };
  }

  // Check if active
  if (!discount.isActive) {
    return { valid: false, error: "This discount is no longer active", discountAmount: 0, freeShipping: false };
  }

  // Check date range
  const now = new Date();
  if (now < discount.startsAt) {
    return { valid: false, error: "This discount is not yet active", discountAmount: 0, freeShipping: false };
  }
  if (discount.expiresAt && now > discount.expiresAt) {
    return { valid: false, error: "This discount has expired", discountAmount: 0, freeShipping: false };
  }

  // Check max uses
  if (discount.maxUses && discount.usedCount >= discount.maxUses) {
    return { valid: false, error: "This discount has reached its usage limit", discountAmount: 0, freeShipping: false };
  }

  // Check per-user limit
  if (userId && discount.maxUsesPerUser) {
    const userRedemptions = await db.discountRedemption.count({
      where: { discountId: discount.id, userId },
    });
    if (userRedemptions >= discount.maxUsesPerUser) {
      return { valid: false, error: "You have already used this discount the maximum number of times", discountAmount: 0, freeShipping: false };
    }
  }

  // Check minimum purchase
  if (discount.minPurchase && subtotal < discount.minPurchase) {
    const minFormatted = (discount.minPurchase / 100).toFixed(2);
    return { valid: false, error: `Minimum purchase of €${minFormatted} required`, discountAmount: 0, freeShipping: false };
  }

  // Calculate applicable items (filter by product/category if not appliesToAll)
  let applicableItems = cartItems;
  if (!discount.appliesToAll) {
    const productIds: string[] = discount.productIds ? JSON.parse(discount.productIds) : [];
    const categoryIds: string[] = discount.categoryIds ? JSON.parse(discount.categoryIds) : [];

    applicableItems = cartItems.filter((item) => {
      if (productIds.length > 0 && productIds.includes(item.productId)) return true;
      if (categoryIds.length > 0 && item.categoryId && categoryIds.includes(item.categoryId)) return true;
      return false;
    });

    if (applicableItems.length === 0) {
      return { valid: false, error: "This discount does not apply to any items in your cart", discountAmount: 0, freeShipping: false };
    }
  }

  const applicableSubtotal = applicableItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Calculate discount amount
  let discountAmount = 0;
  let freeShipping = false;

  switch (discount.type) {
    case "PERCENTAGE":
      discountAmount = Math.round(applicableSubtotal * (discount.value / 100));
      break;
    case "FIXED_AMOUNT":
      discountAmount = Math.min(discount.value, applicableSubtotal);
      break;
    case "FREE_SHIPPING":
      freeShipping = true;
      break;
    case "BUY_X_GET_Y":
      // value represents the free item discount (e.g., cheapest item free)
      const sortedPrices = applicableItems
        .flatMap((item) => Array(item.quantity).fill(item.price))
        .sort((a, b) => a - b);
      if (sortedPrices.length >= 2) {
        discountAmount = sortedPrices[0]; // cheapest item free
      }
      break;
  }

  return {
    valid: true,
    discountId: discount.id,
    code: discount.code,
    type: discount.type,
    description: discount.description ?? `${discount.value}${discount.type === "PERCENTAGE" ? "%" : "¢"} off`,
    discountAmount,
    freeShipping,
  };
}

export async function redeemDiscount(
  discountId: string,
  orderId: string,
  userId: string | null,
  amount: number
) {
  await db.$transaction([
    db.discountRedemption.create({
      data: {
        discountId,
        orderId,
        userId,
        amount,
      },
    }),
    db.discount.update({
      where: { id: discountId },
      data: { usedCount: { increment: 1 } },
    }),
  ]);
}
