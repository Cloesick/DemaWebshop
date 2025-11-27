import { NextResponse } from 'next/server';
import catalogProductsData from '@/data/catalog_products.json';
import catalogIndex from '@/data/catalog_index.json';

const catalogProducts = catalogProductsData as any[];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '24');
  const search = searchParams.get('search')?.toLowerCase() || '';
  const catalog = searchParams.get('catalog') || '';
  
  // Filter products
  let filtered = catalogProducts;
  
  if (search) {
    filtered = filtered.filter((p: any) => 
      p.sku.toLowerCase().includes(search) ||
      p.name.toLowerCase().includes(search) ||
      p.catalog.toLowerCase().includes(search)
    );
  }
  
  if (catalog) {
    filtered = filtered.filter((p: any) => p.pdf_source === catalog);
  }
  
  // Pagination
  const start = (page - 1) * limit;
  const end = start + limit;
  const paginated = filtered.slice(start, end);
  
  return NextResponse.json({
    products: paginated,
    pagination: {
      page,
      limit,
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / limit)
    },
    catalogs: catalogIndex.catalogs
  });
}
