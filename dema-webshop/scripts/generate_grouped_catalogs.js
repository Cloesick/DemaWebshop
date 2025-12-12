const fs = require('fs');
const path = require('path');

// Configuration
const PDF_JSON_DIR = path.join(__dirname, '..', 'documents', 'Product_pdfs', 'json');
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'data');
const IMAGES_BASE_PATH = 'documents/Product_pdfs/images';

// Catalog mapping
const catalogFiles = [
  'pomp-specials.json',
  'messing-draadfittingen.json',
  'rvs-draadfittingen.json',
  'slangkoppelingen.json',
  'pe-buizen.json',
  'rubber-slangen.json',
  'slangklemmen.json',
  'pu-afzuigslangen.json',
  'zwarte-draad-en-lasfittingen.json',
  'kunststof-afvoerleidingen.json',
  'verzinkte-buizen.json',
  'zuigerpompen.json',
  'plat-oprolbare-slangen.json',
  'makita-catalogus-2022-nl.json',
  'makita-tuinfolder-2022-nl.json',
  'kranzle-catalogus-2021-nl-1.json',
  'airpress-catalogus-eng.json',
  'airpress-catalogus-nl-fr.json',
  'bronpompen.json',
  'centrifugaalpompen.json',
  'dompelpompen.json',
  'drukbuizen.json',
  'catalogus-aandrijftechniek-150922.json',
  'digitale-versie-pompentoebehoren-compressed.json',
  'abs-persluchtbuizen.json'
];

// Helper to clean and normalize strings
function cleanString(str) {
  if (!str) return '';
  return str.toString().trim();
}

// Group products by series/family
function groupProducts(products, catalogName) {
  const groups = {};
  
  products.forEach(product => {
    // Determine grouping key
    const seriesId = product.series_id || 
                     product.series_name || 
                     product.type || 
                     product.family_id || 
                     'ungrouped';
    
    const groupKey = cleanString(seriesId).toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    if (!groups[groupKey]) {
      groups[groupKey] = {
        group_id: `${catalogName.replace('.json', '')}-${groupKey}`,
        name: product.series_name || product.type || seriesId,
        family: product.family_id || product.series_id || 'General',
        catalog: catalogName.replace('.json', ''),
        source_pdf: product.source_pdf || catalogName,
        brand: extractBrand(catalogName),
        category: product.catalog_group || product.application || 'Products',
        variants: [],
        images: []
      };
    }
    
    // Add variant
    const variant = {
      sku: product.sku,
      label: product.series_name || product.type || product.sku,
      page: product.page,
      page_in_pdf: product.page,
      properties: extractProperties(product),
      attributes: extractAttributes(product)
    };
    
    groups[groupKey].variants.push(variant);
    
    // Collect images
    if (product.image) {
      const imagePath = product.image.startsWith('/') ? product.image.substring(1) : product.image;
      if (!groups[groupKey].images.includes(imagePath)) {
        groups[groupKey].images.push(imagePath);
      }
    }
    if (product.series_image) {
      const seriesImagePath = product.series_image.startsWith('/') ? product.series_image.substring(1) : product.series_image;
      if (!groups[groupKey].images.includes(seriesImagePath)) {
        groups[groupKey].images.unshift(seriesImagePath); // Series image first
      }
    }
  });
  
  // Convert to array and calculate stats
  return Object.values(groups).map(group => ({
    ...group,
    variant_count: group.variants.length,
    default_variant_sku: group.variants[0]?.sku,
    media: group.images.length > 0 ? [{
      role: 'main',
      url: group.images[0]
    }] : []
  }));
}

// Extract brand from catalog name
function extractBrand(catalogName) {
  const name = catalogName.toLowerCase();
  if (name.includes('makita')) return 'Makita';
  if (name.includes('airpress')) return 'Airpress';
  if (name.includes('kranzle') || name.includes('kränzle')) return 'Kränzle';
  if (name.includes('dema')) return 'Dema';
  return 'Various';
}

