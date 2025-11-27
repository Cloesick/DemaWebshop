'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface QuoteItem {
  sku: string;
  name: string;
  imageUrl?: string;
  category?: string;
  quantity: number;
  notes?: string;
}

interface QuoteContextType {
  quoteItems: QuoteItem[];
  isQuoteOpen: boolean;
  hasShownPopup: boolean;
  addToQuote: (item: Omit<QuoteItem, 'quantity' | 'notes'>) => void;
  removeFromQuote: (sku: string) => void;
  updateQuantity: (sku: string, quantity: number) => void;
  updateNotes: (sku: string, notes: string) => void;
  clearQuote: () => void;
  openQuote: () => void;
  closeQuote: () => void;
  toggleQuote: () => void;
}

const QuoteContext = createContext<QuoteContextType | undefined>(undefined);

export function QuoteProvider({ children }: { children: React.ReactNode }) {
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const [hasShownPopup, setHasShownPopup] = useState(false);

  // Load quote items from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('dema-quote-items');
    if (saved) {
      try {
        setQuoteItems(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading quote items:', e);
      }
    }

    // Check if popup has been shown this session
    const shownThisSession = sessionStorage.getItem('dema-quote-popup-shown');
    if (shownThisSession === 'true') {
      setHasShownPopup(true);
    }
  }, []);

  // Save quote items to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('dema-quote-items', JSON.stringify(quoteItems));
  }, [quoteItems]);

  const addToQuote = (item: Omit<QuoteItem, 'quantity' | 'notes'>) => {
    setQuoteItems(prev => {
      const existing = prev.find(i => i.sku === item.sku);
      if (existing) {
        // If already in quote, just increment quantity
        return prev.map(i => 
          i.sku === item.sku 
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      } else {
        // Add new item to quote
        return [...prev, { ...item, quantity: 1, notes: '' }];
      }
    });

    // Show popup only the first time in this session
    if (!hasShownPopup) {
      setIsQuoteOpen(true);
      setHasShownPopup(true);
      sessionStorage.setItem('dema-quote-popup-shown', 'true');
    }
  };

  const removeFromQuote = (sku: string) => {
    setQuoteItems(prev => prev.filter(item => item.sku !== sku));
  };

  const updateQuantity = (sku: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromQuote(sku);
      return;
    }
    setQuoteItems(prev => 
      prev.map(item => 
        item.sku === sku ? { ...item, quantity } : item
      )
    );
  };

  const updateNotes = (sku: string, notes: string) => {
    setQuoteItems(prev => 
      prev.map(item => 
        item.sku === sku ? { ...item, notes } : item
      )
    );
  };

  const clearQuote = () => {
    setQuoteItems([]);
  };

  const openQuote = () => setIsQuoteOpen(true);
  const closeQuote = () => setIsQuoteOpen(false);
  const toggleQuote = () => setIsQuoteOpen(prev => !prev);

  return (
    <QuoteContext.Provider
      value={{
        quoteItems,
        isQuoteOpen,
        hasShownPopup,
        addToQuote,
        removeFromQuote,
        updateQuantity,
        updateNotes,
        clearQuote,
        openQuote,
        closeQuote,
        toggleQuote,
      }}
    >
      {children}
    </QuoteContext.Provider>
  );
}

export function useQuote() {
  const context = useContext(QuoteContext);
  if (context === undefined) {
    throw new Error('useQuote must be used within a QuoteProvider');
  }
  return context;
}
