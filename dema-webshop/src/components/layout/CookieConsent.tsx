'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const COOKIE_CONSENT_KEY = 'cookie-consent';

type CookieConsentProps = {
  onAccept: (preferences: {
    necessary: boolean;
    analytics: boolean;
    marketing: boolean;
    preferences: boolean;
  }) => void;
};

export default function CookieConsent({ onAccept }: CookieConsentProps) {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [consent, setConsent] = useState({
    necessary: true, // Always true as it's required
    analytics: false,
    marketing: false,
    preferences: false,
  });

  useEffect(() => {
    // Check if user has already given consent
    const savedConsent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!savedConsent) {
      setShowBanner(true);
    }
  }, []);

  const handleAcceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
    };
    setConsent(allAccepted);
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(allAccepted));
    onAccept(allAccepted);
    setShowBanner(false);
  };

  const handleRejectAll = () => {
    const rejected = {
      necessary: true, // Necessary cookies can't be rejected
      analytics: false,
      marketing: false,
      preferences: false,
    };
    setConsent(rejected);
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(rejected));
    onAccept(rejected);
    setShowBanner(false);
  };

  const handleSavePreferences = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent));
    onAccept(consent);
    setShowBanner(false);
  };

  const toggleSetting = (key: keyof typeof consent) => {
    setConsent(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  if (!showBanner) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Cookie Preferences</h2>
          
          <p className="text-gray-600 mb-6">
            We use cookies to enhance your experience on our website. Some cookies are necessary for the website to function properly, while others help us improve the site and understand how you interact with it. Please review your preferences below.
          </p>

          {showSettings ? (
            <div className="space-y-6">
              <div className="space-y-4">
                {/* Necessary Cookies - Always on */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">Necessary Cookies</h3>
                    <p className="text-sm text-gray-500">Essential for the website to function properly.</p>
                  </div>
                  <div className="relative inline-block w-10 mr-2 align-middle select-none">
                    <input 
                      type="checkbox" 
                      name="necessary" 
                      id="necessary"
                      checked={consent.necessary}
                      disabled
                      className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                    />
                    <label 
                      htmlFor="necessary" 
                      className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"
                    ></label>
                  </div>
                </div>

                {/* Analytics Cookies */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">Analytics Cookies</h3>
                    <p className="text-sm text-gray-500">Help us understand how visitors interact with our website.</p>
                  </div>
                  <div className="relative inline-block w-10 mr-2 align-middle select-none">
                    <input 
                      type="checkbox" 
                      name="analytics" 
                      id="analytics"
                      checked={consent.analytics}
                      onChange={() => toggleSetting('analytics')}
                      className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                    />
                    <label 
                      htmlFor="analytics" 
                      className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${consent.analytics ? 'bg-primary' : 'bg-gray-300'}`}
                    ></label>
                  </div>
                </div>

                {/* Marketing Cookies */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">Marketing Cookies</h3>
                    <p className="text-sm text-gray-500">Used to track visitors across websites for advertising purposes.</p>
                  </div>
                  <div className="relative inline-block w-10 mr-2 align-middle select-none">
                    <input 
                      type="checkbox" 
                      name="marketing" 
                      id="marketing"
                      checked={consent.marketing}
                      onChange={() => toggleSetting('marketing')}
                      className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                    />
                    <label 
                      htmlFor="marketing" 
                      className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${consent.marketing ? 'bg-primary' : 'bg-gray-300'}`}
                    ></label>
                  </div>
                </div>

                {/* Preferences Cookies */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">Preference Cookies</h3>
                    <p className="text-sm text-gray-500">Allow the website to remember choices you make.</p>
                  </div>
                  <div className="relative inline-block w-10 mr-2 align-middle select-none">
                    <input 
                      type="checkbox" 
                      name="preferences" 
                      id="preferences"
                      checked={consent.preferences}
                      onChange={() => toggleSetting('preferences')}
                      className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                    />
                    <label 
                      htmlFor="preferences" 
                      className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${consent.preferences ? 'bg-primary' : 'bg-gray-300'}`}
                    ></label>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  onClick={handleSavePreferences}
                  className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
                >
                  Save Preferences
                </button>
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={handleAcceptAll}
                  className="w-full px-4 py-3 bg-primary text-white font-medium rounded-md hover:bg-primary-dark transition-colors whitespace-nowrap"
                >
                  Accept All
                </button>
                <button
                  onClick={handleRejectAll}
                  className="w-full px-4 py-3 bg-white border border-gray-300 font-medium rounded-md hover:bg-gray-50 transition-colors whitespace-nowrap"
                >
                  Reject All
                </button>
              </div>
              <div className="pt-2">
                <button
                  onClick={() => setShowSettings(true)}
                  className="w-full px-4 py-2 text-sm text-gray-700 hover:text-gray-900 font-medium hover:bg-gray-50 rounded-md transition-colors"
                >
                  Customize Preferences
                </button>
              </div>
              <p className="text-xs text-gray-500">
                By clicking "Accept All Cookies", you agree to the storing of cookies on your device to enhance site navigation, analyze site usage, and assist in our marketing efforts. For more information, please read our{' '}
                <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
