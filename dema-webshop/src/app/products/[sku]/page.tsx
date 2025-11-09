'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/store/cartStore';
import { Product } from '@/types/product';
import Link from 'next/link';
import { useLocale } from '@/contexts/LocaleContext';
import ProductCard from '@/components/products/ProductCard';
import { getSkuImagePath } from '@/lib/skuImageMap';

// This is a client component that will be hydrated on the client
export default function ProductPage() {
  const params = useParams();
  const { t } = useLocale();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recs, setRecs] = useState<Product[]>([]);
  const [recsLoading, setRecsLoading] = useState(false);
  const [displayPdfUrl, setDisplayPdfUrl] = useState<string | null>(null);
  const [displayPageNumber, setDisplayPageNumber] = useState<number>(1);
  const [displayCropNorm, setDisplayCropNorm] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [canvasSize, setCanvasSize] = useState<{ w: number; h: number } | null>(null);
  const [skuImage, setSkuImage] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const editMode = searchParams?.get('editImage') === '1';
  const [pendingCrop, setPendingCrop] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [saving, setSaving] = useState(false);

  // Normalize incoming pdf_source values to a usable URL
  function makePdfUrl(src?: string | null): string | null {
    if (!src) return null;
    if (src.startsWith('http://') || src.startsWith('https://')) return src;
    if (src.startsWith('/')) return src; // already absolute within site
    // assume bare filename within public/documents/Product_pdfs
    return `/documents/Product_pdfs/${src}`;
  }

  useEffect(() => {
    const sku = Array.isArray(params.sku) ? params.sku[0] : params.sku;
    
    if (!sku) {
      setError('No product SKU provided');
      setLoading(false);
      return;
    }

    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/products?sku=${encodeURIComponent(String(sku))}&limit=1`);
        if (!res.ok) throw new Error(`API ${res.status}`);
        const data = await res.json();
        const productData: Product | undefined = data?.products?.[0];
        if (!productData) {
          setError('Product not found');
          setProduct(null);
          return;
        }
        setProduct(productData);
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [params.sku]);

  // Resolve which PDF and page to display as the image.
  // If the product has its own pdf_source, use it. Otherwise, try matched_skus (shared image scenario).
  useEffect(() => {
    async function resolvePdf() {
      if (!product) {
        setDisplayPdfUrl(null);
        setDisplayPageNumber(1);
        setSkuImage(null);
        return;
      }
      // Try pre-rendered SKU image first
      try {
        const p = await getSkuImagePath(product.sku);
        setSkuImage(p);
      } catch { setSkuImage(null); }
      const hasOwnPdf = !!product.pdf_source && Array.isArray(product.source_pages) && product.source_pages.length > 0;
      if (hasOwnPdf) {
        setDisplayPdfUrl(makePdfUrl(product.pdf_source));
        let pageNum = (product as any).image_page || product.source_pages[0] || 1;
        let crop = (product as any).image_crop_norm || null;
        // Load overrides for this SKU, if present
        try {
          const sku = product.sku;
          const ovRes = await fetch(`/api/product-image-overrides?sku=${encodeURIComponent(sku)}`, { cache: 'no-store' });
          if (ovRes.ok) {
            const ovData = await ovRes.json();
            const o = ovData?.[sku];
            if (o) {
              if (typeof o.image_page === 'number') pageNum = o.image_page;
              if (o.image_crop_norm) crop = o.image_crop_norm;
            }
          }
        } catch {}
        setDisplayPageNumber(pageNum);
        setDisplayCropNorm(crop);
        return;
      }
      // fallback via matched_skus
      const ms = Array.isArray((product as any).matched_skus) ? (product as any).matched_skus as string[] : [];
      if (ms.length === 0) {
        setDisplayPdfUrl(null);
        setDisplayPageNumber(1);
        setDisplayCropNorm(null);
        return;
      }
      // Try first matching SKU that has a pre-rendered PNG image
      for (const msku of ms) {
        try {
          const image = await getSkuImagePath(msku);
          if (image) {
            setSkuImage(image);
            setDisplayPdfUrl(null);
            setDisplayPageNumber(1);
            setDisplayCropNorm(null);
            return;
          }
        } catch {}
      }
      // Try first matching SKU that has a pdf and page
      for (const msku of ms) {
        try {
          const r = await fetch(`/api/products?sku=${encodeURIComponent(msku)}&limit=1`, { cache: 'force-cache' });
          if (!r.ok) continue;
          const d = await r.json();
          const mp: Product | undefined = d?.products?.[0];
          if (mp && mp.pdf_source && Array.isArray(mp.source_pages) && mp.source_pages.length > 0) {
            setDisplayPdfUrl(makePdfUrl(mp.pdf_source));
            let pageNum = (mp as any).image_page || mp.source_pages[0] || 1;
            let crop = (mp as any).image_crop_norm || null;
            // Try override for current SKU first, then matched SKU
            try {
              const sku = product.sku;
              const ovRes1 = await fetch(`/api/product-image-overrides?sku=${encodeURIComponent(sku)}`, { cache: 'no-store' });
              if (ovRes1.ok) {
                const j = await ovRes1.json();
                const o = j?.[sku];
                if (o) {
                  if (typeof o.image_page === 'number') pageNum = o.image_page;
                  if (o.image_crop_norm) crop = o.image_crop_norm;
                }
              }
              const ovRes2 = await fetch(`/api/product-image-overrides?sku=${encodeURIComponent(msku)}`, { cache: 'no-store' });
              if (ovRes2.ok) {
                const j2 = await ovRes2.json();
                const o2 = j2?.[msku];
                if (o2) {
                  if (typeof o2.image_page === 'number') pageNum = o2.image_page;
                  if (o2.image_crop_norm) crop = o2.image_crop_norm;
                }
              }
            } catch {}
            setDisplayPageNumber(pageNum);
            setDisplayCropNorm(crop);
            return;
          }
        } catch {
          // ignore and continue
        }
      }
      setDisplayPdfUrl(null);
      setDisplayPageNumber(1);
      setDisplayCropNorm(null);
    }
    resolvePdf();
  }, [product]);

  useEffect(() => {
    const sku = Array.isArray(params.sku) ? params.sku[0] : params.sku;
    if (!sku) return;
    setRecsLoading(true);
    const fetchBySku = async () => {
      try {
        const r = await fetch(`/api/recommendations?sku=${encodeURIComponent(String(sku))}&limit=4`, { cache: 'no-store' });
        if (!r.ok) throw new Error(`REC ${r.status}`);
        const data = await r.json();
        const items = Array.isArray(data?.items) ? data.items : [];
        if (items.length > 0) {
          setRecs(items);
          return;
        }
        // Fallback by category if available
        if (product?.product_category) {
          const r2 = await fetch(`/api/recommendations?category=${encodeURIComponent(product.product_category)}&limit=4`, { cache: 'no-store' });
          if (r2.ok) {
            const d2 = await r2.json();
            const catItems = Array.isArray(d2?.items) ? d2.items : [];
            if (catItems.length > 0) {
              setRecs(catItems);
              return;
            }
          }
        }
        // Final fallback: top-rated/in-stock products
        const r3 = await fetch(`/api/products?limit=4`, { cache: 'no-store' });
        if (r3.ok) {
          const d3 = await r3.json();
          const p3 = Array.isArray(d3?.products) ? d3.products : [];
          setRecs(p3);
          return;
        }
        setRecs([]);
      } catch {
        // Fallback on error
        if (product?.product_category) {
          fetch(`/api/recommendations?category=${encodeURIComponent(product.product_category)}&limit=4`, { cache: 'no-store' })
            .then(async r2 => {
              if (!r2.ok) throw new Error('REC fallback');
              const d2 = await r2.json();
              const catItems = Array.isArray(d2?.items) ? d2.items : [];
              if (catItems.length > 0) {
                setRecs(catItems);
                return;
              }
              // Final fallback
              return fetch(`/api/products?limit=4`, { cache: 'no-store' })
                .then(async r3 => {
                  if (!r3.ok) throw new Error('REC final');
                  const d3 = await r3.json();
                  const p3 = Array.isArray(d3?.products) ? d3.products : [];
                  setRecs(p3);
                });
            })
            .catch(() => setRecs([]))
            .finally(() => setRecsLoading(false));
          return;
        }
        setRecs([]);
      } finally {
        setRecsLoading(false);
      }
    };
    fetchBySku();
  }, [params.sku, product?.product_category]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Error</h1>
          <p className="mt-2">{error || 'Product not found'}</p>
        </div>
      </div>
    );
  }

  // Generate a placeholder color based on product SKU or category
  const getPlaceholderColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 70%, 90%)`;
  };

  const categoryForImage = product.product_category?.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'product';
  const placeholderColor = getPlaceholderColor(product.sku || categoryForImage);
  const placeholderImage = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Crect width='800' height='600' fill='${encodeURIComponent(placeholderColor)}'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='24' text-anchor='middle' dominant-baseline='middle' fill='%23666'%3E${encodeURIComponent(categoryForImage)}%3C/text%3E%3C/svg%3E`;
  
  const priceNumber = product.dimensions_mm_list?.[0]
    ? product.dimensions_mm_list[0] * 0.5
    : 99.99;
  
  // Client component for cart functionality
  function AddToCart({ product }: { product: Product }) {
    const addToCart = useCartStore((state) => state.addToCart);
    
    return (
      <Button 
        onClick={() => addToCart(product)}
        className="mt-4 w-full bg-blue-600 hover:bg-blue-700"
      >
        Add to Cart
      </Button>
    );
  }

  // Render a PDF page to canvas with optional normalized crop and report full canvas size
  function PdfPageImage({ pdfUrl, pageNumber, cropNorm, onRendered }: { pdfUrl: string; pageNumber: number; cropNorm?: { x: number; y: number; width: number; height: number }; onRendered?: (w: number, h: number) => void }) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [rendered, setRendered] = useState(false);

    useEffect(() => {
      let cancelled = false;
      async function load() {
        try {
          // @ts-ignore dynamic import path valid at runtime
          const pdfjsLib = await import('pdfjs-dist/build/pdf');
          const pdfjs: any = (pdfjsLib as any).default ?? pdfjsLib;
          // Worker must match API version
          // @ts-ignore runtime property exists
          pdfjs.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs';

          const loadingTask = pdfjs.getDocument({
            url: pdfUrl,
            wasmUrl: '/pdfjs/'
          });
          const pdf = await loadingTask.promise;
          const page = await pdf.getPage(pageNumber);
          const scale = 1.0;
          const viewport = page.getViewport({ scale });
          const canvas = canvasRef.current;
          if (!canvas || cancelled) return;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          // Render only the cropped region directly to the canvas to reduce memory usage
          const pageW = Math.ceil(viewport.width);
          const pageH = Math.ceil(viewport.height);
          const hasCrop = !!cropNorm && cropNorm.width > 0 && cropNorm.height > 0;
          const sx = hasCrop ? Math.max(0, Math.min(pageW, Math.round(pageW * (cropNorm!.x || 0)))) : 0;
          const sy = hasCrop ? Math.max(0, Math.min(pageH, Math.round(pageH * (cropNorm!.y || 0)))) : 0;
          const sw = hasCrop ? Math.max(1, Math.min(pageW - sx, Math.round(pageW * (cropNorm!.width || 1)))) : pageW;
          const sh = hasCrop ? Math.max(1, Math.min(pageH - sy, Math.round(pageH * (cropNorm!.height || 1)))) : pageH;

          canvas.width = sw;
          canvas.height = sh;
          // Translate the render so the crop area is drawn into (0,0) of the target canvas
          const transform: number[] = [1, 0, 0, 1, -sx, -sy];
          await page.render({ canvasContext: ctx, viewport, transform, background: 'white' }).promise;
          if (onRendered) onRendered(pageW, pageH);
          if (!cancelled) setRendered(true);
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error('PDF render error', e);
          if (!cancelled) setError('Failed to render PDF page');
        }
      }
      load();
      return () => { cancelled = true; };
    }, [pdfUrl, pageNumber, cropNorm?.x, cropNorm?.y, cropNorm?.width, cropNorm?.height]);

    if (error) {
      return <div className="w-full h-64 flex items-center justify-center text-sm text-gray-600">{error}</div>;
    }
    return (
      <div className="w-full flex items-center justify-center bg-white">
        <canvas id="product-pdf-canvas" ref={canvasRef} className="w-full h-auto" aria-label="Product image from PDF" />
        {!rendered && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>
    );
  }

  // Simple crop overlay to capture normalized crop rectangle in edit mode
  function CropOverlay({ canvasSize, initial, onChange }: { canvasSize: { w: number; h: number }; initial?: { x: number; y: number; width: number; height: number } | null; onChange: (c: { x: number; y: number; width: number; height: number } | null) => void }) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [dragging, setDragging] = useState(false);
    const [start, setStart] = useState<{ x: number; y: number } | null>(null);
    const [crop, setCrop] = useState<{ x: number; y: number; width: number; height: number } | null>(initial || null);

    useEffect(() => { setCrop(initial || null); }, [initial?.x, initial?.y, initial?.width, initial?.height]);

    function normRect(a: number, b: number, c: number, d: number) {
      const x = Math.max(0, Math.min(a, c));
      const y = Math.max(0, Math.min(b, d));
      const w = Math.abs(c - a);
      const h = Math.abs(d - b);
      return { x, y, w, h };
    }

    const onMouseDown = (e: React.MouseEvent) => {
      const box = containerRef.current?.getBoundingClientRect();
      if (!box) return;
      const px = e.clientX - box.left;
      const py = e.clientY - box.top;
      setDragging(true);
      setStart({ x: px, y: py });
    };
    const onMouseMove = (e: React.MouseEvent) => {
      if (!dragging || !start) return;
      const box = containerRef.current?.getBoundingClientRect();
      if (!box) return;
      const px = e.clientX - box.left;
      const py = e.clientY - box.top;
      const r = normRect(start.x, start.y, px, py);
      const n = { x: r.x / canvasSize.w, y: r.y / canvasSize.h, width: r.w / canvasSize.w, height: r.h / canvasSize.h };
      setCrop(n);
      onChange(n);
    };
    const onMouseUp = () => { setDragging(false); setStart(null); };

    const styleRect: React.CSSProperties | undefined = crop
      ? { position: 'absolute', left: `${(crop.x) * 100}%`, top: `${(crop.y) * 100}%`, width: `${(crop.width) * 100}%`, height: `${(crop.height) * 100}%`, border: '2px solid #2563eb', background: 'rgba(37,99,235,0.1)', pointerEvents: 'none' }
      : undefined;

    return (
      <div
        ref={containerRef}
        className="absolute inset-0 cursor-crosshair"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
      >
        {crop && <div style={styleRect} />}
      </div>
    );
  }


  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back to results */}
        <div className="mb-3">
          <Link href="/products" className="text-sm text-primary hover:underline">
            ← {t('products.back_to_results')}
          </Link>
        </div>

        {/* Breadcrumbs */}
        <nav className="text-xs text-gray-500 mb-4" aria-label="Breadcrumb">
          <ol className="list-none p-0 inline-flex gap-1">
            <li>
              <Link href="/" className="hover:underline">{t('nav.home')}</Link>
              <span className="mx-1">/</span>
            </li>
            <li>
              <Link href="/products" className="hover:underline">{t('nav.products')}</Link>
              <span className="mx-1">/</span>
            </li>
            <li aria-current="page" className="text-gray-700 font-medium truncate max-w-[50ch]">
              {product.description.split(' ').slice(0, 3).join(' ') || product.sku}
            </li>
          </ol>
        </nav>
        <div className="lg:grid lg:grid-cols-2 lg:gap-8">
          {/* Product Image */}
          <div className="mb-8 lg:mb-0">
            <div className="bg-gray-100 rounded-lg overflow-hidden">
              <div className="relative w-full h-full flex items-center justify-center bg-gray-100 p-2">
                {(editMode || !!displayCropNorm) && displayPdfUrl ? (
                  <div className="relative">
                    <PdfPageImage
                      pdfUrl={displayPdfUrl}
                      pageNumber={displayPageNumber}
                      cropNorm={editMode ? undefined : (displayCropNorm || undefined)}
                      onRendered={(w, h) => setCanvasSize({ w, h })}
                    />
                    {editMode && canvasSize && (
                      <CropOverlay
                        canvasSize={canvasSize}
                        initial={displayCropNorm || pendingCrop || undefined}
                        onChange={(c) => setPendingCrop(c)}
                      />
                    )}
                  </div>
                ) : skuImage ? (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <Image src={skuImage} alt={product.description || product.sku} width={800} height={600} className="w-full h-auto object-contain" />
                  </div>
                ) : displayPdfUrl ? (
                  <div className="relative">
                    <PdfPageImage
                      pdfUrl={displayPdfUrl}
                      pageNumber={displayPageNumber}
                      cropNorm={editMode ? undefined : (displayCropNorm || undefined)}
                      onRendered={(w, h) => setCanvasSize({ w, h })}
                    />
                    {editMode && canvasSize && (
                      <CropOverlay
                        canvasSize={canvasSize}
                        initial={displayCropNorm || pendingCrop || undefined}
                        onChange={(c) => setPendingCrop(c)}
                      />
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-lg font-medium text-gray-700 mb-2">
                      {product.product_category || 'Product'}
                    </div>
                    <div className="text-sm text-gray-500">SKU: {product.sku}</div>
                  </div>
                )}
              </div>
            </div>
            {editMode && displayPdfUrl && (
              <div className="mt-3 flex items-center gap-2">
                <button
                  className="px-3 py-1.5 rounded bg-blue-600 text-white disabled:opacity-50"
                  disabled={saving || !pendingCrop}
                  onClick={async () => {
                    if (!pendingCrop || !product) return;
                    try {
                      setSaving(true);
                      const sku = product.sku;
                      const res = await fetch('/api/product-image-overrides', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ sku, image_page: displayPageNumber, image_crop_norm: pendingCrop })
                      });
                      if (res.ok) {
                        setDisplayCropNorm(pendingCrop);
                        setPendingCrop(null);
                      }
                    } finally {
                      setSaving(false);
                    }
                  }}
                >
                  {saving ? 'Saving…' : 'Save Crop'}
                </button>
                <button
                  className="px-3 py-1.5 rounded bg-emerald-600 text-white disabled:opacity-50"
                  disabled={saving}
                  onClick={async () => {
                    // Auto-detect main object using OpenCV.js
                    async function loadCV() {
                      if ((window as any).cv && (window as any).cv.Mat) return (window as any).cv;
                      await new Promise<void>((resolve, reject) => {
                        const s = document.createElement('script');
                        s.src = 'https://docs.opencv.org/4.x/opencv.js';
                        s.async = true;
                        s.onload = () => {
                          const cv = (window as any).cv;
                          if (!cv) { reject(new Error('cv not loaded')); return; }
                          if (cv['onRuntimeInitialized']) {
                            cv['onRuntimeInitialized'] = () => resolve();
                          } else {
                            resolve();
                          }
                        };
                        s.onerror = () => reject(new Error('Failed to load OpenCV.js'));
                        document.head.appendChild(s);
                      });
                      return (window as any).cv;
                    }

                    try {
                      const cv = await loadCV();
                      const canvas = document.getElementById('product-pdf-canvas') as HTMLCanvasElement | null;
                      if (!canvas) return;
                      // Read image into OpenCV
                      const src = cv.imread(canvas);
                      const gray = new cv.Mat();
                      const blur = new cv.Mat();
                      const edges = new cv.Mat();
                      const dil = new cv.Mat();
                      try {
                        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
                        cv.GaussianBlur(gray, blur, new cv.Size(5,5), 0, 0, cv.BORDER_DEFAULT);
                        cv.Canny(blur, edges, 50, 150, 3, false);
                        const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(5,5));
                        cv.dilate(edges, dil, kernel);
                        const contours = new cv.MatVector();
                        const hierarchy = new cv.Mat();
                        cv.findContours(dil, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
                        let maxArea = 0; let bestRect: {x:number;y:number;width:number;height:number}|null = null;
                        for (let i = 0; i < contours.size(); i++) {
                          const c = contours.get(i);
                          const rect = cv.boundingRect(c);
                          const area = rect.width * rect.height;
                          // Heuristics: ignore tiny or nearly full-page rectangles
                          if (area < (canvas.width * canvas.height) * 0.01) continue;
                          if (area > (canvas.width * canvas.height) * 0.95) continue;
                          // Prefer more square-ish or portrait rectangles typical of product photos
                          const aspect = rect.width / Math.max(1, rect.height);
                          const aspectScore = Math.min(aspect, 1/aspect); // closer to 1 is better
                          const score = area * (0.5 + 0.5 * aspectScore);
                          if (score > maxArea) { maxArea = score; bestRect = rect; }
                        }
                        contours.delete();
                        hierarchy.delete();
                        if (bestRect) {
                          const x = Math.max(0, bestRect.x - Math.round(bestRect.width * 0.03));
                          const y = Math.max(0, bestRect.y - Math.round(bestRect.height * 0.03));
                          const w = Math.min(canvas.width - x, Math.round(bestRect.width * 1.06));
                          const h = Math.min(canvas.height - y, Math.round(bestRect.height * 1.06));
                          const crop = { x: x / canvas.width, y: y / canvas.height, width: w / canvas.width, height: h / canvas.height };
                          setPendingCrop(crop);
                          setDisplayCropNorm(crop);
                        }
                      } finally {
                        src.delete(); gray.delete(); blur.delete(); edges.delete(); dil.delete();
                      }
                    } catch (e) {
                      // eslint-disable-next-line no-console
                      console.error('Auto-detect failed', e);
                    }
                  }}
                >
                  Auto Detect
                </button>
                <button
                  className="px-3 py-1.5 rounded bg-gray-200 text-gray-800"
                  onClick={() => setPendingCrop(null)}
                >
                  Reset
                </button>
              </div>
            )}
          </div>
          
          {/* Product Info */}
          <div className="lg:pl-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {product.description.split(' ').slice(0, 3).join(' ')}
            </h1>
            <p className="text-gray-500 text-sm mb-4">SKU: {product.sku}</p>
            
            <div className="mt-4">
              <h2 className="text-2xl font-bold text-gray-900">
                {formatCurrency(priceNumber)}
              </h2>
              <p className="text-green-600 text-sm mt-1">In Stock</p>
            </div>
            
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-900">Description</h3>
              <div className="mt-2 text-gray-700">
                <p>{product.description}</p>
              </div>
            </div>
            
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-900">Specifications</h3>
              <dl className="mt-2 grid grid-cols-2 gap-2 text-sm text-gray-700">
                {product.product_category && (
                  <>
                    <dt className="font-medium">Category</dt>
                    <dd>{product.product_category}</dd>
                  </>
                )}
                {(product.pressure_min_bar || product.pressure_max_bar) && (
                  <>
                    <dt className="font-medium">Pressure</dt>
                    <dd>
                      {product.pressure_min_bar ? `${product.pressure_min_bar}–` : ''}
                      {product.pressure_max_bar ? `${product.pressure_max_bar}` : ''} bar
                    </dd>
                  </>
                )}
                {((product as any).overpressure_bar || (product as any).overpressure_mpa) && (
                  <>
                    <dt className="font-medium">Overpressure</dt>
                    <dd>
                      {typeof (product as any).overpressure_bar === 'number' ? `${(product as any).overpressure_bar} bar` : ''}
                      {(product as any).overpressure_bar && (product as any).overpressure_mpa ? ' • ' : ''}
                      {typeof (product as any).overpressure_mpa === 'number' ? `${(product as any).overpressure_mpa} MPa` : ''}
                    </dd>
                  </>
                )}
                {product.power_kw && (
                  <>
                    <dt className="font-medium">Power</dt>
                    <dd>{product.power_kw} kW</dd>
                  </>
                )}
                {((product as any).power_input_kw || (product as any).power_output_kw) && (
                  <>
                    <dt className="font-medium">Power In/Out</dt>
                    <dd>
                      {typeof (product as any).power_input_kw === 'number' ? `${(product as any).power_input_kw}` : ''}
                      {(product as any).power_input_kw && (product as any).power_output_kw ? ' / ' : ''}
                      {typeof (product as any).power_output_kw === 'number' ? `${(product as any).power_output_kw}` : ''} kW
                    </dd>
                  </>
                )}
                {product.voltage_v && (
                  <>
                    <dt className="font-medium">Voltage</dt>
                    <dd>{product.voltage_v} V</dd>
                  </>
                )}
                {(product.frequency_hz || (product as any).phase_count || (product as any).current_a) && (
                  <>
                    <dt className="font-medium">Electrical</dt>
                    <dd>
                      {product.voltage_v ? `${product.voltage_v}V ` : ''}
                      {(product as any).phase_count ? `~${(product as any).phase_count} ` : ''}
                      {product.frequency_hz ? `${product.frequency_hz}Hz ` : ''}
                      {(product as any).current_a ? `${(product as any).current_a}A` : ''}
                    </dd>
                  </>
                )}
                {(product.flow_l_min || (product as any).flow_l_h || product.debiet_m3_h) && (
                  <>
                    <dt className="font-medium">Flow</dt>
                    <dd>
                      {typeof product.flow_l_min === 'number' ? `${product.flow_l_min} L/min` : ''}
                      {product.flow_l_min && (product as any).flow_l_h ? ' • ' : ''}
                      {typeof (product as any).flow_l_h === 'number' ? `${(product as any).flow_l_h} L/h` : ''}
                      {!product.flow_l_min && !(product as any).flow_l_h && typeof product.debiet_m3_h === 'number' ? `${product.debiet_m3_h} m³/h` : ''}
                    </dd>
                  </>
                )}
                {product.absk_codes && product.absk_codes.length > 0 && (
                  <>
                    <dt className="font-medium">ABSK Codes</dt>
                    <dd className="break-words">{product.absk_codes.join(', ')}</dd>
                  </>
                )}
                {product.weight_kg && (
                  <>
                    <dt className="font-medium">Weight</dt>
                    <dd>{product.weight_kg} kg</dd>
                  </>
                )}
                {Array.isArray(product.materials) && product.materials.length > 0 && (
                  <>
                    <dt className="font-medium">Materials</dt>
                    <dd>{product.materials.join(', ')}</dd>
                  </>
                )}
                {(product.length_mm || product.width_mm || product.height_mm) && (
                  <>
                    <dt className="font-medium">Dimensions</dt>
                    <dd>
                      {product.length_mm ? `${product.length_mm}` : ''}
                      {(product.length_mm && product.width_mm) ? '×' : ''}
                      {product.width_mm ? `${product.width_mm}` : ''}
                      {(product.width_mm && product.height_mm) ? '×' : ''}
                      {product.height_mm ? `${product.height_mm}` : ''} mm
                    </dd>
                  </>
                )}
                {(product as any).rpm && (
                  <>
                    <dt className="font-medium">Motor Speed</dt>
                    <dd>{(product as any).rpm} rpm</dd>
                  </>
                )}
                {(product as any).cable_length_m && (
                  <>
                    <dt className="font-medium">Cable Length</dt>
                    <dd>{(product as any).cable_length_m} m</dd>
                  </>
                )}
                {product.dimensions_mm_list && product.dimensions_mm_list.length > 0 && (
                  <>
                    <dt className="font-medium">Available Sizes</dt>
                    <dd>{product.dimensions_mm_list.join('mm, ')}mm</dd>
                  </>
                )}
              </dl>
            </div>
            
            <div className="mt-6" id="pdf">
              <h3 className="text-sm font-medium text-gray-900">Product Details</h3>
              <div className="mt-2 space-y-3">
                {product.pdf_source && (
                  <div>
                    <p className="text-sm text-gray-500">Pdf Source</p>
                    <a
                      href={`${product.pdf_source}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1.5"
                    >
                      <span>{(() => { try { const u = new URL(product.pdf_source); return decodeURIComponent(u.pathname.split('/').pop() || 'PDF'); } catch { const p = product.pdf_source.split('?')[0]; return decodeURIComponent((p.split('/').pop() || 'PDF')); } })()}</span>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                )}
                {product.pdf_source && product.source_pages && product.source_pages.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-500">Pdf Source Page</p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {product.source_pages.map((p) => (
                        <a
                          key={`page-${p}`}
                          href={`${product.pdf_source}#page=${p}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 bg-gray-100 rounded-md text-xs font-medium text-gray-700 hover:underline"
                        >
                          Page {p}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-8">
              <AddToCart product={product} />
            </div>
            
            {(Array.isArray((product as any).features) && (product as any).features.length > 0) && (
              <div className="mt-6 bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Features</h2>
                </div>
                <div className="p-6">
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    {(product as any).features.slice(0, 12).map((f: string, i: number) => (
                      <li key={`pfeat-${i}`}>{f}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div className="mt-4 flex items-center text-sm text-gray-500">
              <svg className="flex-shrink-0 mr-2 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              <span>Free shipping on orders over €100</span>
            </div>
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <svg className="flex-shrink-0 mr-2 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <span>Delivery within 2-3 business days</span>
            </div>
          </div>
        </div>
        
        {/* Related Products */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">You may also like</h2>
          {recsLoading && (
            <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-4">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="group relative animate-pulse">
                  <div className="w-full min-h-80 bg-gray-200 rounded-md overflow-hidden"></div>
                  <div className="mt-4 flex justify-between">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {!recsLoading && (
            <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-4">
              {recs.length > 0 ? (
                recs.map((rp) => (
                  <ProductCard key={rp.sku} product={rp} viewMode="grid" />
                ))
              ) : (
                Array(4).fill(0).map((_, i) => (
                  <div key={i} className="group relative animate-pulse">
                    <div className="w-full min-h-80 bg-gray-200 rounded-md overflow-hidden"></div>
                    <div className="mt-4 flex justify-between">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
