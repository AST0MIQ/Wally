import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";

import { prisma } from "@/server/db";
import { authConfig } from "@/server/auth.config";
import {
  applyAdminBootstrap,
  seedUserDefaults,
} from "@/server/services/onboarding";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        // `user` is the full DB row at runtime (database session strategy);
        // these Wally columns aren't in the base AdapterUser type.
        const dbUser = user as typeof user & {
          role?: "USER" | "ADMIN";
          locale?: "TH" | "EN";
          baseCurrency?: string;
          timezone?: string;
        };
        session.user.id = dbUser.id;
        session.user.role = dbUser.role ?? "USER";
        session.user.locale = dbUser.locale ?? "TH";
        session.user.baseCurrency = dbUser.baseCurrency ?? "THB";
        session.user.timezone = dbUser.timezone ?? "Asia/Bangkok";
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      if (!user.id) return;
      await applyAdminBootstrap(user.id, user.email);
      await seedUserDefaults(user.id);
    },
    async signIn({ user }) {
      if (!user.id) return;
      await prisma.user
        .update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        })
        .catch(() => {
          /* non-critical */
        });
    },
  },
});
