'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuote } from '@/contexts/QuoteContext';

interface CatalogProductCardProps {
  product: any;
  viewMode?: 'grid' | 'list';
  className?: string;
}

export default function CatalogProductCard({ 
  product, 
  viewMode = 'grid',
  className = '' 
}: CatalogProductCardProps) {
  const [imageError, setImageError] = useState(false);
  const { addToQuote } = useQuote();

  // Get image URL from various possible sources
  const imageUrl = product.imageUrl || 
                   product.media?.find((m: any) => m.role === 'main')?.url ||
                   product.image_paths?.[0];

  // Product name/title
  const productName = product.name || `${product.sku}`;
  const category = product.catalog || product.category || product.product_category || '';
  
  // Check if request quote
  const isRequestQuote = product.priceMode === 'request_quote' || !product.price;

  if (viewMode === 'list') {
    return (
      <Link 
        href={`/catalog/${product.seo?.slug || product.sku.toLowerCase()}`}
        className={`flex flex-col sm:flex-row bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200 ${className}`}
      >
        {/* Image */}
        <div className="w-full sm:w-56 h-56 sm:h-full flex-shrink-0 bg-white flex items-center justify-center p-4">
          {imageUrl && !imageError ? (
            <img
              src={imageUrl}
              alt={productName}
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
        </div>

        {/* Content */}
        <div className="flex-1 p-4 flex flex-col">
          <h3 className="text-lg font-bold text-gray-900 mb-2 transition" style={{ transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#00ADEF'} onMouseLeave={(e) => e.currentTarget.style.color = ''}>
            {productName}
          </h3>
          
          {category && (
            <p className="text-sm text-gray-600 mb-2">📁 {category}</p>
          )}
          
          {product.description && (
            <p className="text-sm text-gray-600 line-clamp-2 mb-3">
              {product.description}
            </p>
          )}

          {/* Technical Specifications */}
          {(product.power_kw || product.voltage_v || product.pressure_max_bar || product.weight_kg || product.flow_l_min || product.diameter_mm || product.length_m || product.material || product.width_mm || product.min_temp_c || product.bearing_type || product.bearing_housing) && (
            <div className="mb-3 flex flex-wrap gap-2">
              {product.power_kw && (
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-50 text-yellow-800 border border-yellow-200">
                  ⚡ {product.power_kw} kW
                </span>
              )}
              {product.voltage_v && (
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-50 text-purple-800 border border-purple-200">
                  🔌 {product.voltage_v} V
                </span>
              )}
              {product.pressure_max_bar && (
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-800 border border-blue-200">
                  🔧 {product.pressure_max_bar} bar
                </span>
              )}
              {product.weight_kg && (
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-50 text-gray-800 border border-gray-200">
                  ⚖️ {product.weight_kg} kg
                </span>
              )}
              {product.flow_l_min && (
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-cyan-50 text-cyan-800 border border-cyan-200">
                  💨 {product.flow_l_min} L/min
                </span>
              )}
              {product.diameter_mm && (
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-50 text-green-800 border border-green-200">
                  📏 {product.diameter_mm} mm ø
                </span>
              )}
              {product.inner_diameter_mm && (
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-800 border border-blue-200">
                  ⊙ {product.inner_diameter_mm} mm (inner ø)
                </span>
              )}
              {product.outer_diameter_mm && (
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-50 text-green-800 border border-green-200">
                  ◯ {product.outer_diameter_mm} mm (outer ø)
                </span>
              )}
              {product.length_m && (
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-teal-50 text-teal-800 border border-teal-200">
                  📐 {product.length_m} m
                </span>
              )}
              {product.material && (
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                  🔬 {product.material}
                </span>
              )}
              {product.width_mm && (
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-lime-50 text-lime-800 border border-lime-200">
                  ↔️ {product.width_mm} mm wide
                </span>
              )}
              {product.thread_size && (
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-rose-50 text-rose-800 border border-rose-200">
                  🔩 {product.thread_size}
                </span>
              )}
              {product.volume_l && (
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-indigo-50 text-indigo-800 border border-indigo-200">
                  🗜️ {product.volume_l} L
                </span>
              )}
              {product.rpm && (
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-orange-50 text-orange-800 border border-orange-200">
                  🔄 {product.rpm} RPM
                </span>
              )}
              {product.min_temp_c && product.max_temp_c && (
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-sky-50 text-sky-800 border border-sky-200">
                  🌡️ {product.min_temp_c}°C to {product.max_temp_c}°C
                </span>
              )}
              {product.bearing_type && (
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-violet-50 text-violet-800 border border-violet-200">
                  🏷️ {product.bearing_type}
                </span>
              )}
              {product.bearing_housing && (
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-pink-50 text-pink-800 border border-pink-200">
                  🏠 {product.bearing_housing}
                </span>
              )}
              {product.pillow_block_bearing && (
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-fuchsia-50 text-fuchsia-800 border border-fuchsia-200">
                  🔩 {product.pillow_block_bearing}
                </span>
              )}
              {product.application && (
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                  🔧 {product.application}
                </span>
              )}
            </div>
          )}

          <div className="mt-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              {product.images?.length > 1 && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  🖼️ {product.images.length} images
                </span>
              )}
              {product.pages?.length > 0 && (
                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                  📄 Page {product.pages.join(', ')}
                </span>
              )}
            </div>
            
            {isRequestQuote ? (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  addToQuote({
                    sku: product.sku,
                    name: productName,
                    imageUrl,
                    category
                  });
                }}
                className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded transition"
              >
                Request Quote
              </button>
            ) : product.price ? (
              <span className="text-lg font-bold text-gray-900">€{product.price.toFixed(2)}</span>
            ) : null}
          </div>

          {/* PDF Links */}
          {product.pdf_source && (
            <div className="mt-3 pt-3 border-t border-gray-100 flex gap-3">
              {/* Link to full PDF catalog */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.open(`/documents/${product.pdf_source}`, '_blank', 'noopener,noreferrer');
                }}
                className="text-xs text-blue-600 hover:underline inline-flex items-center cursor-pointer bg-transparent border-0 p-0"
              >
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Full catalog
              </button>
              
              {/* Link to specific page with SKU highlighted */}
              {product.source_pages && product.source_pages.length > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const page = product.source_pages[0];
                    const viewerUrl = `/pdf-viewer?file=${encodeURIComponent(product.pdf_source)}&page=${page}&sku=${encodeURIComponent(product.sku)}`;
                    window.open(viewerUrl, '_blank', 'noopener,noreferrer');
                  }}
                  className="text-xs text-red-600 hover:underline inline-flex items-center cursor-pointer bg-transparent border-0 p-0"
                >
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  🔴 Page {product.source_pages[0]} (SKU highlighted)
                </button>
              )}
            </div>
          )}
        </div>
      </Link>
    );
  }

  // Grid view (default)
  return (
    <Link 
      href={`/catalog/${product.seo?.slug || product.sku.toLowerCase()}`}
      className={`group bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col ${className}`}
    >
      {/* Image */}
      <div className="w-full h-64 bg-white flex items-center justify-center p-4 relative overflow-hidden">
        {imageUrl && !imageError ? (
          <img
            src={imageUrl}
            alt={productName}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
            <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        
        {/* Image count badge */}
        {product.images?.length > 1 && (
          <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
            +{product.images.length - 1} more
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-base font-bold text-gray-900 mb-2 line-clamp-2 group-hover:transition" style={{ transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#00ADEF'} onMouseLeave={(e) => e.currentTarget.style.color = ''}>
          {productName}
        </h3>
        
        {category && (
          <p className="text-sm text-gray-600 mb-2 truncate">
            <span className="inline-block">📁 {category}</span>
          </p>
        )}

        {/* Technical Specifications */}
        {(product.power_kw || product.voltage_v || product.pressure_max_bar || product.weight_kg || product.flow_l_min || product.diameter_mm || product.length_m || product.material || product.width_mm || product.min_temp_c || product.bearing_type) && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {product.power_kw && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-yellow-50 text-yellow-800 border border-yellow-200">
                ⚡ {product.power_kw} kW
              </span>
            )}
            {product.voltage_v && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-800 border border-purple-200">
                🔌 {product.voltage_v} V
              </span>
            )}
            {product.pressure_max_bar && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-800 border border-blue-200">
                🔧 {product.pressure_max_bar} bar
              </span>
            )}
            {product.weight_kg && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-50 text-gray-800 border border-gray-200">
                ⚖️ {product.weight_kg} kg
              </span>
            )}
            {product.flow_l_min && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-cyan-50 text-cyan-800 border border-cyan-200">
                💨 {product.flow_l_min} L/min
              </span>
            )}
            {product.outer_diameter_mm && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-50 text-green-800 border border-green-200">
                ◯ {product.outer_diameter_mm} mm
              </span>
            )}
            {product.inner_diameter_mm && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-800 border border-blue-200">
                ⊙ {product.inner_diameter_mm} mm
              </span>
            )}
            {product.length_m && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-teal-50 text-teal-800 border border-teal-200">
                📐 {product.length_m} m
              </span>
            )}
            {product.material && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                🔬 {product.material}
              </span>
            )}
            {product.width_mm && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-lime-50 text-lime-800 border border-lime-200">
                ↔️ {product.width_mm} mm
              </span>
            )}
            {product.thread_size && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-rose-50 text-rose-800 border border-rose-200">
                🔩 {product.thread_size}
              </span>
            )}
            {product.volume_l && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-800 border border-indigo-200">
                🗜️ {product.volume_l} L
              </span>
            )}
            {product.rpm && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-orange-50 text-orange-800 border border-orange-200">
                🔄 {product.rpm} RPM
              </span>
            )}
            {product.min_temp_c && product.max_temp_c && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-sky-50 text-sky-800 border border-sky-200">
                🌡️ {product.min_temp_c}°-{product.max_temp_c}°C
              </span>
            )}
            {product.bearing_type && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-violet-50 text-violet-800 border border-violet-200">
                🏷️ {product.bearing_type}
              </span>
            )}
            {product.bearing_housing && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-pink-50 text-pink-800 border border-pink-200">
                🏠 {product.bearing_housing}
              </span>
            )}
          </div>
        )}

        {/* Metadata */}
        <div className="mt-auto pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between mb-2">
            {product.pages?.length > 0 && (
              <span className="text-xs text-gray-500">
                📄 Page {product.pages.join(', ')}
              </span>
            )}
          </div>

          {/* Price or Request Quote */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1">
              {isRequestQuote ? (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    addToQuote({
                      sku: product.sku,
                      name: productName,
                      imageUrl,
                      category
                    });
                  }}
                  className="w-full px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded transition"
                >
                  Request Quote
                </button>
              ) : product.price ? (
                <span className="text-lg font-bold text-gray-900">€{product.price.toFixed(2)}</span>
              ) : (
                <span className="text-sm text-gray-500">Price on request</span>
              )}
            </div>
            
            <button className="px-3 py-1.5 text-white text-xs font-medium rounded transition" style={{ backgroundColor: '#00ADEF' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0099D6'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#00ADEF'}>
              View
            </button>
          </div>
        </div>

        {/* PDF Links */}
        {product.pdf_source && (
          <div className="mt-2 pt-2 border-t border-gray-100 space-y-1">
            {/* Link to full PDF catalog */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.open(`/documents/${product.pdf_source}`, '_blank', 'noopener,noreferrer');
              }}
              className="text-xs text-blue-600 hover:underline inline-flex items-center cursor-pointer bg-transparent border-0 p-0 w-full"
            >
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              View full catalog
            </button>
            
            {/* Link to specific page with SKU highlighted */}
            {product.source_pages && product.source_pages.length > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const page = product.source_pages[0];
                  const viewerUrl = `/pdf-viewer?file=${encodeURIComponent(product.pdf_source)}&page=${page}&sku=${encodeURIComponent(product.sku)}`;
                  window.open(viewerUrl, '_blank', 'noopener,noreferrer');
                }}
                className="text-xs text-red-600 hover:underline inline-flex items-center cursor-pointer bg-transparent border-0 p-0 w-full"
              >
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                🔴 View SKU on page {product.source_pages[0]} (highlighted)
              </button>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
