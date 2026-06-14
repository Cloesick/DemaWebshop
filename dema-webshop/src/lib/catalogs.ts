// Canonical catalog registry — single source for the catalog listing route
// (/catalog/group/[slug]) and every link to it. Replaces the 44 hand-written
// `*-grouped` pages and the inconsistent hardcoded links scattered around.
//
// `slug` is the hyphenated catalog id used in URLs and matches `catalog.name`
// from catalog_index.json. `dataFile` is the per-catalog products JSON in
// /public/data. (Step 4 will swap dataFile lookups for a DB query.)

export interface CatalogEntry {
  slug: string;
  title: string;
  icon: string;
  dataFile: string; // path under /public
  brand?: string;
}

export const CATALOGS: CatalogEntry[] = [
  { slug: 'makita-catalogus-2022-nl', title: 'Makita 2022', icon: '🔧', dataFile: '/data/makita_catalogus_2022_nl_products.json', brand: 'Makita' },
  { slug: 'makita-tuinfolder-2022-nl', title: 'Makita Garden 2022', icon: '🌳', dataFile: '/data/makita_tuinfolder_2022_nl_products.json', brand: 'Makita' },
  { slug: 'airpress-catalogus-eng', title: 'Airpress (EN)', icon: '💨', dataFile: '/data/airpress_catalogus_eng_products.json', brand: 'Airpress' },
  { slug: 'airpress-catalogus-nl-fr', title: 'Airpress (NL/FR)', icon: '💨', dataFile: '/data/airpress_catalogus_nl_fr_products.json', brand: 'Airpress' },
  { slug: 'kranzle-catalogus-2021-nl-1', title: 'Kränzle 2021', icon: '🚿', dataFile: '/data/kranzle_catalogus_2021_nl_1_products.json', brand: 'Kränzle' },
  { slug: 'catalogus-aandrijftechniek-150922', title: 'Aandrijftechniek', icon: '⚙️', dataFile: '/data/catalogus_aandrijftechniek_150922_products.json' },
  { slug: 'digitale-versie-pompentoebehoren-compressed', title: 'Pompentoebehoren', icon: '🔩', dataFile: '/data/digitale_versie_pompentoebehoren_compressed_products.json' },
  { slug: 'bronpompen', title: 'Bronpompen', icon: '💧', dataFile: '/data/bronpompen_products.json' },
  { slug: 'centrifugaalpompen', title: 'Centrifugaalpompen', icon: '💧', dataFile: '/data/centrifugaalpompen_products.json' },
  { slug: 'dompelpompen', title: 'Dompelpompen', icon: '💧', dataFile: '/data/dompelpompen_products.json' },
  { slug: 'zuigerpompen', title: 'Zuigerpompen', icon: '💧', dataFile: '/data/zuigerpompen_products.json' },
  { slug: 'pomp-specials', title: 'Pomp Specials', icon: '💧', dataFile: '/data/pomp_specials_products.json' },
  { slug: 'drukbuizen', title: 'Drukbuizen', icon: '🪈', dataFile: '/data/drukbuizen_products.json' },
  { slug: 'pe-buizen', title: 'PE Buizen', icon: '🪈', dataFile: '/data/pe_buizen_products.json' },
  { slug: 'verzinkte-buizen', title: 'Verzinkte Buizen', icon: '🪈', dataFile: '/data/verzinkte_buizen_products.json' },
  { slug: 'abs-persluchtbuizen', title: 'ABS Persluchtbuizen', icon: '🪈', dataFile: '/data/abs_persluchtbuizen_products.json' },
  { slug: 'kunststof-afvoerleidingen', title: 'Kunststof Afvoerleidingen', icon: '🪠', dataFile: '/data/kunststof_afvoerleidingen_products.json' },
  { slug: 'rubber-slangen', title: 'Rubber Slangen', icon: '🧵', dataFile: '/data/rubber_slangen_products.json' },
  { slug: 'pu-afzuigslangen', title: 'PU Afzuigslangen', icon: '🧵', dataFile: '/data/pu_afzuigslangen_products.json' },
  { slug: 'plat-oprolbare-slangen', title: 'Plat Oprolbare Slangen', icon: '🧵', dataFile: '/data/plat_oprolbare_slangen_products.json' },
  { slug: 'slangkoppelingen', title: 'Slangkoppelingen', icon: '🔗', dataFile: '/data/slangkoppelingen_products.json' },
  { slug: 'slangklemmen', title: 'Slangklemmen', icon: '🔗', dataFile: '/data/slangklemmen_products.json' },
  { slug: 'messing-draadfittingen', title: 'Messing Draadfittingen', icon: '🔩', dataFile: '/data/messing_draadfittingen_products.json' },
  { slug: 'rvs-draadfittingen', title: 'RVS Draadfittingen', icon: '🔩', dataFile: '/data/rvs_draadfittingen_products.json' },
  { slug: 'zwarte-draad-en-lasfittingen', title: 'Zwarte Draad- en Lasfittingen', icon: '🔩', dataFile: '/data/zwarte_draad_en_lasfittingen_products.json' },
];

const BY_SLUG = new Map(CATALOGS.map((c) => [c.slug, c]));

export function getCatalog(slug: string): CatalogEntry | undefined {
  return BY_SLUG.get(slug);
}
