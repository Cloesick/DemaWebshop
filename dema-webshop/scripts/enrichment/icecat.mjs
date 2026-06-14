// ICEcat client — primary structured datasheet source (Step 3 enrichment).
//
// ICEcat's Open Catalog returns licensed product datasheets (specs, EAN/GTIN,
// images, descriptions) keyed by brand+part-code or by GTIN. Most of our
// branded SKUs (Makita / Airpress / Kränzle) ARE the manufacturer part code,
// so brand+sku is the usual lookup.
//
// Env:
//   ICECAT_USERNAME   - your registered Icecat account (required)
//   ICECAT_API_TOKEN  - API token for full content (optional; open data works without)
//   ICECAT_LANG       - language code, default "en"
//
// NOTE: response shapes below follow Icecat's documented JSON API. They are
// defensive (optional chaining everywhere) but should be confirmed against a
// live response the first time this runs with real credentials.

const BASE = 'https://live.icecat.biz/api';

function cfg() {
  return {
    user: process.env.ICECAT_USERNAME || '',
    token: process.env.ICECAT_API_TOKEN || '',
    lang: process.env.ICECAT_LANG || 'en',
  };
}

export function icecatConfigured() {
  return Boolean(cfg().user);
}

async function call(params) {
  const { user, token, lang } = cfg();
  const qs = new URLSearchParams({ UserName: user, Language: lang, ...params });
  const headers = token ? { api_token: token } : {};
  const res = await fetch(`${BASE}/?${qs.toString()}`, { headers });
  if (!res.ok) {
    if (res.status === 404) return null; // product not in Icecat
    throw new Error(`Icecat HTTP ${res.status}`);
  }
  const json = await res.json();
  if (!json || json.msg === 'error' || !json.data) return null;
  return json.data;
}

export async function fetchByBrandCode(brand, productCode) {
  if (!brand || !productCode) return null;
  return normalize(await call({ Brand: brand, ProductCode: productCode }));
}

export async function fetchByGtin(gtin) {
  if (!gtin) return null;
  return normalize(await call({ GTIN: String(gtin) }));
}

function normalize(data) {
  if (!data) return null;
  const gi = data.GeneralInfo || {};

  const description =
    gi.SummaryDescription?.LongSummaryDescription ||
    gi.SummaryDescription?.ShortSummaryDescription ||
    gi.Description?.LongDesc ||
    null;

  const gtinList = Array.isArray(gi.GTIN) ? gi.GTIN : gi.GTIN ? [gi.GTIN] : [];

  const images = (Array.isArray(data.Gallery) ? data.Gallery : [])
    .map((g) => g.Pic || g.LowPic || g.ThumbPic)
    .filter(Boolean);
  if (!images.length && data.Image?.HighPic) images.push(data.Image.HighPic);

  const specs = {};
  for (const grp of data.FeaturesGroups || []) {
    for (const f of grp.Features || []) {
      const key = f.Feature?.Name?.Value || f.Feature?.Name || f.LocalName?.Value;
      const val = f.PresentationValue ?? f.Value;
      if (key && val != null && val !== '') specs[String(key)] = val;
    }
  }

  return {
    source: 'icecat',
    name: gi.Title || gi.ProductName || null,
    description,
    brand: gi.Brand || null,
    ean: gtinList[0] || null,
    mpn: gi.BrandPartCode || gi.ProductCode || null,
    images,
    specs: Object.keys(specs).length ? specs : null,
  };
}
