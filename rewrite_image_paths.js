// rewrite_image_paths.js
// One-off script to rewrite image_path in input_pdfs_analysis_v5.json
// from absolute PDF_Analyzer paths to /product-images/<pdf>.pdf/<filename>.webp

const fs = require('fs');
const path = require('path');

const INPUT_PATH = path.resolve(__dirname, 'dema-webshop', 'public', 'data', 'input_pdfs_analysis_v5.json');

function rewriteImagePaths() {
  console.log(`Reading ${INPUT_PATH} ...`);
  const raw = fs.readFileSync(INPUT_PATH, 'utf8');
  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse JSON:', err);
    process.exit(1);
  }

  if (!Array.isArray(data)) {
    console.error('Expected top-level array in input_pdfs_analysis_v5.json');
    process.exit(1);
  }

  let rewrittenCount = 0;

  for (const entry of data) {
    if (!entry || typeof entry !== 'object') continue;

    const entryPdfSource = (entry.pdf_source || '').toString().trim();
    const images = Array.isArray(entry.images) ? entry.images : [];

    for (const img of images) {
      if (!img || typeof img !== 'object') continue;

      const imgPdfSource = (img.pdf_source || entryPdfSource || '').toString().trim();
      let srcPath = (img.image_path || '').toString().trim();
      if (!imgPdfSource || !srcPath) continue;

      // Basename of original image path, e.g. ABSBU040_abs-persluchtbuizen_p005_img000.webp
      const fileName = path.basename(srcPath);

      // pdfName is used as folder name, e.g. abs-persluchtbuizen.pdf
      const pdfName = imgPdfSource;

      const webPath = `/product-images/${pdfName}/${fileName}`;

      img.image_path = webPath;
      rewrittenCount++;
    }
  }

  console.log(`Rewrote ${rewrittenCount} image_path entries.`);

  const output = JSON.stringify(data, null, 2);
  fs.writeFileSync(INPUT_PATH, output, 'utf8');
  console.log('Done. File updated in place.');
}

rewriteImagePaths();