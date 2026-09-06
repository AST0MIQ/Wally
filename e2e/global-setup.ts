import { PrismaClient } from "@prisma/client";
import { seedUserDefaults } from "../src/server/services/onboarding";

export const E2E_EMAIL = "e2e@wally.local";
export const E2E_SESSION_TOKEN = "e2e-session-token-1111111111111111";

/** Ensure a persistent test user + session exists for authed specs. */
export default async function globalSetup() {
  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.upsert({
      where: { email: E2E_EMAIL },
      update: {},
      create: {
        email: E2E_EMAIL,
        name: "E2E User",
        locale: "TH",
        baseCurrency: "THB",
      },
    });
    await seedUserDefaults(user.id);
    await prisma.session.upsert({
      where: { sessionToken: E2E_SESSION_TOKEN },
      update: {
        userId: user.id,
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      },
      create: {
        sessionToken: E2E_SESSION_TOKEN,
        userId: user.id,
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      },
    });
  } finally {
    await prisma.$disconnect();
  }
}
