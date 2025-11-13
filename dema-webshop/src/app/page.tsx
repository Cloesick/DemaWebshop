'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { FiArrowRight, FiHeadphones, FiShield, FiTruck } from 'react-icons/fi';
import { useLocale } from '@/contexts/LocaleContext';
import { useCookieConsent } from '@/contexts/CookieConsentContext';
import ProductCard from '@/components/products/ProductCard';
import type { Product } from '@/types/product';

// Placeholder image component to handle loading states
const InlinePlaceholderImage = ({ src, alt, className }: { src: string; alt: string; className?: string }) => {
  return (
    <div className={`relative bg-gray-100 overflow-hidden ${className || ''}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-blue-100"></div>
      <div className="relative h-full flex items-center justify-center p-4">
        <span className="text-gray-400 text-sm text-center">{alt}</span>
      </div>
    </div>
  );
};

// Feature component
const Feature = ({ icon: Icon, title, children }: { icon: any, title: string, children: React.ReactNode }) => (
  <div className="flex items-start space-x-4">
    <div className="flex-shrink-0 bg-blue-100 p-2 rounded-full text-blue-600">
      <Icon className="h-6 w-6" />
    </div>
    <div>
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      <p className="mt-1 text-gray-600">{children}</p>
    </div>
  </div>
);

// Default highlights (can be tailored if preference cookies are allowed)
const defaultHighlights = [
  {
    name: 'Pro Air Compressor X200',
    description: 'Bestseller for workshops needing reliable continuous duty',
    image: '/images/compressors.jpg',
    tag: 'Bestseller',
    category: 'Compressors',
  },
  {
    name: 'Titan Pneumatic Impact Wrench',
    description: 'High torque with low vibration for daily professional use',
    image: '/images/tools.jpg',
    tag: 'Pro pick',
    category: 'Pneumatic Tools',
  },
  {
    name: 'UltraClean FRL System',
    description: 'Keep your air lines pristine with premium filtration',
    image: '/images/air-treatment.jpg',
    tag: 'New',
    category: 'Air Treatment',
  },
  {
    name: 'Flexi-Hose Kit 10m',
    description: 'Durable, kink-resistant hose with quick-connect fittings',
    image: '/images/hoses.jpg',
    tag: 'Staff pick',
    category: 'Hoses & Fittings',
  },
];

const features = [
  { key: 'free_shipping', icon: FiTruck },
  { key: 'warranty', icon: FiShield },
  { key: 'support', icon: FiHeadphones },
];

export default function Home() {
  const { consent } = useCookieConsent();
  const { t } = useLocale();
  const [highlights, setHighlights] = useState(defaultHighlights);
  const [personalized, setPersonalized] = useState(false);
  const [highlightProducts, setHighlightProducts] = useState<Product[]>([]);

  // Simple personalization: if preference cookies are allowed and a preferredCategory exists,
  // prioritize items from that category
  useEffect(() => {
    try {
      if (consent?.preferences) {
        const preferredCategory = localStorage.getItem('preferredCategory');
        if (preferredCategory) {
          const prioritized = [
            ...defaultHighlights.filter(h => h.category === preferredCategory),
            ...defaultHighlights.filter(h => h.category !== preferredCategory),
          ];
          setHighlights(prioritized);
          setPersonalized(true);
          return;
        }
      }
    } catch (_) {
      // ignore personalization if localStorage is unavailable
    }
    setHighlights(defaultHighlights);
    setPersonalized(false);
  }, [consent?.preferences]);

  // Server recommendations when analytics or marketing consent is granted
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      // Prefer profile-based marketing personalization if user opted in
      let usedMarketingSuggestions = false;
      try {
        const profileMarketing = typeof window !== 'undefined' && localStorage.getItem('profile:marketing') === 'true';
        if (profileMarketing) {
          const clientId = (() => {
            try {
              let id: string = localStorage.getItem('client:id') || '';
              if (!id) {
                id = (crypto as any)?.randomUUID ? (crypto as any).randomUUID() : String(Math.random());
                localStorage.setItem('client:id', id);
              }
              return id;
            } catch (_) {
              return '';
            }
          })();
          if (clientId) {
            const r = await fetch(`/api/marketing/suggestions?clientId=${encodeURIComponent(clientId)}&limit=4`, { cache: 'no-store' });
            if (r.ok) {
              const data = await r.json();
              if (!cancelled && Array.isArray(data.items)) {
                setHighlightProducts(data.items as Product[]);
                setPersonalized(Boolean(data.personalized));
                usedMarketingSuggestions = true;
              }
            }
          }
        }
      } catch (_) {}

      if (usedMarketingSuggestions) return;

      if (!(consent?.analytics || consent?.marketing)) {
        return;
      }
      try {
        let preferredCategory = '';
        try {
          if (consent?.preferences) {
            preferredCategory = localStorage.getItem('preferredCategory') || '';
          }
        } catch (_) {}
        const params = new URLSearchParams();
        params.set('limit', '4');
        if (preferredCategory) params.set('preferredCategory', preferredCategory);
        params.set('personalized', preferredCategory ? 'true' : 'false');
        const res = await fetch(`/api/recommendations?${params.toString()}`, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        if (Array.isArray(data.items) && data.items.length) {
          setHighlightProducts(data.items as Product[]);
          setPersonalized(Boolean(data.personalized));
        }
      } catch (_) {
        // ignore
      }
    };
    run();
    return () => { cancelled = false; };
  }, [consent?.analytics, consent?.marketing, consent?.preferences]);
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-700 to-blue-900 text-white overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-blue-900 opacity-90"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
              <h1 className="text-4xl tracking-tight font-extrabold text-white sm:text-5xl md:text-6xl">
                <span className="block">{t('home.hero.title_line1')}</span>
                <span className="block text-blue-200">{t('home.hero.title_line2')}</span>
              </h1>
              <p className="mt-3 text-base text-blue-100 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                {t('home.hero.subtitle')}
              </p>
              <div className="mt-10 sm:flex sm:justify-center lg:justify-start">
                <div className="rounded-md shadow">
                  <Link
                    href="/products"
                    className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-700 bg-yellow-400 hover:bg-yellow-500 md:py-4 md:text-lg md:px-10"
                  >
                    {t('common.shop_now')}
                  </Link>
                </div>
                <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
                  <Link
                    href="/about"
                    className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-700 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
                  >
                    {t('common.learn_more')}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase">{t('home.features.heading')}</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              {t('home.features.title')}
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
              {t('home.features.subtitle')}
            </p>
          </div>

          <div className="mt-10">
            <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-3 md:gap-x-8 md:gap-y-10">
              {features.map((feature) => (
                <Feature
                  key={feature.key}
                  icon={feature.icon}
                  title={t(`home.features.${feature.key}.title`)}
                >
                  {t(`home.features.${feature.key}.desc`)}
                </Feature>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Product Highlights */}
      <div className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">{t('home.highlights.heading')}</h2>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
              {personalized ? t('home.highlights.recommended') : t('home.highlights.popular')}
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {(highlightProducts.length ? highlightProducts : []).slice(0,4).map((p) => (
              <div key={p.sku} className="p-2">
                <ProductCard product={p} viewMode="grid" />
              </div>
            ))}
            {highlightProducts.length === 0 && (
              <div className="sm:col-span-2 lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {highlights.map((item) => (
                  <div key={item.name} className="group relative bg-white border border-gray-200 rounded-lg overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-200">
                    <div className="w-full h-48 bg-gray-100 p-4 overflow-hidden flex items-center justify-center">
                      <InlinePlaceholderImage src={item.image} alt={item.name} className="w-full h-full object-contain" />
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-bold text-gray-900 mb-1 break-words">{item.name}</h3>
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">{item.tag}</span>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">{item.description}</p>
                      <div className="mt-3">
                        <Link href={`/products?category=${encodeURIComponent(item.category)}`} className="inline-flex items-center text-sm font-medium text-blue-700 hover:text-blue-800">
                          {t('home.highlights.view_in')} {item.category}
                          <FiArrowRight className="ml-1 h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/products"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              {t('home.highlights.view_all')}
              <FiArrowRight className="ml-2 -mr-1 w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-700">
        <div className="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            <span className="block">{t('home.cta.title_line1')}</span>
            <span className="block">{t('home.cta.title_line2')}</span>
          </h2>
          <p className="mt-4 text-lg leading-6 text-blue-200">
            {t('home.cta.subtitle')}
          </p>
          <Link
            href="/products"
            className="mt-8 w-full inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 sm:w-auto"
          >
            {t('common.shop_now')}
          </Link>
        </div>
      </div>
    </div>
  );
}
