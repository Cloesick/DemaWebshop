import { getPdfCategories, getPdfsByCategory, getSubcategoriesForMain } from '@/lib/pdfCatalog';
import CategoryTile from '@/components/categories/CategoryTile';

export default async function CategoriesPage() {
  const pdfCategories = await getPdfCategories();
  const tiles = await Promise.all(
    pdfCategories.map(async ({ slug, label, count }) => {
      const pdfs = await getPdfsByCategory(slug);
      const subcategories = getSubcategoriesForMain(slug);
      return { slug, label, count, pdfs, subcategories };
    })
  );

  return (
    <div className="min-h-screen flex flex-col">
      <main className="container mx-auto px-4 py-8 flex-1">
        <h1 className="text-3xl font-bold mb-6">Categories</h1>
        <p className="text-sm text-gray-500 mb-6">
          Categories detected from documents folder. Each tile links to its category page and shows how many PDFs are inside.
        </p>
        {pdfCategories.length === 0 ? (
          <div className="text-sm text-gray-600">
            No PDFs found under <code className="px-1 py-0.5 rounded bg-gray-100">public/documents/Product_pdfs</code>.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tiles.map(({ slug, label, count, pdfs, subcategories }) => (
              <CategoryTile key={slug} slug={slug} label={label} count={count} pdfs={pdfs} subcategories={subcategories} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
