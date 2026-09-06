import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { auth } from "@/server/auth";
import { googleConfigured } from "@/server/auth.config";
import { SignInButton } from "@/components/auth/sign-in-button";
import { LanguageSwitcher } from "@/components/nav/language-switcher";

export const metadata: Metadata = {
  title: "Wally",
};

export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  const { callbackUrl } = await searchParams;
  const t = await getTranslations();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-5">
        <span className="text-lg font-bold tracking-tight">Wally</span>
        <LanguageSwitcher />
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-start justify-center gap-8 px-6 py-16">
        <div className="flex flex-col gap-4">
          <h1 className="max-w-2xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            {t("landing.headline")}
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            {t("landing.subheadline")}
          </p>
        </div>

        {googleConfigured ? (
          <SignInButton callbackUrl={callbackUrl} />
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-card p-4 text-sm text-muted-foreground">
            {t("landing.authNotConfigured")}
          </div>
        )}
      </main>

      <footer className="mx-auto w-full max-w-5xl px-6 py-6 text-sm text-muted-foreground">
        {t("landing.footer")}
      </footer>
    </div>
  );
}
