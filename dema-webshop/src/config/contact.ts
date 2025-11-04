export type Locale = 'en' | 'nl' | 'fr';

export const CONTACT: Record<Locale, { phone: string; email: string }> = {
  en: { phone: '+32 2 123 45 67', email: 'info@demashop.be' },
  nl: { phone: '+32 2 123 45 67', email: 'info@demashop.be' },
  fr: { phone: '+32 2 123 45 67', email: 'info@demashop.be' },
};
