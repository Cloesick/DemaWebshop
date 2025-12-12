'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuote } from '@/contexts/QuoteContext';
import { ChevronDown } from 'lucide-react';
import UniversalSpecifications from './UniversalSpecifications';
import { PropertyBadges } from './products/PropertyBadges';

interface ProductGroupCardProps {
  productGroup: any;
  viewMode?: 'grid' | 'list';
  className?: string;
}

export default function ProductGroupCard({ 
  productGroup, 
  viewMode = 'grid',
  className = '' 
}: ProductGroupCardProps) {
  const [imageError, setImageError] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [selectedVariantSku, setSelectedVariantSku] = useState(
    productGroup.default_variant_sku || productGroup.variants?.[0]?.sku || ''
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { addToQuote } = useQuote();

  // Get selected variant with better fallback
  const selectedVariant = productGroup.variants?.find((v: any) => v.sku === selectedVariantSku) || productGroup.variants?.[0] || {
    sku: 'N/A',
    label: 'No SKUs available',
    properties: {}
  };

  // Get image URL
  const mainImage = productGroup.media?.find((m: any) => m.role === 'main')?.url;
  const imageUrl = mainImage ? `/${mainImage}` : null;

  // Check if it's from a Makita catalog or Dema
  const isMakita = productGroup.brand === 'Makita' || productGroup.catalog?.toLowerCase().includes('makita');

  if (viewMode === 'list') {
    return (
      <div className={`flex flex-col sm:flex-row bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200 border-2 ${
        isMakita ? 'border-teal-500 ring-2 ring-teal-100' : 'border-blue-300'
      } ${className}`}>
        {/* Image */}
        <Link 
          href={`/product-groups/${productGroup.group_id}`}
          className={`w-full sm:w-56 h-56 sm:h-full flex-shrink-0 flex items-center justify-center p-4 relative ${
            isMakita ? 'bg-gradient-to-br from-teal-50 to-teal-100' : 'bg-gradient-to-br from-blue-50 to-blue-100'
          }`}
        >
          {/* SKU Badge */}
          <div className="absolute top-2 left-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-bold z-10 shadow-lg">
            {productGroup.variant_count} SKUs
          </div>
          
          {imageUrl && !imageError ? (
            <img
              src={imageUrl}
              alt={productGroup.name}
              className="w-full h-full object-contain"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </Link>

        {/* Content */}
        <div className="flex-1 p-4 flex flex-col">
          <Link 
            href={`/product-groups/${productGroup.group_id}`}
            className="block"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-2 transition hover:text-[#00ADEF]">
              {productGroup.name}
            </h3>
          </Link>
          
          {productGroup.catalog && (
            <p className="text-sm text-gray-600 mb-3">📁 {productGroup.catalog}</p>
          )}

          {/* SKU Selector */}
          <div className="mb-3">
            <label className="text-xs font-semibold text-gray-600 mb-1 block">
              Select SKU:
            </label>
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full px-3 py-2 text-left bg-white border-2 border-blue-300 rounded-lg hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300 flex items-center justify-between transition-all text-sm"
              >
                <span className="font-semibold truncate">{selectedVariant?.label || selectedVariant?.sku}</span>
                <ChevronDown
                  className={`w-4 h-4 flex-shrink-0 ml-2 text-blue-600 transition-transform ${
                    isDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isDropdownOpen && productGroup.variants && productGroup.variants.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border-2 border-blue-300 rounded-lg shadow-2xl max-h-72 overflow-y-auto">
                  {productGroup.variants.map((variant: any, idx: number) => (
                    <button
                      key={variant.sku || idx}
                      onClick={() => {
                        setSelectedVariantSku(variant.sku);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors ${
                        variant.sku === selectedVariantSku ? 'bg-blue-100 font-semibold' : ''
                      }`}
                    >
                      {variant.label || variant.sku || 'Unknown SKU'}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* PDF Link and Page */}
          {productGroup.source_pdf && (
            <div className="mb-3 pb-3 border-b border-gray-200">
              <div className="flex flex-col gap-1 text-xs">
                <a
                  href={`/documents/Product_pdfs/${productGroup.source_pdf}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  {productGroup.source_pdf}
                </a>
                {selectedVariant?.page && (
                  <span className="text-gray-600">
                    📖 Page: <span className="font-semibold">{selectedVariant.page}</span>
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Property Badges - Colorful tags */}
          {selectedVariant && (
            <PropertyBadges 
              properties={selectedVariant.properties || selectedVariant.attributes} 
              maxDisplay={12} 
            />
          )}

          {/* Selected Variant Specs */}
          {selectedVariant && (
            <div className="mb-3">
              <UniversalSpecifications 
                product={{
                  ...selectedVariant.attributes,
                  ...productGroup.common_properties,
                  catalog: productGroup.catalog,
                  brand: productGroup.brand
                }} 
                compact={true} 
              />
            </div>
          )}

          <div className="mt-auto flex items-center justify-between gap-2">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const variantData = {
                  sku: selectedVariant.sku,
                  name: selectedVariant.label || selectedVariant.sku,
                  imageUrl: imageUrl || undefined,
                  category: productGroup.catalog,
                  brand: productGroup.brand
                };
                addToQuote(variantData);
                setJustAdded(true);
                setTimeout(() => setJustAdded(false), 1500);
              }}
              className={`flex-1 px-3 py-2 text-white text-sm font-bold rounded transition-all ${
                justAdded 
                  ? 'bg-green-500 hover:bg-green-600' 
                  : 'bg-orange-500 hover:bg-orange-600'
              }`}
            >
              {justAdded ? '✓ Added!' : 'Request Quote'}
            </button>
            
            <Link
              href={`/product-groups/${productGroup.group_id}`}
              className="px-4 py-2 bg-[#00ADEF] text-white text-sm font-bold rounded hover:bg-[#0099d6] transition-colors"
            >
              View All
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div className={`bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-xl transition-all duration-200 border-2 ${
      isMakita ? 'border-teal-500 ring-2 ring-teal-100' : 'border-blue-300'
    } ${className}`}>
      {/* Image */}
      <Link 
        href={`/product-groups/${productGroup.group_id}`}
        className={`relative block w-full h-80 flex items-center justify-center p-4 ${
          isMakita ? 'bg-gradient-to-br from-teal-50 to-teal-100' : 'bg-gradient-to-br from-blue-50 to-blue-100'
        }`}
      >
        {/* SKU Badge */}
        <div className="absolute top-2 left-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1.5 rounded-full text-xs font-bold z-50 shadow-lg">
          {productGroup.variant_count} SKUs
        </div>
        
        {imageUrl && !imageError ? (
          <img
            src={imageUrl}
            alt={productGroup.name}
            className="w-full h-full object-contain"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="p-4">
        <Link href={`/product-groups/${productGroup.group_id}`}>
          <h3 className="text-lg font-bold text-gray-900 mb-2 hover:text-[#00ADEF] transition line-clamp-2">
            {productGroup.name}
          </h3>
        </Link>
        
        {productGroup.catalog && (
          <p className="text-xs text-gray-600 mb-3">📁 {productGroup.catalog}</p>
        )}

        {/* SKU Selector */}
        <div className="mb-3">
          <label className="text-xs font-semibold text-gray-600 mb-1 block">
            Select SKU:
          </label>
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full px-3 py-2 text-left bg-white border-2 border-blue-300 rounded-lg hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300 flex items-center justify-between transition-all text-sm"
            >
              <span className="font-semibold truncate">{selectedVariant?.label || selectedVariant?.sku}</span>
              <ChevronDown
                className={`w-4 h-4 flex-shrink-0 ml-2 text-blue-600 transition-transform ${
                  isDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isDropdownOpen && productGroup.variants && productGroup.variants.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border-2 border-blue-300 rounded-lg shadow-2xl max-h-64 overflow-y-auto">
                {productGroup.variants.map((variant: any, idx: number) => (
                  <button
                    key={variant.sku || idx}
                    onClick={() => {
                      setSelectedVariantSku(variant.sku);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors ${
                      variant.sku === selectedVariantSku ? 'bg-blue-100 font-semibold' : ''
                    }`}
                  >
                    {variant.label || variant.sku || 'Unknown variant'}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* PDF Link and Page */}
        {productGroup.source_pdf && (
          <div className="mb-3 pb-3 border-b border-gray-200">
            <div className="flex flex-col gap-1 text-xs">
              <a
                href={`/documents/Product_pdfs/${productGroup.source_pdf}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                {productGroup.source_pdf}
              </a>
              {selectedVariant?.page && (
                <span className="text-gray-600">
                  📖 Page: <span className="font-semibold">{selectedVariant.page}</span>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Property Badges - Colorful tags */}
        {selectedVariant && (
          <PropertyBadges 
            properties={selectedVariant.properties || selectedVariant.attributes} 
            maxDisplay={12} 
          />
        )}

        {/* Selected Variant Specs */}
        {selectedVariant && (
          <div className="mb-3">
            <UniversalSpecifications 
              product={{
                ...selectedVariant.attributes,
                ...productGroup.common_properties,
                catalog: productGroup.catalog,
                brand: productGroup.brand
              }} 
              compact={true} 
            />
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const variantData = {
                sku: selectedVariant.sku,
                name: selectedVariant.label || selectedVariant.sku,
                imageUrl: imageUrl || undefined,
                category: productGroup.catalog,
                brand: productGroup.brand
              };
              addToQuote(variantData);
              setJustAdded(true);
              setTimeout(() => setJustAdded(false), 1500);
            }}
            className={`flex-1 px-3 py-2 text-white text-sm font-bold rounded transition-all ${
              justAdded 
                ? 'bg-green-500 hover:bg-green-600' 
                : 'bg-orange-500 hover:bg-orange-600'
            }`}
          >
            {justAdded ? '✓' : 'Quote'}
          </button>
          
          <Link
            href={`/product-groups/${productGroup.group_id}`}
            className="px-4 py-2 bg-[#00ADEF] text-white text-sm font-bold rounded hover:bg-[#0099d6] transition-colors"
          >
            View
          </Link>
        </div>
      </div>
    </div>
  );
}
