import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ONBOARDED_COOKIE } from "@/i18n/config";
import { requireUser } from "@/server/lib/guards";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";

export const metadata: Metadata = { title: "Welcome" };
export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await requireUser();

  // Already been through it on this browser — don't make them do it again.
  if ((await cookies()).get(ONBOARDED_COOKIE)?.value === "1") {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-8 px-6 py-12">
      <OnboardingForm defaultCurrency={user.baseCurrency ?? "THB"} />
    </main>
  );
}
