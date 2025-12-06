import React from 'react';
import { getPropertyIcon } from '@/config/propertyIcons';

// Color schemes for different property types
const getColorClasses = (index: number, key: string): string => {
  const keyLower = key.toLowerCase();
  
  // Specific colors for specific properties
  if (keyLower.includes('pressure') || keyLower.includes('bar') || keyLower.includes('druk')) {
    return 'bg-blue-50 text-blue-800 border-blue-200';
  }
  if (keyLower.includes('diameter') || keyLower.includes('ø')) {
    return 'bg-green-50 text-green-800 border-green-200';
  }
  if (keyLower.includes('length') || keyLower.includes('angle') || keyLower.includes('thickness') || keyLower.includes('opvoerhoogte')) {
    return 'bg-teal-50 text-teal-800 border-teal-200';
  }
  if (keyLower.includes('volume') || keyLower.includes('tank') || keyLower.includes('capacity')) {
    return 'bg-indigo-50 text-indigo-800 border-indigo-200';
  }
  if (keyLower.includes('power') || keyLower.includes('watt') || keyLower.includes('vermogen')) {
    return 'bg-yellow-50 text-yellow-800 border-yellow-200';
  }
  if (keyLower.includes('voltage') || keyLower.includes('spanning')) {
    return 'bg-amber-50 text-amber-800 border-amber-200';
  }
  if (keyLower.includes('flow') || keyLower.includes('debiet')) {
    return 'bg-cyan-50 text-cyan-800 border-cyan-200';
  }
  if (keyLower.includes('material') || keyLower.includes('materiaal') || keyLower.includes('category') || keyLower.includes('housing')) {
    return 'bg-emerald-50 text-emerald-800 border-emerald-200';
  }
  if (keyLower.includes('weight') || keyLower.includes('gewicht')) {
    return 'bg-purple-50 text-purple-800 border-purple-200';
  }
  if (keyLower.startsWith('spec_')) {
    return 'bg-gray-50 text-gray-700 border-gray-200';
  }
  
  // Fallback: cycle through colors
  const colors = [
    'bg-slate-50 text-slate-800 border-slate-200',
    'bg-gray-50 text-gray-800 border-gray-200',
    'bg-zinc-50 text-zinc-800 border-zinc-200',
    'bg-stone-50 text-stone-800 border-stone-200',
  ];
  return colors[index % colors.length];
};

interface PropertyBadgesProps {
  properties: Record<string, any>;
  maxDisplay?: number;
}

export const PropertyBadges: React.FC<PropertyBadgesProps> = ({ 
  properties, 
  maxDisplay = 5 
}) => {
  if (!properties || Object.keys(properties).length === 0) {
    return null;
  }

  // Filter out duplicates and redundant properties
  const allEntries = Object.entries(properties);
  const filteredEntries = allEntries.filter(([key, value]) => {
    if (value == null || value === '') return false;
    
    // Skip internal/redundant fields
    if (key.includes('_mm') || key.includes('_bar') || key.includes('_kg')) {
      // Skip if there's a display version
      const displayKey = key.replace(/_mm|_bar|_kg/, '');
      if (properties[displayKey] || properties[`${displayKey}_display`]) {
        return false;
      }
    }
    
    // Skip raw numeric versions if display version exists
    if (key.endsWith('_m') || key.endsWith('_cm')) {
      const baseKey = key.replace(/_m$|_cm$/, '');
      if (properties[`${baseKey}_display`] || properties[baseKey]) {
        return false;
      }
    }
    
    // Skip page_in_pdf, pdf_source, source_pages, catalog, etc.
    if (['page_in_pdf', 'pdf_source', 'source_pages', 'catalog', 'brand', 'category', 'sku'].includes(key)) {
      return false;
    }
    
    return true;
  });

  // Limit display
  const entries = filteredEntries.slice(0, maxDisplay);

  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="mb-3">
      <div className="text-xs font-semibold text-gray-600 mb-1.5">PROPERTIES</div>
      <div className="flex flex-wrap gap-1.5">
        {entries.map(([key, value], index) => {
          const icon = getPropertyIcon(key);
          const colorClasses = getColorClasses(index, key);
          const displayValue = String(value);
          
          return (
            <span
              key={key}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${colorClasses}`}
            >
              <span className="text-sm">{icon}</span>
              <span>{displayValue}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
};

export default PropertyBadges;
