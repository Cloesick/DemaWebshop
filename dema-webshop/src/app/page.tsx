'use client';

import Link from 'next/link';
import { FiArrowRight, FiTruck, FiShield, FiHeadphones } from 'react-icons/fi';

// Placeholder image component to handle loading states
const PlaceholderImage = ({ src, alt, className }: { src: string; alt: string; className?: string }) => {
  return (
    <div className={`relative bg-gray-100 overflow-hidden ${className || ''}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-blue-100"></div>
      <div className="relative h-full flex items-center justify-center p-4">
        <span className="text-gray-400 text-sm text-center">{alt}</span>
      </div>
    </div>
  );
};

// Feature component
const Feature = ({ icon: Icon, title, children }: { icon: any, title: string, children: React.ReactNode }) => (
  <div className="flex items-start space-x-4">
    <div className="flex-shrink-0 bg-blue-100 p-2 rounded-full text-blue-600">
      <Icon className="h-6 w-6" />
    </div>
    <div>
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      <p className="mt-1 text-gray-600">{children}</p>
    </div>
  </div>
);

const categories = [
  {
    name: 'Compressors',
    description: 'High-quality air compressors for all your needs',
    image: '/images/compressors.jpg',
    count: '50+ products',
  },
  {
    name: 'Pneumatic Tools',
    description: 'Powerful tools for professional use',
    image: '/images/tools.jpg',
    count: '120+ products',
  },
  {
    name: 'Air Treatment',
    description: 'Filters, regulators, and lubricators',
    image: '/images/air-treatment.jpg',
    count: '75+ products',
  },
  {
    name: 'Hoses & Fittings',
    description: 'Durable hoses and fittings for any application',
    image: '/images/hoses.jpg',
    count: '200+ products',
  },
];

const features = [
  {
    name: 'Free Shipping',
    description: 'On orders over €50',
    icon: FiTruck,
  },
  {
    name: '2-Year Warranty',
    description: 'On all our products',
    icon: FiShield,
  },
  {
    name: '24/7 Support',
    description: 'Dedicated support',
    icon: FiHeadphones,
  },
];

export default function Home() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-700 to-blue-900 text-white overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-blue-900 opacity-90"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
              <h1 className="text-4xl tracking-tight font-extrabold text-white sm:text-5xl md:text-6xl">
                <span className="block">Industrial Tools</span>
                <span className="block text-blue-200">For Professionals</span>
              </h1>
              <p className="mt-3 text-base text-blue-100 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                High-quality industrial tools and equipment for professionals who demand the best performance and reliability.
              </p>
              <div className="mt-10 sm:flex sm:justify-center lg:justify-start">
                <div className="rounded-md shadow">
                  <Link
                    href="/all-products"
                    className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-700 bg-yellow-400 hover:bg-yellow-500 md:py-4 md:text-lg md:px-10"
                  >
                    Shop Now
                  </Link>
                </div>
                <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
                  <Link
                    href="/about"
                    className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-700 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
                  >
                    Learn More
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase">Why Choose Us</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              The Best Industrial Tools Provider
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
              We provide high-quality industrial tools and equipment with exceptional customer service.
            </p>
          </div>

          <div className="mt-10">
            <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-3 md:gap-x-8 md:gap-y-10">
              {features.map((feature) => (
                <Feature key={feature.name} icon={feature.icon} title={feature.name}>
                  {feature.description}
                </Feature>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Shop by Category
            </h2>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
              Browse our wide range of industrial products
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => (
              <div key={category.name} className="group relative">
                <div className="w-full min-h-80 bg-white aspect-w-1 aspect-h-1 rounded-md overflow-hidden group-hover:opacity-75 h-64">
                  <PlaceholderImage 
                    src={category.image} 
                    alt={category.name}
                    className="w-full h-full object-cover object-center"
                  />
                </div>
                <div className="mt-4 flex justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      <Link href={`/all-products?category=${encodeURIComponent(category.name)}`}>
                        <span aria-hidden="true" className="absolute inset-0" />
                        {category.name}
                      </Link>
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">{category.count}</p>
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-600">{category.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/all-products"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              View All Products
              <FiArrowRight className="ml-2 -mr-1 w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-700">
        <div className="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            <span className="block">Ready to get started?</span>
            <span className="block">Browse our catalog today.</span>
          </h2>
          <p className="mt-4 text-lg leading-6 text-blue-200">
            Discover our wide range of industrial tools and equipment for professionals.
          </p>
          <Link
            href="/all-products"
            className="mt-8 w-full inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 sm:w-auto"
          >
            Shop Now
          </Link>
        </div>
      </div>
    </div>
  );
}
