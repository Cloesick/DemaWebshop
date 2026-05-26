'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FiArrowLeft, FiCheckCircle } from 'react-icons/fi';

type FormData = {
  email: string;
  firstName: string;
  lastName: string;
  address: string;
  apartment: string;
  city: string;
  postalCode: string;
  country: string;
  phone: string;
  saveInfo: boolean;
  paymentMethod: 'credit-card' | 'bank-transfer' | 'on-delivery';
  cardNumber: string;
  cardExpiry: string;
  cardCvc: string;
  cardName: string;
  terms: boolean;
};

export default function CheckoutPage() {
  const [step, setStep] = useState<number>(1);
  const [formData, setFormData] = useState<FormData>({
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    apartment: '',
    city: '',
    postalCode: '',
    country: 'Belgium',
    phone: '',
    saveInfo: true,
    paymentMethod: 'credit-card',
    cardNumber: '',
    cardExpiry: '',
    cardCvc: '',
    cardName: '',
    terms: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Process the order here
    setStep(3); // Move to success step
  };

  // Sample cart data
  const cartItems = [
    { id: '1', name: 'Sample Product', price: 99.99, quantity: 1 },
  ];
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = 0;
  const tax = subtotal * 0.21;
  const total = subtotal + shipping + tax;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-2xl mx-auto lg:max-w-none">
          {/* Progress Steps */}
          <nav aria-label="Progress" className="mb-12">
            <ol className="flex items-center">
              <li className={`relative pr-8 sm:pr-20 ${step >= 1 ? 'text-primary' : 'text-gray-500'}`}>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className={`h-0.5 w-full ${step >= 2 ? 'bg-primary' : 'bg-gray-200'}`}></div>
                </div>
                <div className={`relative flex items-center justify-center w-8 h-8 rounded-full ${step >= 1 ? 'bg-primary text-white' : 'bg-gray-100'}`}>
                  {step > 1 ? <FiCheckCircle className="w-5 h-5" /> : '1'}
                </div>
                <span className="mt-2 block text-sm font-medium">Information</span>
              </li>
              
              <li className={`relative pr-8 sm:pr-20 ${step >= 2 ? 'text-primary' : 'text-gray-500'}`}>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className={`h-0.5 w-full ${step >= 3 ? 'bg-primary' : 'bg-gray-200'}`}></div>
                </div>
                <div className={`relative flex items-center justify-center w-8 h-8 rounded-full ${step >= 2 ? 'bg-primary text-white' : 'bg-gray-100'}`}>
                  {step > 2 ? <FiCheckCircle className="w-5 h-5" /> : '2'}
                </div>
                <span className="mt-2 block text-sm font-medium">Payment</span>
              </li>
              
              <li className={`relative ${step >= 3 ? 'text-primary' : 'text-gray-500'}`}>
                <div className="relative flex items-center justify-center w-8 h-8 rounded-full ${step >= 3 ? 'bg-primary text-white' : 'bg-gray-100'}">
                  3
                </div>
                <span className="mt-2 block text-sm font-medium">Confirmation</span>
              </li>
            </ol>
          </nav>

          {step === 1 && (
            <form onSubmit={(e) => { e.preventDefault(); setStep(2); }} className="lg:grid lg:grid-cols-2 lg:gap-x-12">
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-6">Contact Information</h2>
                <div className="mb-4">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  />
                </div>

                <h2 className="text-lg font-medium text-gray-900 mt-8 mb-6">Shipping Information</h2>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">First name</label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      required
                      value={formData.firstName}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Last name</label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      required
                      value={formData.lastName}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    required
                    value={formData.address}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="apartment" className="block text-sm font-medium text-gray-700">Apartment, suite, etc. (optional)</label>
                  <input
                    type="text"
                    id="apartment"
                    name="apartment"
                    value={formData.apartment}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700">City</label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      required
                      value={formData.city}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">Postal code</label>
                    <input
                      type="text"
                      id="postalCode"
                      name="postalCode"
                      required
                      value={formData.postalCode}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700">Country</label>
                  <select
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  >
                    <option>Belgium</option>
                    <option>Netherlands</option>
                    <option>Germany</option>
                    <option>France</option>
                    <option>Luxembourg</option>
                  </select>
                </div>

                <div className="mb-6">
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  />
                </div>

                <div className="flex items-center mb-8">
                  <input
                    id="saveInfo"
                    name="saveInfo"
                    type="checkbox"
                    checked={formData.saveInfo}
                    onChange={handleChange}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <label htmlFor="saveInfo" className="ml-2 block text-sm text-gray-700">
                    Save this information for next time
                  </label>
                </div>

                <div className="flex justify-between">
                  <Link
                    href="/cart"
                    className="flex items-center text-sm font-medium text-primary hover:text-primary-dark"
                  >
                    <FiArrowLeft className="mr-1" /> Back to cart
                  </Link>
                  <button
                    type="submit"
                    className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    Continue to Payment
                  </button>
                </div>
              </div>

              {/* Order Summary */}
              <div className="mt-10 lg:mt-0">
                <h2 className="text-lg font-medium text-gray-900 mb-6">Order Summary</h2>
                <div className="bg-white shadow rounded-lg">
                  <ul role="list" className="divide-y divide-gray-200 p-6">
                    {cartItems.map((item) => (
                      <li key={item.id} className="flex py-4">
                        <div className="flex-shrink-0 w-20 h-20 border border-gray-200 rounded-md overflow-hidden">
                          <img
                            src="/assets/front/images/placeholder-product.jpg"
                            alt={item.name}
                            className="w-full h-full object-center object-cover"
                          />
                        </div>
                        <div className="ml-4 flex-1 flex flex-col">
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">
                              {item.name}
                            </h4>
                            <p className="mt-1 text-sm text-gray-500">Qty {item.quantity}</p>
                          </div>
                          <p className="mt-2 text-sm font-medium text-gray-900">
                            €{(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className="border-t border-gray-200 p-6">
                    <div className="flex justify-between text-base font-medium text-gray-900 mb-4">
                      <p>Subtotal</p>
                      <p>€{subtotal.toFixed(2)}</p>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <p>Shipping</p>
                      <p>{shipping === 0 ? 'Free' : `€${shipping.toFixed(2)}`}</p>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600 mb-4">
                      <p>Tax (21%)</p>
                      <p>€{tax.toFixed(2)}</p>
                    </div>
                    <div className="border-t border-gray-200 pt-4 flex justify-between text-base font-medium text-gray-900">
                      <p>Total</p>
                      <p>€{total.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit} className="lg:grid lg:grid-cols-2 lg:gap-x-12">
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-6">Payment Method</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      id="credit-card"
                      name="paymentMethod"
                      type="radio"
                      value="credit-card"
                      checked={formData.paymentMethod === 'credit-card'}
                      onChange={handleChange}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                    />
                    <label htmlFor="credit-card" className="ml-3 block text-sm font-medium text-gray-700">
                      Credit Card
                    </label>
                  </div>

                  {formData.paymentMethod === 'credit-card' && (
                    <div className="mt-4 space-y-4 pl-6">
                      <div>
                            <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700">
                              Card number
                            </label>
                            <input
                              type="text"
                              id="cardNumber"
                              name="cardNumber"
                              required
                              value={formData.cardNumber}
                              onChange={handleChange}
                              placeholder="1234 1234 1234 1234"
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label htmlFor="cardExpiry" className="block text-sm font-medium text-gray-700">
                                Expiry date
                              </label>
                              <input
                                type="text"
                                id="cardExpiry"
                                name="cardExpiry"
                                required
                                value={formData.cardExpiry}
                                onChange={handleChange}
                                placeholder="MM/YY"
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                              />
                            </div>
                            <div>
                              <label htmlFor="cardCvc" className="block text-sm font-medium text-gray-700">
                                CVC
                              </label>
                              <input
                                type="text"
                                id="cardCvc"
                                name="cardCvc"
                                required
                                value={formData.cardCvc}
                                onChange={handleChange}
                                placeholder="CVC"
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                              />
                            </div>
                          </div>
                          <div>
                            <label htmlFor="cardName" className="block text-sm font-medium text-gray-700">
                              Name on card
                            </label>
                            <input
                              type="text"
                              id="cardName"
                              name="cardName"
                              required
                              value={formData.cardName}
                              onChange={handleChange}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                            />
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center">
                        <input
                          id="bank-transfer"
                          name="paymentMethod"
                          type="radio"
                          value="bank-transfer"
                          checked={formData.paymentMethod === 'bank-transfer'}
                          onChange={handleChange}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                        />
                        <label htmlFor="bank-transfer" className="ml-3 block text-sm font-medium text-gray-700">
                          Bank Transfer
                        </label>
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          id="on-delivery"
                          name="paymentMethod"
                          type="radio"
                          value="on-delivery"
                          checked={formData.paymentMethod === 'on-delivery'}
                          onChange={handleChange}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                        />
                        <label htmlFor="on-delivery" className="ml-3 block text-sm font-medium text-gray-700">
                          Pay on Delivery
                        </label>
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-200">
                      <div className="flex items-center mb-6">
                        <input
                          id="terms"
                          name="terms"
                          type="checkbox"
                          required
                          checked={formData.terms}
                          onChange={handleChange}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
                          I agree to the <a href="/terms" className="text-primary hover:text-primary-dark">Terms of Service</a> and <a href="/privacy" className="text-primary hover:text-primary-dark">Privacy Policy</a>
                        </label>
                      </div>

                      <div className="flex justify-between">
                        <button
                          type="button"
                          onClick={() => setStep(1)}
                          className="flex items-center text-sm font-medium text-primary hover:text-primary-dark"
                        >
                          <FiArrowLeft className="mr-1" /> Back to Information
                        </button>
                        <button
                          type="submit"
                          className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                        >
                          Complete Order
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div className="mt-10 lg:mt-0">
                    <h2 className="text-lg font-medium text-gray-900 mb-6">Order Summary</h2>
                    <div className="bg-white shadow rounded-lg">
                      <ul role="list" className="divide-y divide-gray-200 p-6">
                        {cartItems.map((item) => (
                          <li key={item.id} className="flex py-4">
                            <div className="flex-shrink-0 w-20 h-20 border border-gray-200 rounded-md overflow-hidden">
                              <img
                                src="/assets/front/images/placeholder-product.jpg"
                                alt={item.name}
                                className="w-full h-full object-center object-cover"
                              />
                            </div>
                            <div className="ml-4 flex-1 flex flex-col">
                              <div>
                                <h4 className="text-sm font-medium text-gray-900">
                                  {item.name}
                                </h4>
                                <p className="mt-1 text-sm text-gray-500">Qty {item.quantity}</p>
                              </div>
                              <p className="mt-2 text-sm font-medium text-gray-900">
                                €{(item.price * item.quantity).toFixed(2)}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                      <div className="border-t border-gray-200 p-6">
                        <div className="flex justify-between text-base font-medium text-gray-900 mb-4">
                          <p>Subtotal</p>
                          <p>€{subtotal.toFixed(2)}</p>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600 mb-2">
                          <p>Shipping</p>
                          <p>{shipping === 0 ? 'Free' : `€${shipping.toFixed(2)}`}</p>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600 mb-4">
                          <p>Tax (21%)</p>
                          <p>€{tax.toFixed(2)}</p>
                        </div>
                        <div className="border-t border-gray-200 pt-4 flex justify-between text-base font-medium text-gray-900">
                          <p>Total</p>
                          <p>€{total.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </form>
              )}

              {step === 3 && (
                <div className="text-center py-12">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                    <FiCheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <h2 className="mt-4 text-2xl font-extrabold text-gray-900">Order Confirmed!</h2>
                  <p className="mt-2 text-gray-600">
                    Thank you for your purchase. We've sent you an email with your order details.
                  </p>
                  <div className="mt-8">
                    <Link
                      href="/products"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    >
                      Continue Shopping
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }
