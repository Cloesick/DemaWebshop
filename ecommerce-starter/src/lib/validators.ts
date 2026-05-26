import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1),
  description: z.string().optional(),
  price: z.number().int().positive("Price must be positive"),
  compareAt: z.number().int().positive().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  images: z.array(z.string().url()).default([]),
  featured: z.boolean().default(false),
  archived: z.boolean().default(false),
});

export const variantSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  price: z.number().int().positive().optional().nullable(),
  stock: z.number().int().min(0).default(0),
  image: z.string().url().optional().nullable(),
});

export const cartItemSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().optional().nullable(),
  quantity: z.number().int().min(1).default(1),
});

export const addressSchema = z.object({
  name: z.string().min(1, "Name is required"),
  line1: z.string().min(1, "Address is required"),
  line2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().optional(),
  postalCode: z.string().min(1, "Postal code is required"),
  country: z.string().min(1, "Country is required"),
  isDefault: z.boolean().default(false),
});

export const checkoutSchema = z.object({
  addressId: z.string().min(1),
  notes: z.string().optional(),
});

export const reviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  title: z.string().optional(),
  body: z.string().optional(),
});

export type ProductInput = z.infer<typeof productSchema>;
export type VariantInput = z.infer<typeof variantSchema>;
export type CartItemInput = z.infer<typeof cartItemSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
