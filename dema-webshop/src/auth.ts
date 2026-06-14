import type { NextAuthOptions } from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { verifyPassword } from '@/lib/password';

// Admin allowlist (comma-separated emails in env). This is the ONLY way to get
// the admin role — no more "any @demashop.be address is admin" guessing.
function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function isAdmin(email?: string | null): boolean {
  if (!email) return false;
  return adminEmails().includes(email.toLowerCase());
}

export const authOptions: NextAuthOptions = {
  providers: [
    // Credential login is restricted to the admin and secured by a scrypt hash
    // in ADMIN_PASSWORD_HASH (generate with `npm run hash-password`). Fails
    // closed: no hash set, unknown email, or bad password => no session.
    // Customer accounts will move to the database (User model) once it's live.
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toLowerCase().trim();
        const password = credentials?.password ?? '';
        if (!email || !password) return null;

        const hash = process.env.ADMIN_PASSWORD_HASH || '';
        if (!hash || !isAdmin(email)) return null;
        if (!verifyPassword(password, hash)) return null;

        return { id: email, email, name: email.split('@')[0], role: 'admin' };
      },
    }),

    // Google OAuth; requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in env.
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user, profile }) {
      const email =
        (user as any)?.email || (profile as any)?.email || token.email || '';
      const role = isAdmin(String(email)) ? 'admin' : 'user';
      token.role = role;
      token.aliasEmail = String(email).toLowerCase();
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).aliasEmail = token.aliasEmail;
      }
      return session;
    },
  },
};
