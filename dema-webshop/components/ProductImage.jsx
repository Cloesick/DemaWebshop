/**
 * Product Image Component
 * =======================
 * Displays product images with lazy loading, zoom, and fallback
 */

import React, { useState } from 'react';
import Image from 'next/image';

export default function ProductImage({ 
  product, 
  size = 'medium', 
  enableZoom = false,
  className = ''
}) {
  const [imageError, setImageError] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  // Get image URL based on size
  const getImageUrl = () => {
    if (imageError) {
      return '/product-images/makita-batteries/placeholder.webp';
    }

    const media = product.media?.[0];
    if (!media) {
      return '/product-images/makita-batteries/placeholder.webp';
    }

    // Return appropriate size
    if (media.sizes && media.sizes[size]) {
      return media.sizes[size];
    }

    return media.url || product.imageUrl || '/product-images/makita-batteries/placeholder.webp';
  };

  const imageUrl = getImageUrl();

  // Size dimensions
  const dimensions = {
    thumbnail: { width: 150, height: 150 },
    medium: { width: 300, height: 300 },
    large: { width: 600, height: 600 }
  };

  const { width, height } = dimensions[size] || dimensions.medium;

  return (
    <div 
      className={`product-image ${className} ${enableZoom ? 'zoom-enabled' : ''}`}
      onMouseEnter={() => enableZoom && setIsZoomed(true)}
      onMouseLeave={() => enableZoom && setIsZoomed(false)}
    >
      <Image
        src={imageUrl}
        alt={product.name || product.product_name || 'Battery product'}
        width={width}
        height={height}
        loading="lazy"
        onError={() => setImageError(true)}
        className={`object-cover rounded ${isZoomed ? 'scale-110' : 'scale-100'} transition-transform duration-300`}
        quality={80}
      />
      
      {/* SKU badge */}
      <div className="absolute top-2 right-2 bg-white/90 px-2 py-1 rounded text-xs font-semibold">
        {product.sku}
      </div>

      {/* Zoom indicator */}
      {enableZoom && (
        <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
          🔍 Hover to zoom
        </div>
      )}
    </div>
  );
}

// CSS to add to your stylesheet:
/*
.product-image {
  position: relative;
  overflow: hidden;
  background: #f5f5f5;
}

.product-image.zoom-enabled {
  cursor: zoom-in;
}

.product-image img {
  transition: transform 0.3s ease;
}
*/
