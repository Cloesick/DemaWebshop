"use client";
import { useEffect, useState } from 'react';
import CategoryTile from '@/components/categories/CategoryTile';
import { useLocale } from '@/contexts/LocaleContext';

export default function CategoriesPage() {
  const { t } = useLocale();
  const [tiles, setTiles] = useState<Array<{ slug: string; label: string; count: number; pdfs?: { name: string; href: string }[]; subcategories?: { slug: string; label: string }[] }>>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/pdf-catalog');
        if (!res.ok) throw new Error('Failed to load categories');
        const data = await res.json();
        if (Array.isArray(data?.categories)) setTiles(data.categories);
      } catch {
        setTiles([]);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <main className="container mx-auto px-4 py-8 flex-1">
        <h1 className="text-3xl font-bold mb-6">{t('nav.categories')}</h1>
        <p className="text-sm text-gray-500 mb-6">
          {t('categories.intro')}
        </p>
        {tiles.length === 0 ? (
          <div className="text-sm text-gray-600">
            {t('categories.empty')}
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
