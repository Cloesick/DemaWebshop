'use client';

import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef, useEffect, useState, useCallback } from 'react';
import { Product } from '@/types/product';
import { useInView } from 'react-intersection-observer';
import ImageWithFallback from '@/components/ui/ImageWithFallback';

interface ProductListProps {
  products: Product[];
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  renderProduct?: (product: Product) => React.ReactNode;
  className?: string;
  itemClassName?: string;
}

export function ProductList({
  products,
  loading = false,
  hasMore = false,
  onLoadMore,
  renderProduct,
  className = '',
  itemClassName = '',
}: ProductListProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [initialLoad, setInitialLoad] = useState(true);
  
  // Set up intersection observer for infinite loading
  const [loadMoreRef, inView] = useInView({
    threshold: 0.1,
    triggerOnce: false,
  });

  // Set up virtualization
  const rowVirtualizer = useVirtualizer({
    count: products.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => 400, []), // Estimated height of each item
    overscan: 5,
  });

  // Handle infinite loading
  useEffect(() => {
    if (inView && hasMore && !loading && !initialLoad) {
      onLoadMore?.();
    }
    setInitialLoad(false);
  }, [inView, hasMore, loading, onLoadMore, initialLoad]);

  // Default product renderer
  const defaultRenderProduct = (product: Product) => (
    <div key={product.sku} className={`p-4 border rounded-lg ${itemClassName}`}>
      <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg bg-gray-100">
        <ImageWithFallback
          src={product.imageUrl}
          alt={product.description?.split('\n')[0] || 'Product'}
          width={300}
          height={300}
          className="h-full w-full object-cover object-center"
          fallbackText={product.product_category}
        />
      </div>
      <div className="mt-4">
        <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
          {product.description?.split('\n')[0]}
        </h3>
        <p className="mt-1 text-sm text-gray-500">{product.sku}</p>
        <p className="mt-1 text-sm font-medium text-gray-900">
          {product.dimensions_mm_list?.[0] 
            ? `€${(product.dimensions_mm_list[0] * 0.5).toFixed(2)}`
            : 'Price on request'}
        </p>
      </div>
    </div>
  );

  const renderer = renderProduct || defaultRenderProduct;

  return (
    <div className={`space-y-4 ${className}`}>
      <div
        ref={parentRef}
        className="relative w-full overflow-auto"
        style={{ height: '70vh' }}
      >
        <div
          className="relative w-full"
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const product = products[virtualRow.index];
            return (
              <div
                key={virtualRow.key}
                ref={rowVirtualizer.measureElement}
                data-index={virtualRow.index}
                className="absolute top-0 left-0 w-full"
                style={{
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {renderer(product)}
              </div>
            );
          })}
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-4">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {!loading && hasMore && (
        <div ref={loadMoreRef} className="h-4"></div>
      )}

      {!loading && products.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No products found</p>
        </div>
      )}
    </div>
  );
}

export default ProductList;
