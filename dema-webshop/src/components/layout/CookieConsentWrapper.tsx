'use client';

import dynamic from 'next/dynamic';
import { useCookieConsent } from '@/contexts/CookieConsentContext';

// Dynamically import the CookieConsent component with no SSR
const CookieConsent = dynamic(
  () => import('./CookieConsent'),
  { ssr: false }
);

export default function CookieConsentWrapper() {
  const { isConsentGiven, updateConsent } = useCookieConsent();
  
  // Don't show the banner if consent has already been given
  if (isConsentGiven) {
    return null;
  }

  return (
    <CookieConsent onAccept={updateConsent} />
  );
}
