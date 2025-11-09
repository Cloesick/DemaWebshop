const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const DATA_JSON = path.resolve(__dirname, '..', 'public', 'data', 'Product_pdfs_analysis_v2.json');
const PDF_DIR = path.resolve(__dirname, '..', 'public', 'documents', 'Product_pdfs');
const OUT_DIR = path.resolve(__dirname, '..', 'public', 'images', 'pdf_pages');
const MAP_OUT = path.resolve(__dirname, '..', 'public', 'data', 'Product_images.json');

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function uniquePairs(items) {
  const set = new Set();
  const pairs = [];
  for (const it of items) {
    const src = it.pdf_source;
    const pages = Array.isArray(it.source_pages) ? it.source_pages : [];
    for (const pg of pages) {
      const k = `${src}#${pg}`;
      if (!set.has(k)) { set.add(k); pairs.push({ pdf: src, page: pg }); }
    }
  }
  return pairs;
}

function fileUrl(p) {
  // Convert windows path to file:// URL
  let u = p.replace(/\\/g, '/');
  if (!u.startsWith('/')) u = '/' + u;
  return 'file://' + u;
}

function sleep(ms){ return new Promise(r=>setTimeout(r, ms)); }

async function renderOne(page, pdfAbsPath, pageNum, outPng) {
  const url = fileUrl(pdfAbsPath) + `#page=${pageNum}`;
  await page.setViewport({ width: 1400, height: 2000, deviceScaleFactor: 2 });
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
  // Give the PDF viewer a moment to render
  await sleep(1500);
  await page.screenshot({ path: outPng, fullPage: true });
}

async function main() {
  ensureDir(OUT_DIR);
  const raw = fs.readFileSync(DATA_JSON, 'utf8');
  const items = JSON.parse(raw);
  const pairs = uniquePairs(items);

  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();

  const results = [];
  for (const { pdf, page: pg } of pairs) {
    const pdfAbs = path.join(PDF_DIR, pdf);
    const base = path.parse(pdf).name;
    const out = path.join(OUT_DIR, `${base}_${pg}.png`);
    try {
      if (!fs.existsSync(pdfAbs)) { results.push({ pdf, page: pg, ok: false, note: 'pdf missing' }); continue; }
      if (fs.existsSync(out)) { results.push({ pdf, page: pg, ok: true, cached: true, out }); continue; }
      await renderOne(page, pdfAbs, pg, out);
      results.push({ pdf, page: pg, ok: true, out });
    } catch (e) {
      results.push({ pdf, page: pg, ok: false, note: e.message });
    }
  }

  await browser.close();

  // Build SKU mapping (page-level)
  const mapping = {};
  for (const it of items) {
    const src = it.pdf_source;
    const pg = (Array.isArray(it.source_pages) && it.source_pages.length) ? it.source_pages[0] : null;
    if (!src || !pg) continue;
    const base = path.parse(src).name;
    const rel = path.posix.join('public', 'images', 'pdf_pages', `${base}_${pg}.png`).replace(/\\/g, '/');
    mapping[it.sku] = {
      image_path: rel,
      image_type: 'page',
      pdf_source: src,
      page: pg
    };
  }

  fs.writeFileSync(MAP_OUT, JSON.stringify({ rendered: results, sku_images: mapping }, null, 2), 'utf8');
  console.log(`Rendered ${results.filter(r=>r.ok).length}/${results.length} pages. Mapping written to ${MAP_OUT}`);
}

if (require.main === module) {
  main();
}
