let cache: { [sku: string]: { image_path: string } } | null = null;
let loading: Promise<typeof cache> | null = null;

export async function getSkuImagePath(sku: string): Promise<string | null> {
  if (!sku) return null;
  if (cache) {
    const entry = (cache as any).sku_images?.[sku];
    const path = entry?.image_path as string | undefined;
    return path ? normalizeWebPath(path) : null;
  }
  if (!loading) {
    loading = fetch('/data/Product_images.json', { cache: 'force-cache' })
      .then(async (r) => {
        if (!r.ok) throw new Error('Failed to load Product_images.json');
        return r.json();
      })
      .then((j) => {
        cache = j || {};
        return cache;
      })
      .catch(() => {
        cache = {} as any;
        return cache;
      });
  }
  const data = await loading;
  const entry = (data as any).sku_images?.[sku];
  const path = entry?.image_path as string | undefined;
  return path ? normalizeWebPath(path) : null;
}

function normalizeWebPath(p: string): string {
  // The mapping may use paths like "public/images/pdf_pages/..."; strip public and ensure leading slash
  const cleaned = p.replace(/\\/g, '/');
  const noPublic = cleaned.replace(/^\/?public\//, '/');
  return noPublic.startsWith('/') ? noPublic : `/${noPublic}`;
}
