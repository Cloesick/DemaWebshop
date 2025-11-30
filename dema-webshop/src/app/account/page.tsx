'use client';

import { useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { FiUser, FiShoppingBag, FiSettings, FiLogOut, FiChevronRight, FiFileText } from 'react-icons/fi';
import Link from 'next/link';
import { useQuote } from '@/contexts/QuoteContext';
import ChangePasswordModal from '@/components/account/ChangePasswordModal';
import DeleteAccountModal from '@/components/account/DeleteAccountModal';

type Order = {
  id: string;
  date: string;
  status: 'Delivered' | 'Processing' | 'Shipped' | 'Cancelled';
  total: number;
  items: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
  }[];
};

type UserData = {
  name: string;
  email: string;
  phone: string;
  address: string;
  preferences: {
    newsletter: boolean;
    marketing: boolean;
    language: string;
    currency: string;
  };
  orders: Order[];
};

function SingleProductForm({ onSaved }: { onSaved: (msg: string) => void }) {
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [productCategory, setProductCategory] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<string>('');
  const [pdfSource, setPdfSource] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku.trim() || !name.trim() || !productCategory.trim()) {
      onSaved('Please fill required fields: SKU, Name, Category');
      return;
    }
    try {
      setSubmitting(true);
      const body: any = {
        sku: sku.trim(),
        name: name.trim(),
        product_category: productCategory.trim(),
        description,
      };
      const priceNum = parseFloat(price.replace(',', '.'));
      if (!Number.isNaN(priceNum)) body.price = priceNum;
      if (pdfSource) body.pdf_source = pdfSource.trim();
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed');
      onSaved('Product saved');
      setSku('');
      setName('');
      setProductCategory('');
      setDescription('');
      setPrice('');
      setPdfSource('');
    } catch (err: any) {
      onSaved(err.message || 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="flex gap-2">
        <input value={sku} onChange={(e)=>setSku(e.target.value)} placeholder="SKU*" className="flex-1 border rounded p-2" />
        <button
          type="button"
          disabled={!sku || loadingExisting}
          onClick={async () => {
            try {
              setLoadingExisting(true);
              const res = await fetch(`/api/products?sku=${encodeURIComponent(sku)}`);
              const data = await res.json();
              const found = Array.isArray(data?.products) ? data.products[0] : undefined;
              if (!found) {
                onSaved('No product found for this SKU');
              } else {
                setName(found.name || '');
                setProductCategory(found.product_category || '');
                setDescription(found.description || '');
                setPrice(typeof found.price === 'number' ? String(found.price) : (found.price || ''));
                setPdfSource(found.pdf_source || '');
                onSaved('Loaded existing product');
              }
            } catch (e: any) {
              onSaved(e.message || 'Failed to load product');
            } finally {
              setLoadingExisting(false);
            }
          }}
          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm"
        >
          {loadingExisting ? 'Loading...' : 'Load'}
        </button>
      </div>
      <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Name*" className="w-full border rounded p-2" />
      <input value={productCategory} onChange={(e)=>setProductCategory(e.target.value)} placeholder="Product Category*" className="w-full border rounded p-2" />
      <textarea value={description} onChange={(e)=>setDescription(e.target.value)} placeholder="Description" className="w-full border rounded p-2 h-24" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input value={price} onChange={(e)=>setPrice(e.target.value)} placeholder="Price (optional)" className="w-full border rounded p-2" />
        <input value={pdfSource} onChange={(e)=>setPdfSource(e.target.value)} placeholder="PDF Source URL/path (optional)" className="w-full border rounded p-2" />
      </div>
      <button type="submit" disabled={submitting} className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
        {submitting ? 'Saving...' : 'Confirm'}
      </button>
    </form>
  );
}

