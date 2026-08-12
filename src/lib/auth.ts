import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authConfig } from "@/lib/auth.config";

// ─── Validation ───────────────────────────────────────────────────────────────

const loginSchema = z.object({
  // Trim so an accidental leading/trailing space (common with copy-paste) never
  // silently breaks a correct login.
  phone: z.string().trim().min(10).max(15),
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

        const { phone, password } = parsed.data;

        const user = await db.user.findUnique({ where: { phone } });
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
