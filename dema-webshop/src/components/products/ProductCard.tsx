'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Product } from '@/types/product';
import { formatCurrency } from '@/lib/utils';
import ImageWithFallback from '@/components/ui/ImageWithFallback';
// Using relative import since absolute import might not be resolving correctly
import {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectSeparator,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/store/cartStore';

interface ProductCardProps {
  product: Product;
  className?: string;
  viewMode?: 'grid' | 'list';
}

interface ProductVariant {
  label: string;
  value: string;
}

const formatPropertyName = (key: string): string => {
  // Convert camelCase to Title Case and replace underscores with spaces
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/(\b\w)/g, char => char.toUpperCase())
    .trim();
};

export default function ProductCard({ product, className = '', viewMode = 'grid' }: ProductCardProps) {
  const { addToCart } = useCartStore();
  const [selectedDimensions, setSelectedDimensions] = useState<number | null>(
    product.dimensions_mm_list?.[0] || null
  );
  
  // Use the product name from the product data
  const productName = (product as any).name || product.sku || 'Product';
  // Use the first part of the description as subtitle
  const description = product.description?.split('\n')[0] || '';
  
  const categoryForImage = product.product_category?.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'product';
  
  // Use the image property from product or fallback to a placeholder
  const imageUrl = (product as any).image || `data:image/svg+xml;base64,${btoa(
    `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" preserveAspectRatio="none">
      <rect width="400" height="300" fill="#f3f4f6"/>
      <text x="50%" y="50%" font-family="sans-serif" font-size="16" text-anchor="middle" fill="#9ca3af" dy=".3em">${productName}</text>
    </svg>`
  )}`;
  
  // Format price based on selected dimensions or other logic
  const price = selectedDimensions 
    ? formatCurrency(selectedDimensions * 0.5)
    : formatCurrency(99.99);
  
  // Filter out empty or non-relevant properties for display
  const displayProperties = Object.entries(product).filter(([key, value]: [string, string | number]) => {
    // Skip these internal or already displayed properties
    const skipKeys = [
      'sku', 'pdf_source', 'source_pages', 'product_category', 
      'description', 'image', 'imageUrl', 'dimensions_mm_list'
    ];
    
    return !skipKeys.includes(key) && 
           value !== undefined && 
           value !== null && 
           value !== '' &&
           !Array.isArray(value) &&
           typeof value !== 'object';
  });
  
  const hasDimensions = product.dimensions_mm_list && product.dimensions_mm_list.length > 0;

  if (viewMode === 'list') {
    return (
      <div className={`flex flex-col sm:flex-row bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-card-hover transition-shadow duration-200 ${className}`}>
        <div className="w-full sm:w-48 h-48 bg-gray-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
          <ImageWithFallback
            src={imageUrl}
            alt={productName}
            width={192}
            height={192}
            className="w-full h-full object-contain p-4"
            fallbackText={product.product_category}
          />
        </div>
        <div className="flex-1 p-4 flex flex-col">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 hover:text-primary transition-colors break-words">
              <Link href={`/products/${product.sku}`} className="hover:underline">
                {productName}
              </Link>
            </h3>
            {description && (
              <p className="mt-1 text-sm text-gray-600">{description}</p>
            )}
            <p className="text-xs text-gray-500">SKU: {product.sku}</p>
            {product.product_category && (
              <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                {product.product_category}
              </span>
            )}
            {product.dimensions_mm_list?.[0] && (
              <p className="mt-2 text-sm text-gray-900">
                <span className="font-medium text-gray-900">Size:</span> <span className="text-gray-900">{product.dimensions_mm_list[0]}mm</span>
              </p>
            )}
          </div>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-lg font-bold text-primary">{price}</p>
            <Button className="bg-primary hover:bg-primary-dark text-white" onClick={() => addToCart(product)}>
              Add to Cart
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  // Grid view (default)
  return (
    <div className={`group relative bg-white border border-gray-200 rounded-lg overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-200 ${className}`}>
      <div className="w-full h-48 bg-gray-100 p-4 overflow-hidden flex items-center justify-center">
        <ImageWithFallback
          src={imageUrl}
          alt={productName}
          width={300}
          height={200}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
        />
      </div>
      <div className="p-4">
        <div className="flex flex-col h-full">
          <div className="flex-1">
            <h3 className="text-base font-bold text-gray-900 mb-1 break-words">
              <Link href={`/products/${product.sku}`} className="hover:text-primary transition-colors">
                {productName}
              </Link>
            </h3>
            {description && (
              <p className="text-sm text-gray-600 mb-1 line-clamp-2 h-10">{description}</p>
            )}
            <p className="text-xs text-gray-500 mb-2">SKU: {product.sku}</p>
            {product.product_category && (
              <div className="mb-2">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                  {product.product_category}
                </span>
              </div>
            )}
            
            {/* Dimensions picker for grid view */}
            {hasDimensions && (
              <div className="mt-2">
                <Select
                  value={selectedDimensions?.toString() || ''}
                  onValueChange={(value) => setSelectedDimensions(Number(value))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    {product.dimensions_mm_list?.map((dimension) => (
                      <SelectItem key={dimension} value={dimension.toString()}>
                        {dimension}mm
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {/* Dynamic properties for grid view */}
            <div className="mt-2 space-y-1">
              {displayProperties.slice(0, 3).map(([key, value]: [string, string | number]) => (
                <div key={key} className="flex justify-between text-sm">
                  <span className="text-gray-600">{formatPropertyName(key)}:</span>
                  <span className="font-medium text-gray-900">
                    {typeof value === 'number' 
                      ? key.includes('bar') 
                        ? `${value} bar`
                        : key.includes('kg')
                          ? `${value} kg`
                          : key.includes('mm')
                            ? `${value} mm`
                            : key.includes('kw')
                              ? `${value} kW`
                              : key.includes('hp')
                                ? `${value} HP`
                                : value
                      : value}
                  </span>
                </div>
              ))}
              {displayProperties.length > 3 && (
                <div className="text-xs text-gray-500 text-right">+{displayProperties.length - 3} more</div>
              )}
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-lg font-bold text-primary">{price}</p>
            <button className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Product specs */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          {product.pressure_max_bar && (
            <div className="flex items-center">
              <span className="text-gray-500 mr-1">Pressure:</span>
              <span>{product.pressure_max_bar} bar</span>
            </div>
          )}
          {Array.isArray(product.dimensions_mm_list) && product.dimensions_mm_list.length > 0 && (
            <div className="flex items-center">
              <span className="text-gray-900 mr-1">Sizes:</span>
              <span className="text-gray-900">
                {product.dimensions_mm_list.slice(0, 3).join('mm, ')}mm
                {product.dimensions_mm_list.length > 3 ? '...' : ''}
              </span>
            </div>
          )}
          {product.length_mm && (
            <div className="flex items-center">
              <span className="text-gray-500 mr-1">Length:</span>
              <span>{product.length_mm}mm</span>
            </div>
          )}
          {product.weight_kg && (
            <div className="flex items-center">
              <span className="text-gray-500 mr-1">Weight:</span>
              <span>{product.weight_kg}kg</span>
            </div>
          )}
          {product.power_kw && (
            <div className="flex items-center">
              <span className="text-gray-500 mr-1">Power:</span>
              <span>{product.power_kw} kW</span>
            </div>
          )}
          {product.source_pages?.length > 0 && (
            <div className="col-span-2 text-xs text-gray-400 mt-2">
              Source: Page {product.source_pages.join(', ')}
            </div>
          )}
        </div>
        
        <div className="mt-4">
          <button
            type="button"
            className="btn-primary w-full flex items-center justify-center px-4 py-2 text-sm font-medium"
            onClick={() => {
              addToCart(product);
            }}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
