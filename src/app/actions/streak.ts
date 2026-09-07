"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/server/auth";
import { markStreakCelebrated } from "@/server/services/streak.service";

/** Acknowledge that milestone celebrations up to `tier` have been shown. */
export async function acknowledgeStreakTier(tier: number): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;
  await markStreakCelebrated(session.user.id, tier);
  revalidatePath("/", "layout");
}
