'use client';

import Link from 'next/link';
import { FiSearch, FiShoppingCart, FiUser, FiMapPin, FiMenu } from 'react-icons/fi';
import { useLocale } from '@/contexts/LocaleContext';
import { CONTACT } from '@/config/contact';

export default function Header() {
  const { t, locale, setLocale } = useLocale();
  const contact = CONTACT[locale];
  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      {/* Top Bar */}
      <div className="bg-gray-900 text-white text-sm py-1">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <a href={`tel:${contact.phone.replace(/\s+/g,'')}`} className="hover:text-yellow-400 transition-colors">
              {t('topbar.customer_service')}: {contact.phone}
            </a>
            <span>|</span>
            <a href={`mailto:${contact.email}`} className="hover:text-yellow-400 transition-colors">
              {contact.email}
            </a>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/account" className="hover:text-yellow-400 flex items-center">
              <FiUser className="mr-1" /> {t('account')}
            </Link>
            <Link href="/contact" className="hover:text-yellow-400">{t('contact')}</Link>
            <div className="hidden sm:flex items-center space-x-1">
              {(['en','nl','fr'] as const).map(l => (
                <button
                  key={l}
                  onClick={() => setLocale(l)}
                  className={`px-2 py-0.5 text-xs rounded border ${locale===l ? 'bg-yellow-500 text-white border-yellow-500' : 'bg-transparent text-white border-white/30 hover:bg-white/10'}`}
                >{l.toUpperCase()}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row items-center justify-between">
          {/* Logo */}
          <div className="mb-4 md:mb-0">
            <Link href="/" className="flex items-center">
              <img 
                src="/assets/front/favicon/dema/logo.png" 
                alt="DEMA Shop Logo" 
                className="h-12 w-auto" 
                width={160}
                height={48}
                onError={(e) => {
                  // Fallback to text if image fails to load
                  const container = (e.target as HTMLElement).parentElement;
                  if (container) {
                    container.innerHTML = `
                      <span className="text-2xl font-bold text-gray-900">
                        DEMA<span class="text-primary">SHOP</span>
                      </span>
                    `;
                  }
                }}
              />
            </Link>
          </div>

          {/* Search Bar */}
          <div className="w-full md:w-1/3 mb-4 md:mb-0">
            <div className="relative">
              <input
                type="text"
                placeholder={t('search.placeholder')}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button className="absolute right-0 top-0 h-full px-4 bg-blue-600 text-white rounded-r-md hover:bg-blue-700">
                <FiSearch className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Cart & Contact */}
          <div className="flex items-center space-x-4">
            <Link href="/cart" className="flex items-center text-gray-700 hover:text-blue-600">
              <div className="relative">
                <FiShoppingCart className="h-6 w-6" />
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  0
                </span>
              </div>
              <span className="ml-1 hidden md:inline">{t('cart')}</span>
            </Link>
            <button className="md:hidden text-gray-700">
              <FiMenu className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex justify-center mt-4">
          <ul className="flex space-x-8">
            <li><Link href="/" className="text-gray-700 hover:text-blue-600 font-medium">{t('nav.home')}</Link></li>
            <li><Link href="/products" className="text-gray-700 hover:text-blue-600 font-medium">{t('nav.products')}</Link></li>
            <li><Link href="/categories" className="text-gray-700 hover:text-blue-600 font-medium">{t('nav.categories')}</Link></li>
            <li><Link href="/about" className="text-gray-700 hover:text-blue-600 font-medium">{t('nav.about')}</Link></li>
            <li><Link href="/contact" className="text-gray-700 hover:text-blue-600 font-medium">{t('contact')}</Link></li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
