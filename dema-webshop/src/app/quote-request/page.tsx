'use client';

import { useState } from 'react';
import { useQuote } from '@/contexts/QuoteContext';
import { FileText, Send, CheckCircle } from 'lucide-react';

export default function QuoteRequestPage() {
  const { quoteItems, clearQuote } = useQuote();
  const [formData, setFormData] = useState({
    // Customer type
    customerType: 'private',
    existingCustomer: 'no',
    
    // Personal info
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    
    // Business info (if applicable)
    companyName: '',
    vatNumber: '',
    businessActivity: '',
    
    // Address
    address: '',
    postalCode: '',
    city: '',
    
    // Comments
    comments: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/quote/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formData,
          products: quoteItems,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate quote');
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Not JSON response');
      }
      const result = await response.json();
      
      setIsSuccess(true);
      clearQuote();
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setFormData({
          customerType: 'private',
          existingCustomer: 'no',
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          companyName: '',
          vatNumber: '',
          businessActivity: '',
          address: '',
          postalCode: '',
          city: '',
          comments: '',
        });
        setIsSuccess(false);
      }, 5000);
      
    } catch (err) {
      setError('Failed to submit quote request. Please try again.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Quote Request Sent!</h2>
          <p className="text-gray-600 mb-4">
            Your quote request has been successfully submitted. We'll send you a detailed quote via email shortly.
          </p>
          <p className="text-sm text-gray-500">
            You will receive a copy at: <strong>{formData.email}</strong>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#00ADEF] to-blue-500 text-white rounded-lg p-8 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <FileText className="h-12 w-12" />
            <div>
              <h1 className="text-3xl font-bold">Request a Quote</h1>
              <p className="text-blue-100">Get a customized quote for your selected products</p>
            </div>
          </div>
          
          {quoteItems.length > 0 && (
            <div className="bg-white/10 rounded-lg p-4 mt-4">
              <h3 className="font-semibold mb-2">Products in your quote ({quoteItems.length}):</h3>
              <div className="space-y-1">
                {quoteItems.map((item, idx) => (
                  <div key={idx} className="text-sm">
                    • {item.name} - Quantity: {item.quantity}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8">
          {/* Customer Type */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">Customer Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Type *
                </label>
                <select
                  name="customerType"
                  value={formData.customerType}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00ADEF] focus:border-transparent"
                >
                  <option value="private">Private Customer</option>
                  <option value="business">Business Customer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Existing Customer?
                </label>
                <select
                  name="existingCustomer"
                  value={formData.existingCustomer}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00ADEF] focus:border-transparent"
                >
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>
            </div>

            {/* Business Info */}
            {formData.customerType === 'business' && (
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <h3 className="font-semibold text-gray-900 mb-4">Business Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      required={formData.customerType === 'business'}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00ADEF] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      VAT Number
                    </label>
                    <input
                      type="text"
                      name="vatNumber"
                      value={formData.vatNumber}
                      onChange={handleInputChange}
                      placeholder="BE 0123.456.789"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00ADEF] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business Activity
                    </label>
                    <input
                      type="text"
                      name="businessActivity"
                      value={formData.businessActivity}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00ADEF] focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Personal Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00ADEF] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00ADEF] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00ADEF] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00ADEF] focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">Address</h2>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Street Address *
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00ADEF] focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Postal Code *
                  </label>
                  <input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00ADEF] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00ADEF] focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Comments */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">Additional Information</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comments / Special Requests
              </label>
              <textarea
                name="comments"
                value={formData.comments}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00ADEF] focus:border-transparent"
                placeholder="Any additional information or special requests..."
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || quoteItems.length === 0}
              className="px-6 py-3 bg-[#00ADEF] text-white rounded-lg hover:bg-blue-600 transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Generating Quote...
                </>
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  Request Quote
                </>
              )}
            </button>
          </div>

          <p className="text-sm text-gray-500 mt-4 text-center">
            By submitting this form, you agree to receive a quote via email from DEMA-SHOP
          </p>
        </form>
      </div>
    </div>
  );
}