// Extract product properties
function extractProperties(product) {
  const props = {};
  
  // Common properties to extract
  const propertyFields = [
    'type', 'debiet_m3_h', 'aansluiting', 'aanzuigdiepte_m', 'opv_hoogte_m',
    'lengte', 'spanning_v', 'vermogen_w', 'stroom_a', 'pomp_dia_mm',
    'pressure_max_bar', 'pressure_bar', 'flow_lpm', 'flow_m3_h',
    'power_w', 'voltage_v', 'rpm', 'weight_kg', 'dimensions_mm',
    'material', 'connection_size', 'diameter_mm', 'length_m',
    'width_mm', 'height_mm', 'depth_mm', 'capacity_l'
  ];
  
  propertyFields.forEach(field => {
    if (product[field] !== undefined && product[field] !== null && product[field] !== '') {
      props[field] = product[field];
    }
  });
  
  return props;
}

// Extract product attributes
function extractAttributes(product) {
  const attrs = {};
  
  // Specification fields
  const specFields = [
    'spec_liquid_temp_range', 'spec_temp_range', 'spec_max_pressure',
    'spec_application_desc', 'spec_housing', 'spec_product_variant',
    'application', 'color', 'finish', 'thread_type', 'pressure_rating'
  ];
  
  specFields.forEach(field => {
    if (product[field] !== undefined && product[field] !== null && product[field] !== '') {
      attrs[field] = product[field];
    }
  });
  
  return attrs;
}

// Main processing function
async function processCatalog(catalogFile) {
  const inputPath = path.join(PDF_JSON_DIR, catalogFile);
  
  if (!fs.existsSync(inputPath)) {
    console.log(`⚠️  Skip: ${catalogFile} (not found)`);
    return null;
  }
  
  try {
    console.log(`📦 Processing: ${catalogFile}...`);
    
    // Read the catalog JSON
    const rawData = fs.readFileSync(inputPath, 'utf-8');
    const products = JSON.parse(rawData);
    
    if (!Array.isArray(products) || products.length === 0) {
      console.log(`   ⚠️  No products found in ${catalogFile}`);
      return null;
    }
    
    console.log(`   Found ${products.length} products`);
    
    // Group the products
    const grouped = groupProducts(products, catalogFile);
    
    console.log(`   Created ${grouped.length} product groups`);
    
    // Generate output filename
    const baseName = catalogFile.replace('.json', '');
    const outputFile = `${baseName.replace(/-/g, '_')}_grouped.json`;
    const outputPath = path.join(OUTPUT_DIR, outputFile);
    
    // Write grouped data
    fs.writeFileSync(outputPath, JSON.stringify(grouped, null, 2), 'utf-8');
    
    console.log(`   ✅ Saved: ${outputFile}`);
    
    return {
      catalog: catalogFile,
      products: products.length,
      groups: grouped.length,
      outputFile
    };
  } catch (error) {
    console.error(`   ❌ Error processing ${catalogFile}:`, error.message);
    return null;
  }
}

// Process all catalogs
async function main() {
  console.log('🚀 Starting catalog grouping process...\n');
  console.log(`📁 Input: ${PDF_JSON_DIR}`);
  console.log(`📁 Output: ${OUTPUT_DIR}\n`);
  
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  const results = [];
  
  for (const catalogFile of catalogFiles) {
    const result = await processCatalog(catalogFile);
    if (result) {
      results.push(result);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total catalogs processed: ${results.length}`);
  console.log(`Total products: ${results.reduce((sum, r) => sum + r.products, 0).toLocaleString()}`);
  console.log(`Total groups created: ${results.reduce((sum, r) => sum + r.groups, 0).toLocaleString()}`);
  console.log('='.repeat(60));
  
  // Create combined products_all_grouped.json
  console.log('\n📦 Creating combined products_all_grouped.json...');
  const allGroups = [];
  
  for (const result of results) {
    const groupedPath = path.join(OUTPUT_DIR, result.outputFile);
    const groupedData = JSON.parse(fs.readFileSync(groupedPath, 'utf-8'));
    allGroups.push(...groupedData);
  }
  
  const allOutputPath = path.join(OUTPUT_DIR, 'products_all_grouped.json');
  fs.writeFileSync(allOutputPath, JSON.stringify(allGroups, null, 2), 'utf-8');
  
  console.log(`✅ Saved combined file with ${allGroups.length} groups`);
  console.log('\n✨ Done! Restart your dev server to see the changes.');
}

// Run
main().catch(console.error);
