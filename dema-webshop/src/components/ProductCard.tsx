import Link from 'next/link';

interface ProductCardProps {
  product: {
    sku: string;
    description: string;
    product_category?: string;
    pdf_source?: string;
    price?: number;
    oldPrice?: number;
    inStock?: boolean;
    pressure_min_bar?: number;
    pressure_max_bar?: number;
    power_kw?: number;
    power_hp?: number;
    voltage_v?: number;
    flow_l_min_list?: number[];
  };
  viewMode?: 'grid' | 'list';
  className?: string;
}

export default function ProductCard({ 
  product, 
  viewMode = 'grid',
  className = '' 
}: ProductCardProps) {
  // Generate a placeholder image based on product category
  const getImageUrl = () => {
    // Use a solid color placeholder with the first letter of the category
    const colors = {
      compressors: 'bg-blue-100',
      tools: 'bg-green-100',
      hoses: 'bg-yellow-100',
      filters: 'bg-purple-100',
      lubrication: 'bg-red-100',
      default: 'bg-gray-100'
    };
    
    const category = product.product_category?.toLowerCase() || 'default';
    const color = colors[category as keyof typeof colors] || colors.default;
    const initial = category.charAt(0).toUpperCase();
    
    // Return a div with a background color and the initial
    return (
      <div className={`w-full h-full flex items-center justify-center ${color} text-4xl font-bold text-gray-600`}>
        {initial}
      </div>
    );
  };

  // Format price with euro symbol and two decimals
  const formatPrice = (price?: number) => {
    if (!price) return '€0.00';
    return new Intl.NumberFormat('nl-BE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price).replace('€', ''); // Remove € symbol to add it separately in JSX
  };

  // Get product title (first line of description or SKU)
  const productTitle = product.description?.split('\n')[0] || `Product ${product.sku}`;
  
  // Get product description (second line of description if available)
  const productDescription = product.description?.split('\n')[1] || '';

  // Determine if product is on sale
  const isOnSale = product.oldPrice && product.price && product.price < product.oldPrice;

  // Calculate discount percentage
  const discountPercentage = isOnSale && product.oldPrice && product.price 
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;

  if (viewMode === 'list') {
    return (
      <div className={`flex flex-col md:flex-row gap-4 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow ${className}`}>
        <div className="relative w-full md:w-48 h-48 bg-gray-100 rounded overflow-hidden">
          {getImageUrl()}
          {isOnSale && (
            <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
              -{discountPercentage}%
            </div>
          )}
        </div>
        
        <div className="flex-1 flex flex-col">
          <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600">
            {productTitle}
          </h3>
          
          {productDescription && (
            <p className="mt-1 text-gray-600 text-sm">
              {productDescription}
            </p>
          )}
          
          {/* Product Specifications */}
          <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-gray-600">
            {product.pressure_min_bar && product.pressure_max_bar && (
              <div className="flex items-center">
                <span className="font-medium text-gray-700 mr-1">Pressure:</span>
                <span>{product.pressure_min_bar} - {product.pressure_max_bar} bar</span>
              </div>
            )}
            {product.power_kw && (
              <div className="flex items-center">
                <span className="font-medium text-gray-700 mr-1">Power:</span>
                <span>{product.power_kw} kW{product.power_hp ? ` (${product.power_hp} HP)` : ''}</span>
              </div>
            )}
            {product.voltage_v && (
              <div className="flex items-center">
                <span className="font-medium text-gray-700 mr-1">Voltage:</span>
                <span>{product.voltage_v}V</span>
              </div>
            )}
            {product.flow_l_min_list?.length && (
              <div className="flex items-center">
                <span className="font-medium text-gray-700 mr-1">Flow:</span>
                <span>{Math.min(...product.flow_l_min_list)}-{Math.max(...product.flow_l_min_list)} L/min</span>
              </div>
            )}
          </div>
          
          <div className="mt-auto pt-4 flex items-center justify-between">
            <div>
              <div className="flex items-baseline">
                <span className="text-2xl font-bold text-gray-900">
                  €{formatPrice(product.price)}
                </span>
                {isOnSale && (
                  <span className="ml-2 text-sm text-gray-500 line-through">
                    €{formatPrice(product.oldPrice)}
                  </span>
                )}
              </div>
              {product.inStock !== false && (
                <span className="text-sm text-green-600 font-medium">In Stock</span>
              )}
            </div>
            
            <button 
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded transition-colors"
              onClick={(e) => {
                e.preventDefault();
                // Add to cart functionality
                console.log('Add to cart:', product.sku);
              }}
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Default grid view
  return (
    <div className={`group flex flex-col h-full bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden ${className}`}>
      <div className="relative aspect-square bg-gray-100">
        {getImageUrl()}
        {isOnSale && (
          <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
            -{discountPercentage}%
          </div>
        )}
        <button 
          className="absolute bottom-0 left-0 right-0 bg-blue-600 text-white py-2 text-center opacity-0 group-hover:opacity-100 transition-opacity font-medium"
          onClick={(e) => {
            e.preventDefault();
            // Add to cart functionality
            console.log('Add to cart:', product.sku);
          }}
        >
          Add to Cart
        </button>
      </div>
      
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-base font-semibold text-gray-900 hover:text-blue-600 line-clamp-2 h-12 mb-1">
          {productTitle}
        </h3>
        
        <div className="flex items-baseline mt-2">
          <span className="text-lg font-bold text-gray-900">
            €{formatPrice(product.price)}
          </span>
          {isOnSale && (
            <span className="ml-2 text-sm text-gray-500 line-through">
              €{formatPrice(product.oldPrice)}
            </span>
          )}
        </div>
        
        {product.inStock !== false && (
          <div className="mt-2 flex items-center">
            <span className="w-2 h-2 rounded-full bg-green-500 mr-1.5"></span>
            <span className="text-xs text-gray-600">In Stock</span>
          </div>
        )}
        
        <div className="mt-2 flex items-center justify-between">
          {product.pdf_source && (
            <a 
              href={`/pdfs/${product.pdf_source}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline flex items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              PDF
            </a>
          )}
          <button 
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
            onClick={(e) => {
              e.preventDefault();
              // Quick view functionality
              console.log('Quick view:', product.sku);
            }}
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Quick View
          </button>
        </div>
      </div>
    </div>
  );
}
