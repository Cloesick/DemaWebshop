'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuote } from '@/contexts/QuoteContext';
import { ChevronDown, Package } from 'lucide-react';

interface EnhancedProductGroupCardProps {
  productGroup: any;
  viewMode?: 'grid' | 'list';
  className?: string;
}

export default function EnhancedProductGroupCard({ 
  productGroup, 
  viewMode = 'grid',
  className = '' 
}: EnhancedProductGroupCardProps) {
  const [imageError, setImageError] = useState(false);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [showAllVariants, setShowAllVariants] = useState(false);
  const { addToQuote } = useQuote();

  // Get selected variant
  const selectedVariant = productGroup.variants?.[selectedVariantIndex] || productGroup.variants?.[0] || {
    sku: 'N/A',
    label: 'No variants available',
    properties: {},
    attributes: {}
  };

  // Get image URL - properly handle paths from documents folder
  const mainImage = productGroup.media?.find((m: any) => m.role === 'main')?.url;
  const imageUrl = mainImage ? `/${mainImage}` : productGroup.images?.[0] ? `/${productGroup.images[0]}` : null;

  // Format property name for display
  const formatPropertyName = (key: string): string => {
    return key
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
      .trim();
  };

  // Get key properties to display
  const getKeyProperties = (variant: any) => {
    const props = variant.properties || {};
    const attrs = variant.attributes || {};
    
    // Priority properties to show first
    const priorityKeys = [
      'type', 'material', 'diameter_mm', 'length_m', 'connection_size',
      'pressure_max_bar', 'flow_m3_h', 'power_w', 'voltage_v'
    ];
    
    const allProps = { ...props, ...attrs };
    const keyProps: Array<{key: string, value: any}> = [];
    
    // Add priority properties first
    priorityKeys.forEach(key => {
      if (allProps[key]) {
        keyProps.push({ key, value: allProps[key] });
      }
    });
    
    // Add remaining properties
    Object.entries(allProps).forEach(([key, value]) => {
      if (!priorityKeys.includes(key) && value && keyProps.length < 6) {
        keyProps.push({ key, value });
      }
    });
    
    return keyProps.slice(0, 6);
  };

  const keyProperties = getKeyProperties(selectedVariant);

  // Determine brand styling
  const isMakita = productGroup.brand === 'Makita' || productGroup.catalog?.toLowerCase().includes('makita');
  const brandColor = isMakita ? 'teal' : 'blue';

  if (viewMode === 'list') {
    return (
      <div className={`flex flex-col md:flex-row bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border-2 ${
        isMakita ? 'border-teal-400' : 'border-blue-300'
      } ${className}`}>
        {/* Image */}
        <div className={`w-full md:w-72 h-72 flex-shrink-0 flex items-center justify-center p-6 relative ${
          isMakita ? 'bg-gradient-to-br from-teal-50 to-cyan-50' : 'bg-gradient-to-br from-blue-50 to-indigo-50'
        }`}>
          {/* Variant Count Badge */}
          <div className={`absolute top-3 left-3 bg-gradient-to-r ${
            isMakita ? 'from-teal-500 to-cyan-500' : 'from-blue-500 to-indigo-500'
          } text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg z-10`}>
            {productGroup.variant_count} Variant{productGroup.variant_count > 1 ? 's' : ''}
          </div>
          
          {imageUrl && !imageError ? (
            <img
              src={imageUrl}
              alt={productGroup.name}
              className="w-full h-full object-contain"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 text-gray-400 rounded-lg">
              <Package className="w-20 h-20 mb-2" />
              <span className="text-sm text-gray-500">{productGroup.name}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-6 flex flex-col">
          {/* Header */}
          <div className="mb-4">
            <Link 
              href={`/product-groups/${productGroup.group_id}`}
              className={`text-2xl font-bold ${isMakita ? 'text-teal-700' : 'text-blue-700'} hover:underline`}
            >
              {productGroup.name}
            </Link>
            <div className="flex gap-2 mt-2 flex-wrap">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                isMakita ? 'bg-teal-100 text-teal-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {productGroup.brand}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                {productGroup.category}
              </span>
            </div>
          </div>

          {/* Variant Selector */}
          {productGroup.variants && productGroup.variants.length > 1 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Variant (SKU: {selectedVariant.sku || 'N/A'})
              </label>
              <select
                value={selectedVariantIndex}
                onChange={(e) => setSelectedVariantIndex(Number(e.target.value))}
                className={`w-full px-4 py-2 border-2 ${
                  isMakita ? 'border-teal-300 focus:ring-teal-500' : 'border-blue-300 focus:ring-blue-500'
                } rounded-lg focus:outline-none focus:ring-2`}
              >
                {productGroup.variants.map((variant: any, index: number) => (
                  <option key={index} value={index}>
                    {variant.sku || `Variant ${index + 1}`} - {variant.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Properties */}
          {keyProperties.length > 0 && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              {keyProperties.map(({ key, value }) => (
                <div key={key} className="flex flex-col">
                  <span className="text-xs text-gray-500 uppercase tracking-wide">
                    {formatPropertyName(key)}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {String(value)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="mt-auto flex gap-3">
            <Link
              href={`/product-groups/${productGroup.group_id}`}
              className={`flex-1 text-center px-6 py-3 ${
                isMakita 
                  ? 'bg-teal-600 hover:bg-teal-700' 
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white font-semibold rounded-lg transition`}
            >
              View Details
            </Link>
            <button
              onClick={() => addToQuote({
                sku: selectedVariant.sku || 'N/A',
                name: productGroup.name,
                category: productGroup.category,
                imageUrl: imageUrl || undefined
              })}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
            >
              Add to Quote
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Grid view (default)
  return (
    <div className={`group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 border-2 ${
      isMakita ? 'border-teal-300 hover:border-teal-500' : 'border-blue-200 hover:border-blue-400'
    } ${className}`}>
      {/* Image */}
      <div className={`relative h-64 flex items-center justify-center p-4 ${
        isMakita ? 'bg-gradient-to-br from-teal-50 to-cyan-50' : 'bg-gradient-to-br from-blue-50 to-indigo-50'
      }`}>
        {/* Variant Badge */}
        <div className={`absolute top-3 right-3 bg-gradient-to-r ${
          isMakita ? 'from-teal-500 to-cyan-500' : 'from-blue-500 to-indigo-500'
        } text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg z-10`}>
          {productGroup.variant_count} Variant{productGroup.variant_count > 1 ? 's' : ''}
        </div>
        
        <Link 
          href={`/product-groups/${productGroup.group_id}`}
          className="w-full h-full flex items-center justify-center"
        >
          {imageUrl && !imageError ? (
            <img
              src={imageUrl}
              alt={productGroup.name}
              className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-300"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-400">
              <Package className="w-16 h-16 mb-2" />
              <span className="text-sm text-gray-500 text-center px-2">{productGroup.name}</span>
            </div>
          )}
        </Link>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Header */}
        <Link 
          href={`/product-groups/${productGroup.group_id}`}
          className="block mb-3"
        >
          <h3 className={`text-lg font-bold ${isMakita ? 'text-teal-700' : 'text-blue-700'} group-hover:underline line-clamp-2 mb-2`}>
            {productGroup.name}
          </h3>
          <div className="flex gap-2 flex-wrap">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              isMakita ? 'bg-teal-100 text-teal-700' : 'bg-blue-100 text-blue-700'
            }`}>
              {productGroup.brand}
            </span>
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
              {productGroup.catalog}
            </span>
          </div>
        </Link>

        {/* Variant Selector for Grid */}
        {productGroup.variants && productGroup.variants.length > 1 && (
          <div className="mb-3">
            <select
              value={selectedVariantIndex}
              onChange={(e) => setSelectedVariantIndex(Number(e.target.value))}
              className={`w-full px-3 py-2 text-sm border ${
                isMakita ? 'border-teal-300' : 'border-blue-300'
              } rounded-lg focus:outline-none focus:ring-2 ${
                isMakita ? 'focus:ring-teal-500' : 'focus:ring-blue-500'
              }`}
            >
              {productGroup.variants.slice(0, 10).map((variant: any, index: number) => (
                <option key={index} value={index}>
                  SKU: {variant.sku || 'N/A'}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Key Properties */}
        {keyProperties.length > 0 && (
          <div className="space-y-2 mb-4 text-sm">
            {keyProperties.slice(0, 4).map(({ key, value }) => (
              <div key={key} className="flex justify-between">
                <span className="text-gray-600">{formatPropertyName(key)}:</span>
                <span className="font-semibold text-gray-900 text-right ml-2 line-clamp-1">
                  {String(value)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          <Link
            href={`/product-groups/${productGroup.group_id}`}
            className={`block w-full text-center px-4 py-2.5 ${
              isMakita 
                ? 'bg-teal-600 hover:bg-teal-700' 
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white font-semibold rounded-lg transition shadow-sm hover:shadow-md`}
          >
            View All Variants
          </Link>
          <button
            onClick={() => addToQuote({
              sku: selectedVariant.sku || 'N/A',
              name: productGroup.name,
              category: productGroup.category,
              imageUrl: imageUrl || undefined
            })}
            className="w-full px-4 py-2.5 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
          >
            Add to Quote
          </button>
        </div>
      </div>
    </div>
  );
}
