'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown, FileText } from 'lucide-react';

const ALL_CATALOGS = [
  { name: 'Bronpompen', url: '/catalog/group/bronpompen', icon: '🚰' },
  { name: 'Aandrijftechniek', url: '/catalog/group/catalogus-aandrijftechniek-150922', icon: '⚙️' },
  { name: 'Centrifugaalpompen', url: '/catalog/group/centrifugaalpompen', icon: '💧' },
  { name: 'Pompentoebehoren', url: '/catalog/group/digitale-versie-pompentoebehoren-compressed', icon: '🔧' },
  { name: 'Dompelpompen', url: '/catalog/group/dompelpompen', icon: '⬇️' },
  { name: 'Drukbuizen', url: '/catalog/group/drukbuizen', icon: '🌀' },
  { name: 'Kunststof Afvoerleidingen', url: '/catalog/group/kunststof-afvoerleidingen', icon: '🚿' },
  { name: 'Messing Draadfittingen', url: '/catalog/group/messing-draadfittingen', icon: '🔩' },
  { name: 'PE Buizen', url: '/catalog/group/pe-buizen', icon: '📦' },
  { name: 'PU Afzuigslangen', url: '/catalog/group/pu-afzuigslangen', icon: '🌊' },
  { name: 'RVS Draadfittingen', url: '/catalog/group/rvs-draadfittingen', icon: '✨' },
  { name: 'Rubber Slangen', url: '/catalog/group/rubber-slangen', icon: '🔌' },
  { name: 'Slangklemmen', url: '/catalog/group/slangklemmen', icon: '🗜️' },
  { name: 'Slangkoppelingen', url: '/catalog/group/slangkoppelingen', icon: '🔗' },
  { name: 'Verzinkte Buizen', url: '/catalog/group/verzinkte-buizen', icon: '🏗️' },
  { name: 'Zwarte Draad/Lasfittingen', url: '/catalog/group/zwarte-draad-en-lasfittingen', icon: '⚫' },
];

interface CatalogDropdownProps {
  currentCatalog?: string;
}

export default function CatalogDropdown({ currentCatalog }: CatalogDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const current = ALL_CATALOGS.find(c => 
    currentCatalog && c.name.toLowerCase().includes(currentCatalog.toLowerCase())
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-300 rounded-lg hover:border-[#00ADEF] transition-colors text-sm font-medium"
      >
        <FileText className="h-4 w-4" />
        <span>{current ? `${current.icon} ${current.name}` : '📚 All Catalogs'}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white border-2 border-gray-200 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
          <div className="p-2">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase border-b">
              All Catalogs ({ALL_CATALOGS.length})
            </div>
            {ALL_CATALOGS.map((catalog) => (
              <Link
                key={catalog.url}
                href={catalog.url}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors ${
                  current?.url === catalog.url ? 'bg-blue-50 font-semibold' : ''
                }`}
              >
                <span className="text-xl">{catalog.icon}</span>
                <span className="text-sm text-gray-900">{catalog.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
