import { NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';

interface Product {
  sku: string;
  description: string;
  product_category: string;
  dimensions_mm_list?: number[];
  material?: string;
  weight_kg?: number;
  image_url?: string;
  [key: string]: any;
}

export async function GET(
  request: Request,
  { params }: { params: { sku: string } }
) {
  try {
    const { sku } = params;
    
    // Read the JSON file
    const jsonDirectory = path.join(process.cwd(), 'public', 'data');
    const fileContents = await fs.readFile(jsonDirectory + '/Product_pdfs_analysis_v2.json', 'utf8');
    const products: Product[] = JSON.parse(fileContents);
    
    // Find the product by SKU
    const product = products.find(p => p.sku === sku);
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}
