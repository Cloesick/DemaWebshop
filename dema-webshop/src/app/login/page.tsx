'use client';

import { signIn } from 'next-auth/react';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-white shadow rounded-lg p-8">
        <h1 className="text-2xl font-semibold mb-4">Sign in</h1>
        <p className="text-sm text-gray-600 mb-6">Admins must sign in with an email ending in <b>@demashop.be</b> or with the designated Gmail account.</p>
        <button
          onClick={() => signIn('google', { callbackUrl: '/account' })}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
        >
          Continue with Google
        </button>
      </div>
    </div>
  );
}
