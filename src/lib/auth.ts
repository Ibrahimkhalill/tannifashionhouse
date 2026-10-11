import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { clientIp, rateLimit, MINUTE } from "@/lib/rate-limit";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authConfig } from "@/lib/auth.config";

// ─── Validation ───────────────────────────────────────────────────────────────

const loginSchema = z.object({
  // Trim so an accidental leading/trailing space (common with copy-paste) never
  // silently breaks a correct login. Accepts either a phone number or an email —
  // length bounds are loose enough to cover both.
  phone: z.string().trim().min(5).max(254),
  password: z.string().trim().min(6),
});

// Surfaced to the login forms as `res.code === "rate_limited"`.
class RateLimitedSignin extends CredentialsSignin {
  code = "rate_limited";
}

// ─── NextAuth v5 config (Node runtime — has db + bcrypt) ────────────────────────
// Spreads the edge-safe base config and adds the Credentials provider here so the
// Node-only imports (pg, bcryptjs) never reach the edge middleware bundle.

// How often (ms) the Node runtime re-reads the user's role from the database, so a
// demoted admin loses access within minutes instead of when their token expires.
const ROLE_REFRESH_MS = 5 * 60_000;

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async jwt(params) {
      const token = await authConfig.callbacks.jwt(params);
      if (params.user) {
        token.roleCheckedAt = Date.now();
        return token;
      }
      const checkedAt = (token.roleCheckedAt as number | undefined) ?? 0;
      if (token.id && Date.now() - checkedAt > ROLE_REFRESH_MS) {
        try {
          const u = await db.user.findUnique({ where: { id: token.id as string }, select: { role: true } });
          if (!u) return null; // account deleted — end the session
          token.role = u.role;
          token.roleCheckedAt = Date.now();
        } catch {
          // DB hiccup — keep the existing token rather than logging the user out.
        }
      }
      return token;
    },
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        phone:    { label: "Phone",    type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        // Field is still named "phone" (so the login forms don't need to change),
        // but it now doubles as an email login — whichever it looks like.
        const { phone: identifier, password } = parsed.data;

        // Brute-force guard: per account (stops guessing one user's password) and
        // per IP (stops trying many accounts from one place).
        const [byAccount, byIp] = await Promise.all([
          rateLimit(`login:id:${identifier.toLowerCase()}`, 10, 15 * MINUTE),
          rateLimit(`login:ip:${clientIp(request)}`, 30, 15 * MINUTE),
        ]);
        if (!byAccount.ok || !byIp.ok) throw new RateLimitedSignin();
        const isEmail = identifier.includes("@");

        const user = await db.user.findUnique({
          where: isEmail ? { email: identifier } : { phone: identifier },
        });
        if (!user || !user.password) return null;

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return null;

        // Return only safe fields — these go into the JWT token
        return {
          id:    user.id,
          name:  user.name,
          phone: user.phone,
          email: user.email ?? undefined,
          role:  user.role,
        };
      },
    }),
  ],
});
