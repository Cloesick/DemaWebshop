/**
 * MAKITA BATTERY PRODUCTS - REACT COMPONENTS (JSX)
 * ==================================================
 * Ready-to-use React/JavaScript components for displaying battery products
 * Less strict version - works with plain JavaScript/JSX
 */

import React, { useState } from 'react';
import { useCart } from '../contexts/CartContext';

// ============================================================================
// BATTERY CARD COMPONENT
// ============================================================================

export const BatteryCard = ({ product }) => {
  // Cart functionality
  const { addToCart, isInCart, getQuantity } = useCart();
  const [justAdded, setJustAdded] = useState(false);
  
  // Get image URL
  const getImageUrl = () => {
    if (product.media && product.media[0]) {
      return product.media[0].sizes?.medium || product.media[0].url;
    }
    if (product.imageUrl) {
      return product.imageUrl;
    }
    return '/product-images/makita-batteries/placeholder.webp';
  };

  // Handle add to cart
  const handleAddToCart = () => {
    addToCart(product, 1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  const inCart = isInCart(product.sku);
  const quantity = getQuantity(product.sku);

  return (
    <div className="battery-card">
      {/* Product Image */}
      <div className="battery-card__image">
        <img 
          src={getImageUrl()} 
          alt={product.product_name || product.name}
          loading="lazy"
          onError={(e) => {
            e.target.src = '/product-images/makita-batteries/placeholder.webp';
          }}
        />
      </div>

      {/* Header */}
      <div className="battery-card__header">
        <span className="battery-card__category">{product.category}</span>
        <h3 className="battery-card__sku">{product.sku}</h3>
      </div>

      {/* Product Name */}
      <h4 className="battery-card__name">{product.product_name || product.name}</h4>

      {/* Properties with Icons */}
      <div className="battery-card__properties">
        {product.properties && Object.entries(product.properties).map(([key, prop]) => (
          <div key={key} className="property">
            <span className="property__icon">{prop.icon}</span>
            <div className="property__content">
              <span className="property__label">{prop.label}</span>
              <span className="property__value">{prop.value}</span>
            </div>
          </div>
        ))}
        
        {/* Fallback for specs array format */}
        {product.specs && product.specs.map((spec, i) => (
          <div key={i} className="property">
            <span className="property__icon">{spec.icon || '•'}</span>
            <div className="property__content">
              <span className="property__label">{spec.label}</span>
              <span className="property__value">{spec.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Pricing */}
      <div className="battery-card__pricing">
        <div className="price price--excl">
          <span className="price__label">Ex BTW</span>
          <span className="price__value">
            {product.prices?.excl_vat 
              ? `€ ${product.prices.excl_vat.toFixed(2)}` 
              : product.price?.display || 'N/A'}
          </span>
        </div>
        <div className="price price--incl">
          <span className="price__label">Incl BTW</span>
          <span className="price__value">
            {product.prices?.incl_vat 
              ? `€ ${product.prices.incl_vat.toFixed(2)}` 
              : product.price_incl_vat?.display || 'N/A'}
          </span>
        </div>
      </div>

      {/* Add to Cart Button */}
      <button 
        className={`battery-card__button ${justAdded ? 'battery-card__button--added' : ''} ${inCart ? 'battery-card__button--in-cart' : ''}`}
        onClick={handleAddToCart}
      >
        {justAdded ? (
          <span>✓ Added to Cart!</span>
        ) : inCart ? (
          <span>🛒 In Cart ({quantity}) - Add More</span>
        ) : (
          <span>🛒 Add to Cart</span>
        )}
      </button>
    </div>
  );
};

// ============================================================================
// BATTERY GRID COMPONENT
// ============================================================================

export const BatteryGrid = ({ data, category }) => {
  const products = data.products || data;
  const filteredProducts = category
    ? products.filter(p => p.category === category || p.product_category === category)
    : products;

  return (
    <div className="battery-grid">
      <div className="battery-grid__header">
        <h2>{category ? category.charAt(0).toUpperCase() + category.slice(1) : 'All Products'}</h2>
        <p className="battery-grid__count">{filteredProducts.length} products</p>
      </div>

      <div className="battery-grid__items">
        {filteredProducts.map(product => (
          <BatteryCard key={product.sku || product.id} product={product} />
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// BATTERY TABLE COMPONENT
// ============================================================================

export const BatteryTable = ({ data, category }) => {
  const products = data.products || data;
  const filteredProducts = category
    ? products.filter(p => p.category === category || p.product_category === category)
    : products;

  return (
    <div className="battery-table">
      <table>
        <thead>
          <tr>
            <th>SKU</th>
            <th>Product Name</th>
            <th>Properties</th>
            <th>Price (Ex BTW)</th>
            <th>Price (Incl BTW)</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredProducts.map(product => (
            <tr key={product.sku || product.id}>
              <td className="battery-table__sku">{product.sku}</td>
              <td className="battery-table__name">{product.product_name || product.name}</td>
              <td className="battery-table__properties">
                <div className="properties-inline">
                  {product.display?.properties && Object.values(product.display.properties).map((prop, i) => (
                    <span key={i} className="property-tag">{prop}</span>
                  ))}
                  {product.specs && product.specs.slice(0, 3).map((spec, i) => (
                    <span key={i} className="property-tag">{spec.icon} {spec.value}</span>
                  ))}
                </div>
              </td>
              <td className="battery-table__price">
                {product.prices?.excl_vat 
                  ? `€ ${product.prices.excl_vat.toFixed(2)}` 
                  : product.price?.display || 'N/A'}
              </td>
              <td className="battery-table__price">
                {product.prices?.incl_vat 
                  ? `€ ${product.prices.incl_vat.toFixed(2)}` 
                  : product.price_incl_vat?.display || 'N/A'}
              </td>
              <td className="battery-table__actions">
                <button className="btn-small" onClick={() => console.log('Add:', product.sku)}>
                  Add
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ============================================================================
// CATEGORY TABS COMPONENT
// ============================================================================

export const BatteryCategoryTabs = ({ data }) => {
  const [activeCategory, setActiveCategory] = useState('all');
  
  const products = data.products || data;
  
  const categories = [
    { 
      key: 'all', 
      label: 'All Products', 
      count: products.length 
    },
    { 
      key: 'batteries', 
      label: 'Batteries', 
      count: products.filter(p => 
        p.category === 'batteries' || 
        p.product_category === 'Batteries'
      ).length 
    },
    { 
      key: 'powerpacks', 
      label: 'Powerpacks', 
      count: products.filter(p => 
        p.category === 'powerpacks' || 
        p.product_category === 'Powerpacks'
      ).length 
    },
    { 
      key: 'chargers', 
      label: 'Chargers', 
      count: products.filter(p => 
        p.category === 'chargers' || 
        p.product_category === 'Chargers'
      ).length 
    },
    { 
      key: 'adapters', 
      label: 'Adapters', 
      count: products.filter(p => 
        p.category === 'adapters' || 
        p.product_category === 'Adapters'
      ).length 
    },
  ];

  return (
    <div className="battery-categories">
      <div className="tabs">
        {categories.map(cat => (
          <button
            key={cat.key}
            className={`tab ${activeCategory === cat.key ? 'tab--active' : ''}`}
            onClick={() => setActiveCategory(cat.key)}
          >
            {cat.label}
            <span className="tab__count">{cat.count}</span>
          </button>
        ))}
      </div>

      <div className="tab-content">
        <BatteryGrid
          data={data}
          category={activeCategory === 'all' ? undefined : activeCategory}
        />
      </div>
    </div>
  );
};

// ============================================================================
// PROPERTY DISPLAY COMPONENT (Reusable)
// ============================================================================

export const PropertyDisplay = ({ properties }) => {
  const props = properties || {};
  
  return (
    <div className="property-display">
      {Object.entries(props).map(([key, prop]) => (
        <div key={key} className="property-item">
          <span className="property-item__icon" aria-label={prop.label}>
            {prop.icon}
          </span>
          <div className="property-item__details">
            <span className="property-item__label">{prop.label}</span>
            <span className="property-item__value">{prop.value}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// CSS STYLES (Add to your stylesheet)
// ============================================================================

export const batteryStyles = `
/* Battery Card */
.battery-card {
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 20px;
  background: white;
  transition: box-shadow 0.2s;
}

.battery-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.battery-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.battery-card__category {
  background: #667eea;
  color: white;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 600;
  text-transform: capitalize;
}

.battery-card__sku {
  font-size: 14px;
  color: #666;
  font-weight: 600;
}

.battery-card__name {
  font-size: 18px;
  margin-bottom: 16px;
  color: #333;
}

.battery-card__properties {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.property {
  display: flex;
  align-items: center;
  gap: 12px;
}

.property__icon {
  font-size: 24px;
  width: 32px;
  text-align: center;
}

.property__content {
  display: flex;
  flex-direction: column;
}

.property__label {
  font-size: 12px;
  color: #999;
  text-transform: uppercase;
  font-weight: 600;
}

.property__value {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.battery-card__pricing {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  color: white;
}

.price {
  display: flex;
  flex-direction: column;
}

.price__label {
  font-size: 12px;
  opacity: 0.9;
  margin-bottom: 4px;
}

.price__value {
  font-size: 18px;
  font-weight: 700;
}

.price--incl .price__value {
  font-size: 20px;
}

.battery-card__button {
  width: 100%;
  padding: 12px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.battery-card__button:hover {
  background: #5568d3;
}

/* Battery Grid */
.battery-grid {
  padding: 20px;
}

.battery-grid__header {
  margin-bottom: 24px;
}

.battery-grid__items {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}

/* Tabs */
.tabs {
  display: flex;
  gap: 8px;
  border-bottom: 2px solid #e0e0e0;
  margin-bottom: 24px;
}

.tab {
  padding: 12px 24px;
  background: none;
  border: none;
  cursor: pointer;
  font-weight: 600;
  color: #666;
  border-bottom: 3px solid transparent;
  transition: all 0.2s;
}

.tab--active {
  color: #667eea;
  border-bottom-color: #667eea;
}

.tab__count {
  margin-left: 8px;
  background: #f0f0f0;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
}

.tab--active .tab__count {
  background: #667eea;
  color: white;
}

/* Property tags */
.property-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: #f3f4f6;
  border-radius: 4px;
  font-size: 12px;
  margin: 2px;
}
`;

// Example usage:
/*
import batteryData from '../public/data/products.json';
import { BatteryCategoryTabs } from '../components/BatteryProducts';

// Filter battery products
const batteryProducts = batteryData.filter(p => 
  p.catalog === 'makita-batteries' || 
  p.brand === 'Makita'
);

function BatteryPage() {
  return (
    <div>
      <h1>Makita Battery Products</h1>
      <BatteryCategoryTabs data={batteryProducts} />
    </div>
  );
}
*/
