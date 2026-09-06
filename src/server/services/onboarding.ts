import { prisma } from "@/server/db";
import { DEFAULT_CATEGORIES } from "@/server/data/default-categories";

/**
 * Seed a newly-created user's default categories + subcategories.
 * Idempotent: does nothing if the user already has categories.
 * Called from the Auth.js `createUser` event.
 */
export async function seedUserDefaults(userId: string): Promise<void> {
  const existing = await prisma.category.count({ where: { userId } });
  if (existing > 0) return;

  for (const [index, cat] of DEFAULT_CATEGORIES.entries()) {
    await prisma.category.create({
      data: {
        userId,
        name: cat.key,
        systemKey: cat.key,
        kind: cat.kind,
        icon: cat.icon,
        color: cat.color,
        sortOrder: index,
        subcategories: {
          create: cat.subcategories.map((sub, subIndex) => ({
            name: sub.key,
            systemKey: sub.key,
            icon: sub.icon,
            sortOrder: subIndex,
          })),
        },
      },
    });
  }
}

/**
 * Promote a user to ADMIN if their email is listed in ADMIN_EMAILS.
 */
export async function applyAdminBootstrap(
  userId: string,
  email: string | null | undefined,
): Promise<void> {
  if (!email) return;
  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (admins.includes(email.toLowerCase())) {
    await prisma.user.update({ where: { id: userId }, data: { role: "ADMIN" } });
  }
}
