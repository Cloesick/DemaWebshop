import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { CookieConsentProvider } from '@/contexts/CookieConsentContext';
import CookieConsentWrapper from '@/components/layout/CookieConsentWrapper';
import { LocaleProvider } from '@/contexts/LocaleContext';

export const metadata: Metadata = {
  title: 'DemaShop - Professional Industrial Equipment',
  description: 'Your trusted partner for industrial equipment and tools. High-quality products with expert support.',
  metadataBase: new URL('https://www.demashop.be'),
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: [
      { url: '/assets/front/favicon/dema/favicon.png' },
    ],
  },
  other: {
    'theme-color': '#00adef',
  },
};

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Additional meta tags */}
        <meta name="google-site-verification" content="" />
        <meta name="google-site-verification" content="" />
      </head>
      <body className={`${inter.variable} font-sans bg-white text-gray-900 flex flex-col min-h-screen`}>
        <CookieConsentProvider>
          <LocaleProvider>
            <Header />
            <main className="flex-grow">
              {children}
            </main>
            <Footer />
            <CookieConsentWrapper />
          </LocaleProvider>
        </CookieConsentProvider>
      </body>
    </html>
  );
}
