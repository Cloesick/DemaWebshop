'use client';

import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { useEffect, useState } from 'react';
import { useCartStore } from '@/store/cartStore';
import Cart from '@/components/cart/Cart';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Providers } from './providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMounted, setIsMounted] = useState(false);
  const { isOpen } = useCartStore();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-grow">{children}</main>
            <Footer />
            <Cart />
            <Toaster position="bottom-right" />
          </div>
        </Providers>
      </body>
    </html>
  );
}
