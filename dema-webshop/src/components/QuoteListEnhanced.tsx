'use client';

import { useQuote } from '@/contexts/QuoteContext';
import { X, FileText, Send } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { getFirebaseAuth, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from '@/lib/firebaseClient';
import { FiUser, FiMail, FiPhone, FiBriefcase, FiMapPin, FiCheck } from 'react-icons/fi';

type QuoteFormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  vatNumber: string;
  address?: string;
  message: string;
  privacyPolicy: boolean;
  termsAndConditions: boolean;
};

export default function QuoteList() {
  const { quoteItems, isQuoteOpen, closeQuote, removeFromQuote, updateQuantity, updateNotes, clearQuote } = useQuote();
  const { data: session } = useSession();
  const [showContactForm, setShowContactForm] = useState(false);
  const [useLoginInfo, setUseLoginInfo] = useState(true);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ success: boolean; message: string } | null>(null);
  
  // Phone verification
  const [phoneVerifySending, setPhoneVerifySending] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [phoneCodeInput, setPhoneCodeInput] = useState('');
  const [firebaseIdToken, setFirebaseIdToken] = useState<string | null>(null);
  const confirmationRef = useRef<ConfirmationResult | null>(null);
  
  // Address autocomplete
  const [addressQuery, setAddressQuery] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState<Array<{ description: string; place_id: string }>>([]);
  const [addressValidated, setAddressValidated] = useState<string | null>(null);
  const [placesReady, setPlacesReady] = useState(false);
  const [placesSessionToken, setPlacesSessionToken] = useState<any>(null);
  
  // VAT field visibility
  const [showVatField, setShowVatField] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<QuoteFormData>();

  if (!isQuoteOpen) return null;

  // Show VAT field when company is filled
  const companyValue = watch('company');
  useEffect(() => {
    setShowVatField(!!companyValue && companyValue.trim().length >= 1);
  }, [companyValue]);

  // Load Google Maps Places
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!key || typeof window === 'undefined') return;
    if ((window as any).google?.maps?.places) {
      setPlacesReady(true);
      setPlacesSessionToken(new (window as any).google.maps.places.AutocompleteSessionToken());
      return;
    }
    const scriptId = 'gmaps-places';
    if (document.getElementById(scriptId)) return;
    const s = document.createElement('script');
    s.id = scriptId;
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places&v=weekly`;
    s.async = true;
    s.onload = () => {
      setPlacesReady(true);
      setPlacesSessionToken(new (window as any).google.maps.places.AutocompleteSessionToken());
    };
    document.head.appendChild(s);
  }, []);

  // Address suggestions
  useEffect(() => {
    if (!placesReady || !addressQuery) {
      setAddressSuggestions([]);
      setAddressValidated(null);
      return;
    }
    try {
      const svc = new (window as any).google.maps.places.AutocompleteService();
      svc.getPlacePredictions(
        { 
          input: addressQuery, 
          sessionToken: placesSessionToken, 
          types: ['address'], 
          componentRestrictions: { country: ['be', 'nl', 'fr'] } 
        },
        (preds: any[]) => {
          const list = Array.isArray(preds) ? preds.map(p => ({ description: p.description, place_id: p.place_id })) : [];
          setAddressSuggestions(list);
        }
      );
    } catch {}
  }, [addressQuery, placesReady, placesSessionToken]);

  const handleSelectAddress = async (p: { description: string; place_id: string }) => {
    try {
      const map = document.createElement('div');
      const g = (window as any).google;
      const svc = new g.maps.places.PlacesService(map);
      await new Promise<void>((resolve) => {
        svc.getDetails(
          { placeId: p.place_id, sessionToken: placesSessionToken, fields: ['formatted_address'] }, 
          (res: any, status: any) => {
            if (status === g.maps.places.PlacesServiceStatus.OK && res) {
              setAddressValidated(res.formatted_address);
              setAddressQuery(res.formatted_address);
              setAddressSuggestions([]);
            }
            resolve();
          }
        );
      });
    } catch {}
  };

  const ensureFirebaseRecaptcha = () => {
    const auth = getFirebaseAuth();
    if (!(window as any)._recaptchaVerifier) {
      (window as any)._recaptchaVerifier = new RecaptchaVerifier(auth, 'firebase-recaptcha-container-quote', { size: 'invisible' });
    }
    return (window as any)._recaptchaVerifier as RecaptchaVerifier;
  };

  const sendPhoneCode = async () => {
    try {
      const phoneVal = (document.getElementById('quote-phone') as HTMLInputElement | null)?.value || '';
      if (!phoneVal) {
        setSubmitStatus({ success: false, message: 'Please enter phone number first' });
        return;
      }
      setPhoneVerifySending(true);
      setSubmitStatus(null);
      const verifier = ensureFirebaseRecaptcha();
      const auth = getFirebaseAuth();
      const result = await signInWithPhoneNumber(auth, phoneVal, verifier);
      confirmationRef.current = result;
      setSubmitStatus({ success: true, message: 'Verification code sent!' });
    } catch (e) {
      setSubmitStatus({ success: false, message: 'Failed to send code. Try again.' });
    } finally {
      setPhoneVerifySending(false);
    }
  };

  const checkPhoneCode = async () => {
    try {
      if (!confirmationRef.current || !phoneCodeInput) {
        setSubmitStatus({ success: false, message: 'Please enter the code' });
        return;
      }
      const cred = await confirmationRef.current.confirm(phoneCodeInput);
      const tkn = await cred.user.getIdToken();
      setFirebaseIdToken(tkn);
      setPhoneVerified(true);
      setSubmitStatus({ success: true, message: '✓ Phone verified!' });
    } catch {
      setPhoneVerified(false);
      setFirebaseIdToken(null);
      setSubmitStatus({ success: false, message: 'Invalid code. Try again.' });
    }
  };

  const onSubmit: SubmitHandler<QuoteFormData> = async (data) => {
    setSending(true);
    setSubmitStatus(null);

    try {
      // Validate phone if provided
      if (data.phone && !phoneVerified) {
        setSubmitStatus({ success: false, message: 'Please verify your phone number first' });
        setSending(false);
        return;
      }

      // Validate address if provided
      if (addressQuery && !addressValidated) {
        setSubmitStatus({ success: false, message: 'Please select a valid address from suggestions' });
        setSending(false);
        return;
      }

      const emailData = {
        items: quoteItems,
        customer: useLoginInfo && session ? {
          name: session.user?.name || '',
          email: session.user?.email || '',
          phone: data.phone || '',
          company: data.company || '',
          vatNumber: data.vatNumber || '',
          address: addressValidated || '',
          message: data.message || ''
        } : {
          name: `${data.firstName} ${data.lastName}`,
          email: data.email,
          phone: data.phone || '',
          company: data.company || '',
          vatNumber: data.vatNumber || '',
          address: addressValidated || '',
          message: data.message
        },
        timestamp: new Date().toISOString(),
        firebaseIdToken: firebaseIdToken || undefined
      };

      const response = await fetch('/api/quote-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailData)
      });

      if (response.ok) {
        setSent(true);
        setSubmitStatus({ success: true, message: 'Quote request sent successfully!' });
        setTimeout(() => {
          clearQuote();
          closeQuote();
          setSent(false);
          setShowContactForm(false);
          reset();
        }, 3000);
      } else {
        throw new Error('Failed to send quote');
      }
    } catch (error) {
      setSubmitStatus({ success: false, message: 'Failed to send quote request. Please try again.' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          <h2 className="font-bold text-lg">Request Quote</h2>
          <span className="bg-white text-orange-600 px-2 py-0.5 rounded-full text-xs font-bold">
            {quoteItems.length}
          </span>
        </div>
        <button onClick={closeQuote} className="hover:bg-orange-700 p-1 rounded">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Status Message */}
      {submitStatus && (
        <div className={`px-4 py-3 ${submitStatus.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'} text-sm`}>
          {submitStatus.message}
        </div>
      )}

      {/* Items List */}
      {!showContactForm ? (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {quoteItems.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>No items in quote list</p>
              </div>
            ) : (
              quoteItems.map(item => (
                <div key={item.sku} className="border rounded-lg p-3 space-y-2">
                  <div className="flex gap-3">
                    {item.imageUrl && (
                      <img src={item.imageUrl} alt={item.name} className="w-16 h-16 object-contain" />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">{item.name}</h3>
                      <p className="text-xs text-gray-500">{item.sku}</p>
                    </div>
                    <button
                      onClick={() => removeFromQuote(item.sku)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-600">Qty:</label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.sku, parseInt(e.target.value) || 1)}
                      className="w-16 px-2 py-1 border rounded text-sm"
                    />
                  </div>
                  
                  <textarea
                    placeholder="Add notes..."
                    value={item.notes}
                    onChange={(e) => updateNotes(item.sku, e.target.value)}
                    className="w-full px-2 py-1 border rounded text-xs resize-none"
                    rows={2}
                  />
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {quoteItems.length > 0 && (
            <div className="border-t p-4 space-y-2">
              <button
                onClick={() => setShowContactForm(true)}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Send Quote Request
              </button>
              <button
                onClick={clearQuote}
                className="w-full text-gray-600 hover:text-gray-800 py-2 text-sm"
              >
                Clear All
              </button>
            </div>
          )}
        </>
      ) : (
        /* Contact Form */
        <div className="flex-1 overflow-y-auto p-4">
          {sent ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiCheck className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Quote Request Sent!</h3>
              <p className="text-gray-600">We'll get back to you soon.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {session && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useLoginInfo}
                      onChange={(e) => setUseLoginInfo(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm">Use my account info ({session.user?.email})</span>
                  </label>
                </div>
              )}

              {(!session || !useLoginInfo) && (
                <>
                  {/* First Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <FiUser className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        {...register('firstName', { 
                          required: 'First name is required',
                          maxLength: { value: 50, message: 'Max 50 characters' }
                        })}
                        className="w-full pl-10 pr-3 py-2 border rounded-lg text-sm"
                        placeholder="John"
                      />
                    </div>
                    {errors.firstName && <p className="mt-1 text-xs text-red-600">{errors.firstName.message}</p>}
                  </div>

                  {/* Last Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('lastName', { 
                        required: 'Last name is required',
                        maxLength: { value: 50, message: 'Max 50 characters' }
                      })}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                      placeholder="Doe"
                    />
                    {errors.lastName && <p className="mt-1 text-xs text-red-600">{errors.lastName.message}</p>}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <FiMail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <input
                        type="email"
                        {...register('email', {
                          required: 'Email is required',
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: 'Invalid email address'
                          }
                        })}
                        className="w-full pl-10 pr-3 py-2 border rounded-lg text-sm"
                        placeholder="john.doe@example.com"
                      />
                    </div>
                    {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
                  </div>
                </>
              )}

              {/* Phone with Verification */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <FiPhone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="tel"
                    id="quote-phone"
                    {...register('phone', {
                      pattern: {
                        value: /(\+32|0)[1-9](\s?\d{2}){3,4}$/,
                        message: 'Invalid Belgian phone number'
                      }
                    })}
                    className="w-full pl-10 pr-3 py-2 border rounded-lg text-sm"
                    placeholder="+32 xxx xx xx xx"
                  />
                </div>
                {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>}
                
                <div className="mt-2 flex gap-2">
                  <button 
                    type="button" 
                    onClick={sendPhoneCode} 
                    disabled={phoneVerifySending}
                    className="px-3 py-1.5 rounded bg-blue-600 text-white text-xs disabled:opacity-50"
                  >
                    {phoneVerifySending ? 'Sending...' : 'Send Code'}
                  </button>
                  <input 
                    type="text" 
                    value={phoneCodeInput} 
                    onChange={(e) => setPhoneCodeInput(e.target.value)} 
                    maxLength={6}
                    className="flex-1 border rounded px-2 py-1.5 text-xs" 
                    placeholder="Code" 
                  />
                  <button 
                    type="button" 
                    onClick={checkPhoneCode}
                    className="px-3 py-1.5 rounded bg-emerald-600 text-white text-xs"
                  >
                    Verify
                  </button>
                  {phoneVerified && <FiCheck className="text-emerald-600 w-5 h-5" />}
                </div>
              </div>

              {/* Company */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company
                </label>
                <div className="relative">
                  <FiBriefcase className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    {...register('company', { maxLength: { value: 100, message: 'Max 100 characters' } })}
                    className="w-full pl-10 pr-3 py-2 border rounded-lg text-sm"
                    placeholder="Company name"
                  />
                </div>
              </div>

              {/* VAT Number */}
              {showVatField && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    VAT Number
                  </label>
                  <input
                    type="text"
                    {...register('vatNumber', { maxLength: { value: 20, message: 'Max 20 characters' } })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    placeholder="BE0123456789"
                  />
                </div>
              )}

              {/* Address with Autocomplete */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <div className="relative">
                  <FiMapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={addressQuery}
                    onChange={(e) => { setAddressQuery(e.target.value); setAddressValidated(null); }}
                    autoComplete="off"
                    className="w-full pl-10 pr-3 py-2 border rounded-lg text-sm"
                    placeholder="Start typing address..."
                  />
                  {addressSuggestions.length > 0 && (
                    <ul className="absolute z-20 mt-1 w-full bg-white border rounded-md shadow-lg max-h-40 overflow-auto">
                      {addressSuggestions.map((sug) => (
                        <li 
                          key={sug.place_id} 
                          className="px-3 py-2 text-xs hover:bg-gray-100 cursor-pointer" 
                          onClick={() => handleSelectAddress(sug)}
                        >
                          {sug.description}
                        </li>
                      ))}
                    </ul>
                  )}
                  {addressValidated && (
                    <p className="mt-1 text-xs text-emerald-600">✓ {addressValidated}</p>
                  )}
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  {...register('message', {
                    required: 'Message is required',
                    minLength: { value: 10, message: 'Minimum 10 characters' }
                  })}
                  className="w-full px-3 py-2 border rounded-lg text-sm resize-none"
                  rows={3}
                  placeholder="Tell us about your quote request..."
                />
                {errors.message && <p className="mt-1 text-xs text-red-600">{errors.message.message}</p>}
              </div>

              {/* Privacy Policy */}
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="quote-privacy"
                  {...register('privacyPolicy', { required: 'You must accept the privacy policy' })}
                  className="mt-1"
                />
                <label htmlFor="quote-privacy" className="text-xs text-gray-700">
                  I accept the <a href="/privacy-policy" target="_blank" className="text-blue-600 hover:underline">Privacy Policy</a> <span className="text-red-500">*</span>
                </label>
              </div>
              {errors.privacyPolicy && <p className="text-xs text-red-600">{errors.privacyPolicy.message}</p>}

              {/* Terms */}
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="quote-terms"
                  {...register('termsAndConditions', { required: 'You must accept the terms' })}
                  className="mt-1"
                />
                <label htmlFor="quote-terms" className="text-xs text-gray-700">
                  I accept the <a href="/terms" target="_blank" className="text-blue-600 hover:underline">Terms & Conditions</a> <span className="text-red-500">*</span>
                </label>
              </div>
              {errors.termsAndConditions && <p className="text-xs text-red-600">{errors.termsAndConditions.message}</p>}

              {/* Submit Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowContactForm(false)}
                  className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50 text-sm"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg font-semibold disabled:opacity-50 text-sm"
                >
                  {sending ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Firebase reCAPTCHA container */}
      <div id="firebase-recaptcha-container-quote"></div>
    </div>
  );
}