export default function AccountPage() {
  const { data: session, status } = useSession();
  const userRole = (session?.user as any)?.role as string | undefined;
  // Mock user data - in a real app, this would come from an API
  const [userData, setUserData] = useState<UserData>({
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+32 123 45 67 89',
    address: '123 Main St, Brussels, 1000, Belgium',
    preferences: {
      newsletter: true,
      marketing: false,
      language: 'English',
      currency: 'EUR',
    },
    orders: [
      {
        id: 'ORD-12345',
        date: '2023-10-15',
        status: 'Delivered',
        total: 249.99,
        items: [
          { id: '1', name: 'Professional Drill', price: 129.99, quantity: 1, image: '/placeholder-drill.jpg' },
          { id: '2', name: 'Screwdriver Set', price: 59.99, quantity: 2, image: '/placeholder-screwdriver.jpg' },
        ],
      },
      {
        id: 'ORD-12344',
        date: '2023-09-28',
        status: 'Shipped',
        total: 89.99,
        items: [
          { id: '3', name: 'Toolbox', price: 89.99, quantity: 1, image: '/placeholder-toolbox.jpg' },
        ],
      },
    ],
  });

  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'quotes' | 'settings' | 'admin'>('overview');
  const { quoteItems, removeFromQuote, clearQuote } = useQuote();

  const [newProductJson, setNewProductJson] = useState<string>('');
  const [bulkJson, setBulkJson] = useState<string>('');
  const [deleteSku, setDeleteSku] = useState<string>('');
  const [uploading, setUploading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [adminLogs, setAdminLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState<boolean>(false);
  
  // Modal states
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false);

  const handlePreferenceChange = (key: keyof UserData['preferences'], value: any) => {
    setUserData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: value,
      },
    }));
    try {
      if (key === 'marketing') {
        if (value) {
          localStorage.setItem('profile:marketing', 'true');
        } else {
          localStorage.setItem('profile:marketing', 'false');
        }
      }
    } catch (_) {}
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 px-6 py-8 text-white">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 p-3 rounded-full">
                <FiUser className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Welcome, {session?.user?.name || userData.name}</h1>
                <p className="text-blue-100">{session?.user?.email || userData.email}</p>
                {userRole && (
                  <span className="inline-block mt-2 text-xs uppercase tracking-wide bg-white/20 px-2 py-1 rounded">
                    Role: {userRole}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="md:flex">
            {/* Sidebar */}
            <div className="md:w-64 bg-gray-50 border-r border-gray-200">
              <nav className="p-4 space-y-1">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md ${
                    activeTab === 'overview' 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <FiUser className="mr-3 h-5 w-5" />
                  Account Overview
                </button>
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md ${
                    activeTab === 'orders' 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <FiShoppingBag className="mr-3 h-5 w-5" />
                  My Orders
                  {userData.orders.length > 0 && (
                    <span className="ml-auto bg-gray-200 text-gray-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                      {userData.orders.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('quotes')}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md ${
                    activeTab === 'quotes' 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <FiFileText className="mr-3 h-5 w-5" />
                  My Quotes
                  {quoteItems.length > 0 && (
                    <span className="ml-auto bg-gray-200 text-gray-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                      {quoteItems.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md ${
                    activeTab === 'settings' 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <FiSettings className="mr-3 h-5 w-5" />
                  Account Settings
                </button>
                {userRole === 'admin' && (
                  <button
                    onClick={() => setActiveTab('admin')}
                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md ${
                      activeTab === 'admin' 
                        ? 'bg-blue-50 text-blue-700' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Admin
                  </button>
                )}
                <div className="border-t border-gray-200 my-2"></div>
                {status !== 'authenticated' ? (
                  <button
                    onClick={() => signIn('google', { callbackUrl: '/account' })}
                    className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
                  >
                    <FiLogOut className="mr-3 h-5 w-5" />
                    Sign In
                  </button>
                ) : (
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
                  >
                    <FiLogOut className="mr-3 h-5 w-5" />
                    Sign Out
                  </button>
                )}
              </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-6">
              {activeTab === 'overview' && (
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-6">Account Overview</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
                      <div className="space-y-2">
                        <p className="text-gray-700">{userData.name}</p>
                        <p className="text-gray-600">{userData.email}</p>
                        <p className="text-gray-600">{userData.phone}</p>
                      </div>
                      <button className="mt-4 text-sm text-blue-600 hover:text-blue-800">
                        Edit Contact Information
                      </button>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Default Shipping Address</h3>
                      <p className="text-gray-700">{userData.address}</p>
                      <button className="mt-4 text-sm text-blue-600 hover:text-blue-800">
                        Manage Addresses
                      </button>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 md:col-span-2">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Orders</h3>
                      {userData.orders.slice(0, 2).map((order) => (
                        <div key={order.id} className="border-b border-gray-200 py-4 last:border-b-0 last:pb-0">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium text-gray-900">Order #{order.id}</p>
                              <p className="text-sm text-gray-500">Placed on {new Date(order.date).toLocaleDateString()}</p>
                              <p className="text-sm">
                                Status: <span className="font-medium">{order.status}</span>
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-gray-900">€{order.total.toFixed(2)}</p>
                              <Link href={`/account/orders/${order.id}`} className="text-sm text-blue-600 hover:text-blue-800">
                                View Order
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="mt-4">
                        <button 
                          onClick={() => setActiveTab('orders')}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          View All Orders <FiChevronRight className="inline h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'orders' && (
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-6">My Orders</h2>
                  <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                    {userData.orders.length > 0 ? (
                      <div className="divide-y divide-gray-200">
                        {userData.orders.map((order) => (
                          <div key={order.id} className="p-6 hover:bg-gray-50">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                              <div className="mb-4 sm:mb-0">
                                <p className="font-medium text-gray-900">Order #{order.id}</p>
                                <p className="text-sm text-gray-500">Placed on {new Date(order.date).toLocaleDateString()}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium text-gray-900">€{order.total.toFixed(2)}</p>
                                <p className={`text-sm ${
                                  order.status === 'Delivered' ? 'text-green-600' : 
                                  order.status === 'Cancelled' ? 'text-red-600' : 'text-yellow-600'
                                }`}>
                                  {order.status}
                                </p>
                              </div>
                            </div>
                            
                            <div className="mt-4 border-t border-gray-100 pt-4">
                              <h4 className="text-sm font-medium text-gray-900 mb-2">Items</h4>
                              <div className="space-y-4">
                                {order.items.map((item) => (
                                  <div key={item.id} className="flex">
                                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                                      <img
                                        src={item.image}
                                        alt={item.name}
                                        className="h-full w-full object-cover object-center"
                                      />
                                    </div>
                                    <div className="ml-4 flex-1">
                                      <div className="flex justify-between text-base font-medium text-gray-900">
                                        <h3>{item.name}</h3>
                                        <p className="ml-4">€{item.price.toFixed(2)}</p>
                                      </div>
                                      <p className="mt-1 text-sm text-gray-500">Qty: {item.quantity}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            <div className="mt-4 flex justify-end">
                              <Link 
                                href={`/account/orders/${order.id}`}
                                className="text-sm font-medium text-blue-600 hover:text-blue-800"
                              >
                                View Order Details <FiChevronRight className="inline h-4 w-4" />
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-12 text-center">
                        <FiShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No orders</h3>
                        <p className="mt-1 text-sm text-gray-500">You haven't placed any orders yet.</p>
                        <div className="mt-6">
                          <Link
                            href="/products"
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            Continue Shopping
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'quotes' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-medium text-gray-900">My Quotes</h2>
                    {quoteItems.length > 0 && (
                      <button
                        onClick={clearQuote}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        Clear All Quotes
                      </button>
                    )}
                  </div>
                  <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                    {quoteItems.length > 0 ? (
                      <div className="divide-y divide-gray-200">
                        {quoteItems.map((item) => (
                          <div key={item.sku} className="p-6">
                            <div className="flex items-start space-x-4">
                              {(item as any).image && (
                                <div className="flex-shrink-0 w-24 h-24 bg-gray-100 rounded-md overflow-hidden">
                                  <img
                                    src={(item as any).image}
                                    alt={item.name}
                                    className="w-full h-full object-contain"
                                  />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between">
                                  <div>
                                    <h3 className="text-base font-semibold text-gray-900">
                                      {item.name}
                                    </h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                      SKU: {item.sku}
                                    </p>
                                    {item.category && (
                                      <p className="mt-1 text-sm text-gray-500">
                                        Category: {item.category}
                                      </p>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <p className="text-lg font-medium text-gray-900">
                                      Quantity: {item.quantity}
                                    </p>
                                  </div>
                                </div>
                                
                                {(item as any).specifications && (item as any).specifications.length > 0 && (
                                  <div className="mt-4">
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">Specifications:</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                      {(item as any).specifications.slice(0, 4).map((spec: any, idx: number) => (
                                        <div key={idx} className="text-sm">
                                          <span className="text-gray-500">{spec.key}:</span>{' '}
                                          <span className="text-gray-900">{spec.value}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                <div className="mt-4 flex items-center space-x-4">
                                  <button
                                    onClick={() => removeFromQuote(item.sku)}
                                    className="text-sm text-red-600 hover:text-red-800 font-medium"
                                  >
                                    Remove
                                  </button>
                                  <Link
                                    href={`/catalog/${item.sku.toLowerCase()}`}
                                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                                  >
                                    View Product
                                  </Link>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}

                        <div className="bg-gray-50 px-6 py-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-sm text-gray-600">
                                Total Items: <span className="font-semibold text-gray-900">{quoteItems.reduce((sum, item) => sum + item.quantity, 0)}</span>
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                Unique Products: <span className="font-semibold text-gray-900">{quoteItems.length}</span>
                              </p>
                            </div>
                            <div className="flex space-x-3">
                              <Link
                                href="/contact?subject=quote"
                                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              >
                                Request Quote
                              </Link>
                              <button
                                onClick={() => {
                                  const quoteData = quoteItems.map(item => ({
                                    sku: item.sku,
                                    name: item.name,
                                    quantity: item.quantity,
                                    category: item.category,
                                  }));
                                  const blob = new Blob([JSON.stringify(quoteData, null, 2)], { type: 'application/json' });
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = `quote-${new Date().toISOString().split('T')[0]}.json`;
                                  a.click();
                                  URL.revokeObjectURL(url);
                                }}
                                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              >
                                Export Quote
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-12 text-center">
                        <FiFileText className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No quotes</h3>
                        <p className="mt-1 text-sm text-gray-500">You haven't added any products to your quote list yet.</p>
                        <div className="mt-6">
                          <Link
                            href="/products"
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            Browse Products
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'settings' && (
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-6">Account Settings</h2>
                  <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                    <div className="p-6">
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-base font-medium text-gray-900 mb-4">Email Preferences</h3>
                          <div className="space-y-4">
                            <div className="flex items-start">
                              <div className="flex items-center h-5">
                                <input
                                  id="newsletter"
                                  name="newsletter"
                                  type="checkbox"
                                  checked={userData.preferences.newsletter}
                                  onChange={(e) => handlePreferenceChange('newsletter', e.target.checked)}
                                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                                />
                              </div>
                              <div className="ml-3 text-sm">
                                <label htmlFor="newsletter" className="font-medium text-gray-700">
                                  Subscribe to newsletter
                                </label>
                                <p className="text-gray-500">Get the latest news and offers</p>
                              </div>
                            </div>
                            
                            <div className="flex items-start">
                              <div className="flex items-center h-5">
                                <input
                                  id="marketing"
                                  name="marketing"
                                  type="checkbox"
                                  checked={userData.preferences.marketing}
                                  onChange={(e) => handlePreferenceChange('marketing', e.target.checked)}
                                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                                />
                              </div>
                              <div className="ml-3 text-sm">
                                <label htmlFor="marketing" className="font-medium text-gray-700">
                                  Receive marketing communications
                                </label>
                                <p className="text-gray-500">Get personalized product recommendations and promotions</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-gray-200 pt-6">
                          <h3 className="text-base font-medium text-gray-900 mb-4">Account Preferences</h3>
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                              <label htmlFor="language" className="block text-sm font-medium text-gray-700">
                                Language
                              </label>
                              <select
                                id="language"
                                name="language"
                                value={userData.preferences.language}
                                onChange={(e) => handlePreferenceChange('language', e.target.value)}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                              >
                                <option>English</option>
                                <option>Nederlands</option>
                                <option>Français</option>
                                <option>Deutsch</option>
                              </select>
                            </div>
                            
                            <div>
                              <label htmlFor="currency" className="block text-sm font-medium text-gray-700">
                                Currency
                              </label>
                              <select
                                id="currency"
                                name="currency"
                                value={userData.preferences.currency}
                                onChange={(e) => handlePreferenceChange('currency', e.target.value)}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                              >
                                <option value="EUR">Euro (€)</option>
                                <option value="USD">US Dollar ($)</option>
                                <option value="GBP">British Pound (£)</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-gray-200 pt-6">
                          <h3 className="text-base font-medium text-gray-900 mb-4">Account Actions</h3>
                          <div className="space-y-4">
                            <button 
                              onClick={() => setIsChangePasswordModalOpen(true)}
                              className="w-full sm:w-auto inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              Change Password
                            </button>
                            <button 
                              onClick={() => setIsDeleteAccountModalOpen(true)}
                              className="ml-0 sm:ml-3 w-full sm:w-auto inline-flex justify-center py-2 px-4 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                              Delete Account
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'admin' && userRole === 'admin' && (
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-6">Admin</h2>
                  <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                    <div className="p-6 space-y-6">
                      {message && (
                        <div className="text-sm text-green-700">{message}</div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <h3 className="text-base font-medium text-gray-900">Add/Update Single Product</h3>
                          <SingleProductForm onSaved={(msg) => setMessage(msg)} />
                        </div>
                        <div className="space-y-3">
                          <h3 className="text-base font-medium text-gray-900">Bulk Add/Update (Array JSON)</h3>
                          <textarea
                            value={bulkJson}
                            onChange={(e) => setBulkJson(e.target.value)}
                            className="w-full border rounded p-2 h-40"
                            placeholder='[{"sku":"A"},{"sku":"B"}] or {"products":[...]}'
                          />
                          <button
                            onClick={async () => {
                              try {
                                setMessage('');
                                const res = await fetch('/api/products', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: bulkJson,
                                });
                                const data = await res.json();
                                if (!res.ok) throw new Error(data?.error || 'Failed');
                                setMessage('Bulk saved');
                                setBulkJson('');
                              } catch (e: any) {
                                setMessage(e.message || 'Error');
                              }
                            }}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            Confirm
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <h3 className="text-base font-medium text-gray-900">Delete Product by SKU</h3>
                          <input
                            value={deleteSku}
                            onChange={(e) => setDeleteSku(e.target.value)}
                            className="w-full border rounded p-2"
                            placeholder="SKU"
                          />
                          <button
                            onClick={async () => {
                              try {
                                setMessage('');
                                if (!deleteSku) throw new Error('SKU required');
                                const res = await fetch(`/api/products/${encodeURIComponent(deleteSku)}`, {
                                  method: 'DELETE',
                                });
                                const data = await res.json();
                                if (!res.ok) throw new Error(data?.error || 'Failed');
                                setMessage('Deleted');
                                setDeleteSku('');
                              } catch (e: any) {
                                setMessage(e.message || 'Error');
                              }
                            }}
                            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            Delete
                          </button>
                        </div>
                        <div className="space-y-3">
                          <h3 className="text-base font-medium text-gray-900">Upload PDF (goes to categories)</h3>
                          <form
                            onSubmit={async (e) => {
                              e.preventDefault();
                              try {
                                setUploading(true);
                                setMessage('');
                                const input = (e.currentTarget.elements.namedItem('file') as HTMLInputElement);
                                if (!input?.files || !input.files[0]) throw new Error('File required');
                                const fd = new FormData();
                                fd.set('file', input.files[0]);
                                fd.set('filename', input.files[0].name);
                                const res = await fetch('/api/upload', { method: 'POST', body: fd });
                                const data = await res.json();
                                if (!res.ok) throw new Error(data?.error || 'Failed');
                                setMessage(`Uploaded: ${data.path}`);
                                input.value = '';
                              } catch (e: any) {
                                setMessage(e.message || 'Error');
                              } finally {
                                setUploading(false);
                              }
                            }}
                            className="space-y-3"
                          >
                            <input name="file" type="file" accept="application/pdf" className="w-full" />
                            <button
                              type="submit"
                              disabled={uploading}
                              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                              {uploading ? 'Uploading...' : 'Upload'}
                            </button>
                          </form>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Modals */}
      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
      />
      <DeleteAccountModal
        isOpen={isDeleteAccountModalOpen}
        onClose={() => setIsDeleteAccountModalOpen(false)}
      />
    </div>
  );
}
