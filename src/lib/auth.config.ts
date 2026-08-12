import type { NextAuthConfig } from "next-auth";

// Edge-safe NextAuth config — NO providers, NO db/bcrypt imports.
// Middleware uses this to read the JWT (role/phone) without pulling Node-only
// modules (pg, bcryptjs, crypto) into the edge runtime. The full config in
// auth.ts spreads this and adds the Credentials provider for API/server use.
export const authConfig = {
  // Trust the incoming host header so login works on any dev port (3000/3001)
  // and behind a proxy in production, regardless of NEXTAUTH_URL.
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [], // populated in auth.ts (Node runtime only)
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id    = user.id ?? "";
        token.phone = (user as { phone?: string }).phone ?? "";
        token.role  = (user as { role?: string }).role  ?? "CUSTOMER";
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id    = token.id as string;
        session.user.phone = token.phone as string;
        session.user.role  = token.role as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
