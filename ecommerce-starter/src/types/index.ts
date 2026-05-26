export type SiteConfig = {
  name: string;
  description: string;
  url: string;
  ogImage: string;
  links: {
    github?: string;
  };
};

export type NavItem = {
  title: string;
  href: string;
  disabled?: boolean;
  external?: boolean;
  children?: NavItem[];
};

export type ProductWithRelations = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compareAt: number | null;
  images: string[];
  featured: boolean;
  archived: boolean;
  categoryId: string | null;
  createdAt: Date;
  updatedAt: Date;
  category: { id: string; name: string; slug: string } | null;
  variants: VariantData[];
  reviews: ReviewData[];
};

export type VariantData = {
  id: string;
  name: string;
  sku: string;
  price: number | null;
  stock: number;
  image: string | null;
};

export type ReviewData = {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  createdAt: Date;
  user: { name: string | null; image: string | null };
};

export type CartItemData = {
  id: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    images: string[];
  };
  variant: VariantData | null;
};

export type OrderData = {
  id: string;
  status: string;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  createdAt: Date;
  items: OrderItemData[];
};

export type OrderItemData = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  variant: VariantData | null;
};
