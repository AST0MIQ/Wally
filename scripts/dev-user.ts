/**
 * DEV ONLY — create (or reuse) a local user + long-lived session so authed
 * pages can be smoke-tested without Google OAuth configured.
 *
 *   pnpm tsx scripts/dev-user.ts
 *
 * Prints a `Cookie:` header value to use with curl / the browser.
 */
import { PrismaClient } from "@prisma/client";
import { seedUserDefaults } from "../src/server/services/onboarding";

const prisma = new PrismaClient();

const EMAIL = process.env.DEV_USER_EMAIL ?? "dev@wally.local";
const SESSION_TOKEN = "dev-session-token-0000000000000000";

async function main() {
  const user = await prisma.user.upsert({
    where: { email: EMAIL },
    update: {},
    create: { email: EMAIL, name: "Dev User", locale: "TH", baseCurrency: "THB" },
  });

  await seedUserDefaults(user.id);

  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 90);
  await prisma.session.upsert({
    where: { sessionToken: SESSION_TOKEN },
    update: { expires, userId: user.id },
    create: { sessionToken: SESSION_TOKEN, userId: user.id, expires },
  });

  const categories = await prisma.category.count({ where: { userId: user.id } });

  console.log("user id:      ", user.id);
  console.log("categories:   ", categories);
  console.log("cookie header: authjs.session-token=" + SESSION_TOKEN);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
