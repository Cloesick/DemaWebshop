'use client';

import { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { FiSend, FiUser, FiMail, FiPhone, FiBriefcase, FiCalendar, FiDollarSign, FiAlertCircle, FiMapPin } from 'react-icons/fi';

type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  vatNumber: string;
  clientType: 'retail' | 'wholesale' | 'business';
  inquiryType: string;
  message: string;
  budget: string;
  timeline: string;
  heardAbout: string;
  privacyPolicy: boolean;
  termsAndConditions: boolean;
};

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showVatField, setShowVatField] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ success: boolean; message: string } | null>(null);
  
  // Initialize with empty string to prevent hydration mismatch
  const [currentTime, setCurrentTime] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<FormData>();

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      // Replace with your actual API endpoint
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setSubmitStatus({
          success: true,
          message: 'Thank you for your message! We\'ll get back to you soon.'
        });
        reset();
      } else {
        throw new Error('Failed to submit form');
      }
    } catch (error) {
      setSubmitStatus({
        success: false,
        message: 'There was an error submitting your form. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update time on client side only
  useEffect(() => {
    // Set initial time
    const updateTime = () => {
      const brusselsTime = new Date().toLocaleString('en-US', { 
        timeZone: 'Europe/Brussels',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      setCurrentTime(brusselsTime);
    };
    
    // Update immediately
    updateTime();
    
    // Then update every minute
    const timer = setInterval(updateTime, 60000);
    
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Contact DEMA
          </h1>
          <p className="mt-3 text-xl text-gray-500">
            We're here to help and answer any questions you might have.
            <br />
            <span className="text-sm text-gray-400">
              Current time in Brussels: {currentTime}
            </span>
          </p>
          
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3 text-center">
            <div className="bg-white p-4 rounded-lg shadow">
              <FiPhone className="mx-auto h-6 w-6 text-blue-600" />
              <p className="mt-2 text-sm font-medium text-gray-900">+32 (0)51 20 51 41</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <FiMail className="mx-auto h-6 w-6 text-blue-600" />
              <a href="mailto:sales@demashop.be" className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-800">
                sales@demashop.be
              </a>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <FiMapPin className="mx-auto h-6 w-6 text-blue-600" />
              <a 
                href="https://www.google.com/maps/place/Ovenstraat+11+8800+Roeselare" 
                target="_blank" 
                rel="noopener noreferrer"
                className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                Ovenstraat 11, 8800 Roeselare
              </a>
            </div>
          </div>
        </div>

        {submitStatus && (
          <div
            className={`mb-8 p-4 rounded-md ${
              submitStatus.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}
          >
            <div className="flex">
              <div className="flex-shrink-0">
                {submitStatus.success ? (
                  <FiSend className="h-5 w-5 text-green-400" />
                ) : (
                  <FiAlertCircle className="h-5 w-5 text-red-400" />
                )}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{submitStatus.message}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <p className="mb-4 text-sm text-gray-500">
              Fields marked with <span className="text-red-500">*</span> are required.
            </p>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                {/* First Name */}
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiUser className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="firstName"
                      {...register('firstName', { required: 'First name is required' })}
                      className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-3 border"
                      placeholder="John"
                    />
                  </div>
                  {errors.firstName && (
                    <p className="mt-2 text-sm text-red-600">{errors.firstName.message}</p>
                  )}
                </div>

                {/* Last Name */}
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiUser className="h-5 w-5 text-gray-400 opacity-0" />
                    </div>
                    <input
                      type="text"
                      id="lastName"
                      {...register('lastName', { required: 'Last name is required' })}
                      className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-3 border"
                      placeholder="Doe"
                    />
                  </div>
                  {errors.lastName && (
                    <p className="mt-2 text-sm text-red-600">{errors.lastName.message}</p>
                  )}
                </div>

                {/* Email */}
                <div className="sm:col-span-2">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiMail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      id="email"
                      {...register('email', {
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address',
                        },
                      })}
                      className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-3 border"
                      placeholder="you@example.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiPhone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      id="phone"
                      {...register('phone', {
                        pattern: {
                          value: /^(\+32|0)[1-9](\s?\d{2}){3,4}$/,
                          message: 'Please enter a valid Belgian phone number (e.g., +32 4xx 12 34 56 or 04xx 12 34 56)'
                        }
                      })}
                      className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-3 border"
                      placeholder="+32 4xx 12 34 56"
                    />
                  </div>
                  {errors.phone && (
                    <p className="mt-2 text-sm text-red-600">{errors.phone.message}</p>
                  )}
                </div>

                {/* Company */}
                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                    Company Name
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiBriefcase className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="company"
                      className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                      placeholder="Your company name (if applicable)"
                      spellCheck={false}
                      {...register('company')}
                    />
                  </div>
                </div>

                {/* Message */}
                <div className="sm:col-span-2">
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <textarea
                      id="message"
                      rows={4}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                      placeholder="Tell us about your project or inquiry..."
                      spellCheck={false}
                      {...register('message', {
                        required: 'Please enter your message',
                        minLength: {
                          value: 10,
                          message: 'Message must be at least 10 characters long',
                        },
                      })}
                    />
                  </div>
                  {errors.message && (
                    <p className="mt-2 text-sm text-red-600">{errors.message.message}</p>
                  )}
                </div>

                {/* Privacy Policy & Terms */}
                <div className="sm:col-span-2 space-y-4">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="privacyPolicy"
                        type="checkbox"
                        {...register('privacyPolicy', {
                          required: 'You must accept the privacy policy',
                        })}
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="privacyPolicy" className="font-medium text-gray-700">
                        I agree to the{' '}
                        <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-500">
                          Privacy Policy
                        </a>
                        . <span className="text-red-500">*</span>
                      </label>
                      {errors.privacyPolicy && (
                        <p className="mt-1 text-sm text-red-600">{errors.privacyPolicy.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="termsAndConditions"
                        type="checkbox"
                        {...register('termsAndConditions', {
                          required: 'You must accept the terms and conditions',
                        })}
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="termsAndConditions" className="font-medium text-gray-700">
                        I agree to the{' '}
                        <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-500">
                          Terms and Conditions
                        </a>
                        . <span className="text-red-500">*</span>
                      </label>
                      {errors.termsAndConditions && (
                        <p className="mt-1 text-sm text-red-600">{errors.termsAndConditions.message}</p>
                      )}
                    </div>
                  </div>

                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting ? (
                    'Sending...'
                  ) : (
                    <>
                      <FiSend className="-ml-1 mr-2 h-5 w-5" />
                      Send Message
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="p-6 bg-white rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                <FiMail className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Email Us</h3>
                <p className="mt-1 text-sm text-gray-500">We'll respond within 24 hours</p>
                <p className="mt-1 text-sm font-medium text-blue-600">sales@demashop.com</p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                <FiPhone className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Call Us</h3>
                <p className="mt-1 text-sm text-gray-500">Mon-Fri from 8am to 5pm</p>
                <p className="mt-1 text-sm font-medium text-blue-600">+1 (555) 123-4567</p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                <FiBriefcase className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Visit Us</h3>
                <p className="mt-1 text-sm text-gray-500">123 Industrial Way</p>
                <p className="text-sm text-gray-500">San Francisco, CA 94107</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
