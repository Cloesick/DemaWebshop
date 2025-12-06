/**
 * Property Icon Configuration - ENRICHED ECOSYSTEM
 * * New Coverage: Makita Garden, Brass/SS Fittings, Hose Technology (PU/Rubber/Flat).
 * * Refined Logic: Distinguishes between "Working Pressure" and "Burst Pressure" (Safety).
 */

export interface IconMapping {
  category: string;
  icon: string;
  keywords: string[];
  description: string;
  priority: number;
}

export const PROPERTY_ICON_MAPPINGS: IconMapping[] = [
  // ============================================
  // 1. IDENTIFICATION (Global)
  // ============================================
  { 
    category: 'ID', 
    icon: '🏷️', 
    keywords: ['art.nr.', 'artikelnummer', 'bestelnr', 'model', 'type', 'productcode'], 
    description: 'Product ID', 
    priority: 100 
  },
  { 
    category: 'ID', 
    icon: '🏁', 
    keywords: ['ean', 'ean-code', 'gtin'], 
    description: 'Barcode', 
    priority: 100 
  },
  { 
    category: 'ID', 
    icon: '📦', 
    keywords: ['verpakking', 'vpe', 'stuks per doos'], 
    description: 'Packaging Unit', 
    priority: 95 
  },

  // ============================================
  // 2. FITTINGS (Messing & RVS Draadfittingen)
  // Context: Precision connection types
  // ============================================
  { 
    category: 'FIT_THREAD', 
    icon: '🧬', 
    keywords: ['draad', 'draadmaat', 'schroefdraad', 'aansluitmaat'], 
    description: 'Thread Size', 
    priority: 98 
  },
  { 
    category: 'FIT_TYPE', 
    icon: '🧩', 
    keywords: ['vorm', 'type fitting', 'bocht', 'knie', 't-stuk', 'sok'], 
    description: 'Fitting Shape/Type', 
    priority: 95 
  },
  { 
    category: 'FIT_WRENCH', 
    icon: '🔧', 
    keywords: ['sleutelwijdte', 'sw'], 
    description: 'Wrench Size (SW)', 
    priority: 95 
  },
  { 
    category: 'FIT_MAT', 
    icon: '✨', // Sparkle for RVS/Brass finish
    keywords: ['materiaal', 'oppervlakte', 'messing', 'rvs', 'roestvast staal'], 
    description: 'Material Finish', 
    priority: 90 
  },

  // ============================================
  // 3. HOSE TECHNOLOGY (Rubber, PU, Flat, PE)
  // Context: Flexibility, Vacuum, Burst limits
  // ============================================
  { 
    category: 'HOSE_FLEX', 
    icon: '⤴️', 
    keywords: ['buigradius', 'buigstraal'], 
    description: 'Bend Radius (Critical for installation)', 
    priority: 95 
  },
  { 
    category: 'HOSE_VAC', 
    icon: '🌪️', 
    keywords: ['vacuüm', 'onderdruk'], 
    description: 'Vacuum Rating (Suction hoses)', 
    priority: 95 
  },
  { 
    category: 'HOSE_BURST', 
    icon: '💥', 
    keywords: ['barstdruk', 'platzen', 'burst pressure'], 
    description: 'Burst Pressure (Safety Limit)', 
    priority: 95 
  },
  { 
    category: 'HOSE_ROLL', 
    icon: '🗞️', 
    keywords: ['rollengte', 'lengte op rol'], 
    description: 'Roll Length', 
    priority: 90 
  },
  { 
    category: 'HOSE_WALL', 
    icon: '🍩', 
    keywords: ['wanddikte', 'dikte'], 
    description: 'Wall Thickness', 
    priority: 90 
  },

  // ============================================
  // 4. MAKITA GARDEN & TOOLS (Tuinfolder + Catalogus)
  // Context: Mowing, Blowing, Cutting
  // ============================================
  { 
    category: 'GARDEN_AIR', 
    icon: '🌬️', 
    keywords: ['luchtsnelheid', 'blaassnelheid'], 
    description: 'Air Speed (Blowers)', 
    priority: 95 
  },
  { 
    category: 'GARDEN_VOL', 
    icon: '🍃', 
    keywords: ['luchtvolume', 'blaasvolume'], 
    description: 'Air Volume (Blowers)', 
    priority: 95 
  },
  { 
    category: 'GARDEN_CUT', 
    icon: '✂️', 
    keywords: ['maaibreedte', 'snijbreedte', 'kniplengte'], 
    description: 'Cutting Width/Length', 
    priority: 95 
  },
  { 
    category: 'GARDEN_HEIGHT', 
    icon: '↕️', 
    keywords: ['maaihoogte', 'snijhoogte'], 
    description: 'Cutting Height', 
    priority: 95 
  },
  { 
    category: 'GARDEN_BOX', 
    icon: '🗑️', 
    keywords: ['inhoud opvangbak', 'opvangzak'], 
    description: 'Collection Box Capacity', 
    priority: 90 
  },
  { 
    category: 'TOOL_DISC', 
    icon: '💿', 
    keywords: ['schijfdiameter', 'diameter slijpschijf', 'zaagblad'], 
    description: 'Disc/Blade Diameter', 
    priority: 90 
  },
  { 
    category: 'TOOL_VIB', 
    icon: '〰️', 
    keywords: ['trilling', 'trillingswaarde', 'vibra'], 
    description: 'Vibration Value', 
    priority: 85 
  },

  // ============================================
  // 5. PUMPS & HYDRAULICS (Bronpomp, Specials)
  // ============================================
  { 
    category: 'PUMP_LIFT', 
    icon: '⏫', 
    keywords: ['opvoerhoogte', 'max. opvoerhoogte', 'head'], 
    description: 'Max Head', 
    priority: 90 
  },
  { 
    category: 'PUMP_FLOW', 
    icon: '🌊', 
    keywords: ['capaciteit', 'debiet', 'max. capaciteit', 'l/min', 'm³/u'], 
    description: 'Flow Rate', 
    priority: 90 
  },
  { 
    category: 'PUMP_SUB', 
    icon: '⏬', 
    keywords: ['dompeldiepte', 'max. dompeldiepte'], 
    description: 'Immersion Depth', 
    priority: 90 
  },
  { 
    category: 'PUMP_CASE', 
    icon: '🔘', 
    keywords: ['pomp diameter', 'diameter pomp'], 
    description: 'Pump Casing Diameter (Well pumps)', 
    priority: 88 
  },
  
  // ============================================
  // 6. ELECTRICAL & POWER (Makita + Pumps)
  // ============================================
  { 
    category: 'POWER_BATT', 
    icon: '🔋', 
    keywords: ['accu', 'accutype', 'platform', 'lxt', 'xgt', 'cxt'], 
    description: 'Battery Platform', 
    priority: 95 
  },
  { 
    category: 'POWER_VOLT', 
    icon: '⚡', 
    keywords: ['volt', 'spanning', 'voltage'], 
    description: 'Voltage', 
    priority: 90 
  },
  { 
    category: 'POWER_WATT', 
    icon: '🐴', 
    keywords: ['opgenomen vermogen', 'watt', 'kw'], 
    description: 'Power Input', 
    priority: 90 
  },
  { 
    category: 'POWER_SPEED', 
    icon: '🔄', 
    keywords: ['toerental', 'onbelast toerental', 'rpm', 'slagen'], 
    description: 'RPM / Strokes', 
    priority: 85 
  },

  // ============================================
  // 7. PRESSURE (Pipes, Hoses, Washers)
  // ============================================
  { 
    category: 'PRESS_WORK', 
    icon: '🔧', 
    keywords: ['werkdruk', 'bedrijfsdruk', 'max. druk'], 
    description: 'Working Pressure', 
    priority: 90 
  },
  { 
    category: 'PRESS_CLASS', 
    icon: '🛡️', 
    keywords: ['pn', 'drukklasse', 'sdr'], 
    description: 'Pressure Class/SDR', 
    priority: 90 
  },

  // ============================================
  // 8. DIMENSIONS (Generic)
  // ============================================
  { 
    category: 'DIM_DIA_INCH', 
    icon: '⛡', 
    keywords: ['inch', 'inches', '"', '\'', 'zoll'], 
    description: 'Diameter (Inches)', 
    priority: 88 
  },
  { 
    category: 'DIM_DIA_IN', 
    icon: '⛡', 
    keywords: ['inwendig', 'binnen', 'id'], 
    description: 'Inner Diameter', 
    priority: 85 
  },
  { 
    category: 'DIM_DIA_OUT', 
    icon: '⛡', 
    keywords: ['uitwendig', 'buiten', 'od'], 
    description: 'Outer Diameter', 
    priority: 85 
  },
  { 
    category: 'DIM_DIA_GENERAL', 
    icon: '⛡', 
    keywords: ['diameter', 'ø', 'diam', 'dia'], 
    description: 'Diameter (General)', 
    priority: 75 
  },
  { 
    category: 'DIM_L', 
    icon: '⛡', 
    keywords: ['lengte', 'l'], 
    description: 'Length', 
    priority: 60 
  },
  { 
    category: 'DIM_W', 
    icon: '⛡', 
    keywords: ['breedte', 'b'], 
    description: 'Width', 
    priority: 60 
  },
  { 
    category: 'DIM_H', 
    icon: '⛡', 
    keywords: ['hoogte', 'h'], 
    description: 'Height', 
    priority: 60 
  },
  { 
    category: 'WEIGHT', 
    icon: '⚖️', 
    keywords: ['gewicht', 'netto gewicht'], 
    description: 'Weight', 
    priority: 60 
  },
  { 
    category: 'SOUND', 
    icon: '🔊', 
    keywords: ['geluid', 'lpa', 'lwa', 'db(a)'], 
    description: 'Sound Level', 
    priority: 60 
  },

  // ============================================
  // 9. DEFAULT
  // ============================================
  { 
    category: 'DEFAULT', 
    icon: '▪️', 
    keywords: [], 
    description: 'Fallback', 
    priority: 0 
  }
];

/**
 * Get icon for a property key
 * @param key - Property key to match
 * @returns Emoji icon
 */
export function getPropertyIcon(key: string): string {
  const keyLower = key.toLowerCase();
  
  // Sort by priority (highest first)
  const sortedMappings = [...PROPERTY_ICON_MAPPINGS].sort((a, b) => 
    (b.priority || 0) - (a.priority || 0)
  );
  
  // Find first matching mapping
  for (const mapping of sortedMappings) {
    if (mapping.keywords.length === 0) continue; // Skip default
    
    for (const keyword of mapping.keywords) {
      if (keyLower.includes(keyword.toLowerCase())) {
        return mapping.icon;
      }
    }
  }
  
  // Return default icon
  return '▪️';
}

/**
 * Get all mappings for a specific category
 * @param category - Category name
 * @returns Array of icon mappings
 */
export function getMappingsByCategory(category: string): IconMapping[] {
  return PROPERTY_ICON_MAPPINGS.filter(m => m.category === category);
}

/**
 * Get all unique categories
 * @returns Array of category names
 */
export function getAllCategories(): string[] {
  const categories = new Set<string>();
  PROPERTY_ICON_MAPPINGS.forEach(m => categories.add(m.category));
  return Array.from(categories);
}