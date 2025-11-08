import Image from 'next/image';
import { Product } from '@/types/product';
import { formatCurrency } from '@/lib/utils';

interface ProductDetailsCardProps {
  product: Product;
  className?: string;
}

const renderSpecificationSection = (title: string, content: React.ReactNode, className = '') => (
  <div className={className}>
    <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>
    <div className="text-sm text-gray-900">
      {content || 'N/A'}
    </div>
  </div>
);

const renderList = (items: any[], key: string, unit: string = '') => (
  <div className="flex flex-wrap gap-2">
    {items.map((item, index) => (
      <span key={`${key}-${index}`} className="px-2.5 py-1 bg-gray-100 rounded-md text-xs font-medium text-gray-700">
        {item}{unit}
      </span>
    ))}
  </div>
);

export default function ProductDetailsCard({ product, className = '' }: ProductDetailsCardProps) {
  const title = product.description?.split('\n')[0] || 'Product';
  
  // Generate a placeholder color based on product SKU or category
  const getPlaceholderColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 70%, 90%)`;
  };

  const categoryForImage = product.product_category?.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'product';
  const placeholderColor = getPlaceholderColor(product.sku || categoryForImage);
  const imageUrl = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Crect width='800' height='600' fill='${encodeURIComponent(placeholderColor)}'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='24' text-anchor='middle' dominant-baseline='middle' fill='%23666'%3E${encodeURIComponent(categoryForImage)}%3C/text%3E%3C/svg%3E`;
  
  // Calculate price based on dimensions or use a default
  const price = product.dimensions_mm_list?.[0] 
    ? formatCurrency(product.dimensions_mm_list[0] * 0.5)
    : formatCurrency(99.99);

  // Check if there are any specifications to show
  const hasSpecifications = [
    product.pressure_min_bar !== undefined,
    product.power_hp || product.power_kw,
    product.voltage_v,
    product.frequency_hz,
    product.connection_types?.length,
    product.dimensions_mm_list?.length,
    product.length_mm || product.width_mm || product.height_mm,
    product.weight_kg,
    product.noise_level_db,
    product.airflow_l_min,
    product.tank_capacity_l
  ].some(Boolean);

  return (
    <div className={`bg-white shadow-lg overflow-hidden rounded-xl ${className}`}>
      {/* Header with title and price */}
      <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{title}</h1>
            {product.product_category && (
              <div className="mt-1 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {product.product_category}
              </div>
            )}
            {product.sku && (
              <p className="mt-2 text-sm text-gray-500">SKU: {product.sku}</p>
            )}
          </div>
          <div className="flex flex-col items-end">
            <span className="text-3xl font-bold text-primary">{price}</span>
            <div className="mt-3 flex gap-3">
              <button className="px-6 py-2.5 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-colors shadow-sm">
                Request Quote
              </button>
              <button className="px-6 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors shadow-sm">
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column - Image and basic info */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-lg overflow-hidden border border-gray-200 p-4 flex items-center justify-center h-64">
              <Image
                src={imageUrl}
                alt={title}
                width={400}
                height={300}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900">Product Details</h3>
              <div className="space-y-3">
                {product.pdf_source && (
                  <div>
                    <p className="text-sm text-gray-500">Pdf Source</p>
                    <a 
                      href={product.pdf_source} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1.5"
                    >
                      <span>View Product PDF</span>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                )}
                
                {product.pdf_source && product.source_pages?.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-500">Pdf Source Page</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {product.source_pages.map((p) => (
                        <a
                          key={`page-${p}`}
                          href={`${product.pdf_source}#page=${p}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 bg-gray-100 rounded-md text-xs font-medium text-gray-700 hover:underline"
                        >
                          Page {p}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Right column - Specifications */}
          <div className="lg:col-span-2">
            {hasSpecifications ? (
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Technical Specifications</h2>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Pressure Range */}
                    {product.pressure_min_bar !== undefined && product.pressure_max_bar !== undefined && (
                      <div className="space-y-1">
                        <h4 className="text-sm font-medium text-gray-500">Pressure Range</h4>
                        <p className="text-gray-900">
                          {product.pressure_min_bar} - {product.pressure_max_bar} bar
                        </p>
                      </div>
                    )}
                    
                    {/* Power */}
                    {(product.power_hp || product.power_kw) && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-500">Power</h4>
                        <div className="flex flex-wrap gap-4">
                          {product.power_hp && (
                            <div>
                              <span className="text-gray-900 font-medium">{product.power_hp} </span>
                              <span className="text-gray-500">HP</span>
                            </div>
                          )}
                          {product.power_kw && (
                            <div>
                              <span className="text-gray-900 font-medium">{product.power_kw} </span>
                              <span className="text-gray-500">kW</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Voltage & Frequency */}
                    {(product.voltage_v || product.frequency_hz) && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-500">Electrical</h4>
                        <div className="flex flex-wrap gap-4">
                          {product.voltage_v && (
                            <div>
                              <span className="text-gray-900 font-medium">{product.voltage_v} </span>
                              <span className="text-gray-500">V</span>
                            </div>
                          )}
                          {product.frequency_hz && (
                            <div>
                              <span className="text-gray-900 font-medium">{product.frequency_hz} </span>
                              <span className="text-gray-500">Hz</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Connection Types */}
                    {product.connection_types?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Connection Types</h4>
                        <div className="mt-1">
                          {renderList(product.connection_types || [], 'conn')}
                        </div>
                      </div>
                    )}
                    
                    {/* Dimensions */}
                    {(product.length_mm || product.width_mm || product.height_mm) && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-500">Dimensions (mm)</h4>
                        <div className="grid grid-cols-3 gap-4">
                          {product.length_mm && (
                            <div>
                              <p className="text-xs text-gray-500">Length</p>
                              <p className="text-gray-900">{product.length_mm} mm</p>
                            </div>
                          )}
                          {product.width_mm && (
                            <div>
                              <p className="text-xs text-gray-500">Width</p>
                              <p className="text-gray-900">{product.width_mm} mm</p>
                            </div>
                          )}
                          {product.height_mm && (
                            <div>
                              <p className="text-xs text-gray-500">Height</p>
                              <p className="text-gray-900">{product.height_mm} mm</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Available Sizes */}
                    {product.dimensions_mm_list?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Available Sizes</h4>
                        <div className="mt-1">
                          {renderList(product.dimensions_mm_list || [], 'size', ' mm')}
                        </div>
                      </div>
                    )}
                    
                    {/* Additional Specifications */}
                    <div className="space-y-4 col-span-full pt-4 border-t border-gray-200">
                      <h4 className="text-sm font-medium text-gray-500">Additional Specifications</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {product.weight_kg && (
                          <div>
                            <p className="text-xs text-gray-500">Weight</p>
                            <p className="text-gray-900">{product.weight_kg} kg</p>
                          </div>
                        )}
                        {product.noise_level_db && (
                          <div>
                            <p className="text-xs text-gray-500">Noise Level</p>
                            <p className="text-gray-900">{product.noise_level_db} dB</p>
                          </div>
                        )}
                        {product.airflow_l_min && (
                          <div>
                            <p className="text-xs text-gray-500">Airflow</p>
                            <p className="text-gray-900">{product.airflow_l_min} L/min</p>
                          </div>
                        )}
                        {product.tank_capacity_l && (
                          <div>
                            <p className="text-xs text-gray-500">Tank Capacity</p>
                            <p className="text-gray-900">{product.tank_capacity_l} L</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No technical specifications available for this product.
              </div>
            )}
            
            {/* Full Description */}
            {product.description && (
              <div className="mt-8 bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Product Description</h2>
                </div>
                <div className="p-6">
                  <div className="prose max-w-none text-gray-700">
                    {product.description.split('\n').map((paragraph, i) => (
                      <p key={i} className="mb-4">{paragraph}</p>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
