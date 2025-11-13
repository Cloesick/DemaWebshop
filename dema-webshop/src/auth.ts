import NextAuth from 'next-auth';
import type { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';

export const authConfig = {
  providers: [
    // Google OAuth; requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in env
    Google,
  ],
  pages: {
    signIn: '/login', // Custom login page
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
      if (isOnDashboard) {
        return isLoggedIn; // Redirect unauthenticated users to login
      }
      return true;
    },
    async session({ session, token }) {
      // propagate role to session
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).aliasEmail = token.aliasEmail;
      }
      return session;
    },
    async jwt({ token, account, profile }) {
      // Determine admin role based on email domain or explicit mapping
      const email = (profile as any)?.email || token.email || '';
      const emailLower = String(email).toLowerCase();
      const isDemashopDomain = emailLower.endsWith('@demashop.be');
      const isAliasAdmin = emailLower === 'nicolas.cloet@gmail.com';
      const aliasEmail = isAliasAdmin ? 'nicolas@demashop.be' : emailLower;
      const role = (isDemashopDomain || isAliasAdmin) ? 'admin' : 'user';
      token.role = role;
      token.aliasEmail = aliasEmail;
      return token;
    },
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
