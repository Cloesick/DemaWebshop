'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { useLocale } from '@/contexts/LocaleContext';
import { formatProductForCard } from '@/lib/formatProductForCard';
import { getSkuImagePath } from '@/lib/skuImageMap';

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
  const router = useRouter();
  const addToCart = useCartStore(s => s.addToCart);
  const toggleCart = useCartStore(s => s.toggleCart);
  const itemsCount = useCartStore(s => s.items.length);
  const isOpen = useCartStore(s => s.isOpen);
  const { t } = useLocale();
  const vm = formatProductForCard(product);
  const [selectedDimensions, setSelectedDimensions] = useState<number | null>(
    product.dimensions_mm_list?.[0] || null
  );
  const [skuImage, setSkuImage] = useState<string | null>(null);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const p = await getSkuImagePath(product.sku);
        if (mounted) setSkuImage(p);
      } catch {
        if (mounted) setSkuImage(null);
      }
    })();
    return () => { mounted = false; };
  }, [product.sku]);
  
  const productName = vm.title;
  const description = vm.subtitle;
  const imageUrl = skuImage || vm.image;
  
  // Format price based on selected dimensions or other logic
  const price = vm.priceLabel;
  // Derive PDF file name from URL
  const pdfName = product.pdf_source ? (() => {
    try {
      const u = new URL(product.pdf_source);
      const name = decodeURIComponent(u.pathname.split('/').pop() || 'PDF');
      return name || 'PDF';
    } catch {
      const path = product.pdf_source.split('?')[0];
      const name = decodeURIComponent((path.split('/').pop() || 'PDF'));
      return name || 'PDF';
    }
  })() : null;
  
  const hasDimensions = product.dimensions_mm_list && product.dimensions_mm_list.length > 0;
  // Use unique dimensions to avoid duplicate keys/options
  const uniqueDimensions = Array.from(new Set(product.dimensions_mm_list || []));

  const navigateToDetail = () => {
    router.push(`/products/${product.sku}`);
  };

  const onKeyNavigate: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigateToDetail();
    }
  };

  if (viewMode === 'list') {
    return (
      <div
        className={`flex flex-col sm:flex-row bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-card-hover transition-shadow duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${className}`}
        role="link"
        tabIndex={0}
        onClick={navigateToDetail}
        onKeyDown={onKeyNavigate}
      >
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
            <h3 className="text-lg font-semibold text-gray-900">
              <Link href={`/products/${product.sku}`} className="hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 rounded" aria-label={`${productName} - ${t('products.view_details')}`}>
                {productName}
              </Link>
            </h3>
            {description && (
              <p className="mt-1 text-sm text-gray-700 line-clamp-2">{description}</p>
            )}
            <p className="text-xs text-gray-500">SKU: {product.sku}</p>
            {vm.badges?.[0] && (
              <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                {vm.badges[0]}
              </span>
            )}
            {product.dimensions_mm_list?.[0] && (
              <p className="mt-2 text-sm text-gray-900">
                <span className="font-medium text-gray-900">Size:</span> <span className="text-gray-900">{product.dimensions_mm_list[0]}mm</span>
              </p>
            )}
            {/* PDF link and source pages (list view) */}
            {(product.pdf_source || (product.source_pages && product.source_pages.length > 0)) && (
              <div className="mt-3 space-y-1">
                {product.pdf_source && (
                  <a
                    href={`${product.pdf_source}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
                  >
                    <span>{pdfName}</span>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
                {product.pdf_source && product.source_pages && product.source_pages.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {product.source_pages.map((p) => (
                      <a
                        key={`list-page-${p}`}
                        href={`${product.pdf_source}#page=${p}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="px-2.5 py-1 bg-gray-100 rounded-md text-xs font-medium text-gray-700 hover:underline"
                      >
                        Page {p}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="mt-4 flex items-center justify-between gap-2">
            <p className="text-lg font-bold text-primary">{price}</p>
            <Link href={`/products/${product.sku}`} className="text-sm text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 rounded" aria-label={t('products.view_details')} onClick={(e) => e.stopPropagation()}>
              {t('products.view_details')}
            </Link>
            <Button
              className="bg-primary hover:bg-primary-dark text-white"
              onClick={(e) => {
                e.stopPropagation();
                const wasEmpty = itemsCount === 0;
                const wasClosed = !isOpen;
                addToCart(product);
                if (wasEmpty && wasClosed) {
                  toggleCart();
                }
              }}
            >
              Add to Cart
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  // Grid view (default)
  return (
    <div
      className={`group relative bg-white border border-gray-200 rounded-lg overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${className}`}
      role="link"
      tabIndex={0}
      onClick={navigateToDetail}
      onKeyDown={onKeyNavigate}
    >
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
            <h3 className="text.base font-bold text-gray-900 mb-1 break-words">
              <Link href={`/products/${product.sku}`} className="hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 rounded" onClick={(e) => e.stopPropagation()}>
                {productName}
              </Link>
            </h3>
            {description && (
              <p className="text-sm text-gray-600 mb-1 line-clamp-2 h-10">{description}</p>
            )}
            <p className="text-xs text-gray-500 mb-2">SKU: {product.sku}</p>
            {vm.badges?.length ? (
              <div className="mb-2 flex flex-wrap gap-1">
                {vm.badges.slice(0,2).map((b) => (
                  <span key={b} className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">{b}</span>
                ))}
              </div>
            ) : null}
            
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
                    {uniqueDimensions.map((dimension, index) => (
                      <SelectItem key={`${product.sku}-${dimension}-${index}`} value={`${dimension}`}>
                        {dimension}mm
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {/* Curated specs for grid view */}
            <div className="mt-2 space-y-1">
              {vm.specs.slice(0,3).map(spec => (
                <div key={spec.label} className="flex justify-between text-sm">
                  <span className="text-gray-600">{spec.label}:</span>
                  <span className="font-medium text-gray-900">{spec.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-lg font-bold text-primary">{price}</p>
            <button className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60" onClick={(e) => e.stopPropagation()}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Product specs */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          {vm.specs.map(s => (
            <div key={s.label} className="flex items-center justify-between">
              <span className="text-gray-500 mr-1">{s.label}:</span>
              <span>{s.value}</span>
            </div>
          ))}
          {Array.isArray(product.dimensions_mm_list) && product.dimensions_mm_list.length > 0 && (
            <div className="flex items-center">
              <span className="text-gray-900 mr-1">Sizes:</span>
              <span className="text-gray-900">
                {product.dimensions_mm_list.slice(0, 3).join('mm, ')}mm
                {product.dimensions_mm_list.length > 3 ? '...' : ''}
              </span>
            </div>
          )}
          {/* PDF link and source pages (grid view) */}
          {(product.pdf_source && product.source_pages && product.source_pages.length > 0) && (
            <div className="col-span-2 mt-2 flex flex-col gap-1">
              <a
                href={`${product.pdf_source}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline"
              >
                <span>{pdfName}</span>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
              {product.source_pages && product.source_pages.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {product.source_pages.map((p) => (
                    <a
                      key={`grid-page-${p}`}
                      href={`${product.pdf_source}#page=${p}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="px-2.5 py-1 bg-gray-100 rounded-md text-xs font-medium text-gray-700 hover:underline"
                    >
                      Page {p}
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="mt-4 space-y-2">
          <Link
            href={`/products/${product.sku}`}
            className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 rounded"
            aria-label={t('products.view_details')}
            onClick={(e) => e.stopPropagation()}
          >
            {t('products.view_details')}
          </Link>
          <button
            type="button"
            className="btn-primary w-full flex items-center justify-center px-4 py-2 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
            onClick={(e) => {
              e.stopPropagation();
              const wasEmpty = itemsCount === 0;
              const wasClosed = !isOpen;
              addToCart(product);
              if (wasEmpty && wasClosed) {
                toggleCart();
              }
            }}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
