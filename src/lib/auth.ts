import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/db";
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

// ─── NextAuth v5 config (Node runtime — has db + bcrypt) ────────────────────────
// Spreads the edge-safe base config and adds the Credentials provider here so the
// Node-only imports (pg, bcryptjs) never reach the edge middleware bundle.

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        phone:    { label: "Phone",    type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        // Field is still named "phone" (so the login forms don't need to change),
        // but it now doubles as an email login — whichever it looks like.
        const { phone: identifier, password } = parsed.data;
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
