'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import UniversalSpecifications from '@/components/UniversalSpecifications';
import { useQuote } from '@/contexts/QuoteContext';
import { PropertyBadges } from './PropertyBadges';

interface VariantProperty {
  diameter_mm?: number;
  diameter_display?: string;
  pressure_bar?: number;
  pressure_display?: string;
  length_m?: number;
  length_display?: string;
  wall_thickness_mm?: number;
  wall_thickness_display?: string;
  [key: string]: any;
}

interface ProductVariant {
  sku: string;
  label: string;
  properties: VariantProperty;
  attributes: VariantProperty;
  page_in_pdf: number;
}

interface ProductMedia {
  url: string;
  role: string;
}

interface ProductGroup {
  group_id: string;
  type: string;
  catalog: string;
  family: string;
  name: string;
  page_in_pdf: number;
  media: ProductMedia[];
  common_properties: VariantProperty;
  variants: ProductVariant[];
  variant_count: number;
  default_variant_sku: string;
  brand?: string;
  description?: string;
  category?: string;
}

interface ProductGroupWithVariantsProps {
  productGroup: ProductGroup;
  onAddToQuote?: (sku: string) => void;
}

export default function ProductGroupWithVariants({
  productGroup,
  onAddToQuote,
}: ProductGroupWithVariantsProps) {
  const [selectedVariantSku, setSelectedVariantSku] = useState(
    productGroup.default_variant_sku
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const { addToQuote } = useQuote();

  const selectedVariant = productGroup.variants.find(
    (v) => v.sku === selectedVariantSku
  );

  if (!selectedVariant) {
    return null;
  }

  // Get main image - encode special characters for URL
  const mainImage = productGroup.media.find((m) => m.role === 'main')?.url;
  const imageUrl = mainImage ? `/${mainImage}` : null;

  const handleVariantChange = (sku: string) => {
    setSelectedVariantSku(sku);
    setIsDropdownOpen(false);
  };

  const handleAddToQuote = () => {
    const variantData = {
      sku: selectedVariant.sku,
      name: selectedVariant.label,
      imageUrl: imageUrl || undefined,
      category: productGroup.catalog,
      brand: productGroup.brand,
      ...selectedVariant.attributes
    };
    
    addToQuote(variantData);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
    
    if (onAddToQuote) {
      onAddToQuote(selectedVariant.sku);
    }
  };

  // Create full product object for UniversalSpecifications
  const productForSpecs = {
    sku: selectedVariant.sku,
    name: selectedVariant.label,
    catalog: productGroup.catalog,
    brand: productGroup.brand,
    ...selectedVariant.attributes,
    ...productGroup.common_properties,
  };

  return (
    <div className="product-group-card bg-white rounded-lg shadow-lg p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-gray-900">{productGroup.name}</h1>
          {productGroup.brand && (
            <span className="px-4 py-2 bg-gradient-to-r from-[#00ADEF] to-blue-500 text-white font-bold rounded-lg">
              {productGroup.brand}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500">
          {productGroup.variant_count} variants available | {productGroup.catalog}
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Shared Image */}
        <div className="product-image-section">
          <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6 border-2 border-gray-200">
            {imageUrl ? (
              <div className="w-full h-96 flex items-center justify-center">
                <img
                  src={imageUrl}
                  alt={productGroup.name}
                  className="max-w-full max-h-full object-contain"
                  onError={(e) => {
                    console.error('Failed to load image:', imageUrl);
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            ) : (
              <div className="w-full h-96 flex items-center justify-center text-gray-400">
                <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
              Shared Image
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-700 font-semibold">💡 Efficiency</p>
            <p className="text-xs text-blue-600 mt-1">
              This single image serves all {productGroup.variant_count} product variants
            </p>
          </div>
        </div>

        {/* Variant Selector & Properties */}
        <div className="product-details-section">
          {/* Variant Picker */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              📦 Select Product Variant:
            </label>
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full px-4 py-3 text-left bg-white border-2 border-blue-300 rounded-lg shadow-sm hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between transition-all"
              >
                <span className="font-semibold text-gray-900">{selectedVariant.label}</span>
                <ChevronDown
                  className={`w-5 h-5 text-blue-600 transition-transform ${
                    isDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border-2 border-blue-300 rounded-lg shadow-xl max-h-96 overflow-y-auto">
                  {productGroup.variants.map((variant) => (
                    <button
                      key={variant.sku}
                      onClick={() => handleVariantChange(variant.sku)}
                      className={`w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors ${
                        variant.sku === selectedVariantSku
                          ? 'bg-blue-100 font-semibold'
                          : ''
                      }`}
                    >
                      <div className="text-sm">{variant.label}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Property Badges - Colorful tags like the catalog */}
          <PropertyBadges properties={selectedVariant.properties || selectedVariant.attributes} maxDisplay={6} />

          {/* Selected SKU Badge */}
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200">
            <div className="text-sm text-gray-600 mb-1">Selected SKU:</div>
            <div className="text-2xl font-bold text-blue-600">{selectedVariant.sku}</div>
          </div>

          {/* Colorful Specifications with Icons */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span>🔧</span>
              <span>Technical Specifications</span>
            </h3>
            <UniversalSpecifications product={productForSpecs} compact={false} />
          </div>

          {/* Common Properties (if any) */}
          {Object.keys(productGroup.common_properties).length > 0 && (
            <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-700 font-bold mb-2">
                ✓ Common to all variants:
              </p>
              <div className="space-y-1">
                {productGroup.common_properties.pressure_display && (
                  <p className="text-xs text-green-600">
                    • Pressure: {productGroup.common_properties.pressure_display}
                  </p>
                )}
                {productGroup.common_properties.length_display && (
                  <p className="text-xs text-green-600">
                    • Length: {productGroup.common_properties.length_display}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleAddToQuote}
              className={`w-full py-4 text-white font-bold rounded-lg transition-all shadow-md hover:shadow-lg transform hover:scale-105 ${
                justAdded
                  ? 'bg-green-500 hover:bg-green-600'
                  : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
              }`}
            >
              {justAdded ? '✓ Added to Quote!' : '🛒 Request Quote - ' + selectedVariant.sku}
            </button>

            {productGroup.description && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">{productGroup.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Variant Quick Reference Table */}
      <div className="mt-10 border-t-2 pt-8">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span>📋</span>
          <span>All Available Variants</span>
        </h3>
        <div className="overflow-x-auto bg-gray-50 rounded-lg border-2 border-gray-200">
          <table className="min-w-full divide-y divide-gray-300 text-sm">
            <thead className="bg-gradient-to-r from-gray-100 to-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-bold text-gray-700">SKU</th>
                <th className="px-4 py-3 text-left font-bold text-gray-700">Description</th>
                <th className="px-4 py-3 text-center font-bold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {productGroup.variants.map((variant) => (
                <tr
                  key={variant.sku}
                  className={`hover:bg-blue-50 transition-colors ${
                    variant.sku === selectedVariantSku ? 'bg-blue-100' : ''
                  }`}
                >
                  <td className="px-4 py-3 font-bold text-gray-900">{variant.sku}</td>
                  <td className="px-4 py-3 text-gray-600">{variant.label}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleVariantChange(variant.sku)}
                      className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                        variant.sku === selectedVariantSku
                          ? 'bg-blue-500 text-white'
                          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }`}
                    >
                      {variant.sku === selectedVariantSku ? '✓ Selected' : 'Select'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
