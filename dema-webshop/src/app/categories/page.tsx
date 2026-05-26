import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';

const CATEGORIES = [
  { slug: 'pumps-accessories', label: 'Pumps & Accessories' },
  { slug: 'plastic-piping', label: 'Plastic Piping' },
  { slug: 'metal-piping', label: 'Metal Piping' },
  { slug: 'industrial-hoses-and-couplings', label: 'Industrial Hoses & Couplings' },
  { slug: 'transmission', label: 'Transmission' },
  { slug: 'valves-and-fittings', label: 'Valves & Fittings' },
  { slug: 'measurement-control', label: 'Measurement & Control' },
  { slug: 'irrigation', label: 'Irrigation' },
  { slug: 'fasteners', label: 'Fasteners' },
  { slug: 'power-tools', label: 'Power Tools' },
  { slug: 'tools', label: 'Tools' },
];

export default function CategoriesPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="container mx-auto px-4 py-8 flex-1">
        <h1 className="text-3xl font-bold mb-6">Categories</h1>
        <p className="text-sm text-gray-500 mb-6">Choose a category to view products. All category pages use the same layout and content template.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CATEGORIES.map(({ slug, label }) => (
            <Link
              key={slug}
              href={`/categories/${slug}`}
              className="block rounded-md border border-gray-200 bg-white p-4 hover:shadow-card-hover transition-shadow"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">{label}</span>
                <span className="text-yellow-600">View</span>
              </div>
              <p className="mt-1 text-xs text-gray-500 break-words">/categories/{slug}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
