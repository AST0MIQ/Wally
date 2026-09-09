"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/server/auth";
import { requireUser } from "@/server/lib/guards";
import {
  checkInStreak,
  markStreakCelebrated,
} from "@/server/services/streak.service";

/** Acknowledge that milestone celebrations up to `tier` have been shown. */
export async function acknowledgeStreakTier(tier: number): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;
  await markStreakCelebrated(session.user.id, tier);
  revalidatePath("/", "layout");
}

/**
 * "Nothing to log today" — count today toward the logging streak without
 * creating a transaction. Safe to call again on a day already counted (no-op).
 */
export async function checkInToday(): Promise<void> {
  const user = await requireUser();
  await checkInStreak(user.id);
  revalidatePath("/", "layout");
}
