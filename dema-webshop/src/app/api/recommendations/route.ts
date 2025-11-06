import { NextResponse } from 'next/server';
import { getProducts } from '@/lib/products';

function param(params: URLSearchParams, key: string, fallback?: string) {
  const v = params.get(key);
  return v === null ? fallback : v;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(12, Math.max(1, parseInt(param(searchParams, 'limit', '4') || '4')));
    const category = param(searchParams, 'category') || undefined;
    const preferredCategory = param(searchParams, 'preferredCategory') || undefined;
    const personalized = (param(searchParams, 'personalized', 'false') || 'false') === 'true';

    const all = await getProducts();

    let pool = all;
    if (category) {
      pool = pool.filter(p => p.product_category === category);
    }

    let ranked = pool;
    if (personalized && preferredCategory) {
      const preferred = pool.filter(p => p.product_category === preferredCategory);
      const others = pool.filter(p => p.product_category !== preferredCategory);
      ranked = [...preferred, ...others];
    } else {
      ranked = [...pool].sort((a, b) => {
        const ra = (a.rating ?? 0);
        const rb = (b.rating ?? 0);
        if (rb !== ra) return rb - ra;
        const ia = a.inStock ? 1 : 0;
        const ib = b.inStock ? 1 : 0;
        if (ib !== ia) return ib - ia;
        const pa = a.price ?? Number.MAX_SAFE_INTEGER;
        const pb = b.price ?? Number.MAX_SAFE_INTEGER;
        return pa - pb;
      });
    }

    const items = ranked.slice(0, limit).map(p => ({
      sku: p.sku,
      name: p.name,
      description: p.description,
      imageUrl: p.imageUrl,
      product_category: p.product_category,
      price: p.price,
      rating: p.rating,
      inStock: p.inStock,
    }));

    return NextResponse.json({ items, personalized: Boolean(personalized && preferredCategory) });
  } catch (e: any) {
    return NextResponse.json({ error: 'Failed to generate recommendations', message: e?.message || 'Unknown error' }, { status: 500 });
  }
}
