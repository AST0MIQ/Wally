"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { signInWithGoogle } from "@/app/actions/auth";

export function SignInButton({ callbackUrl }: { callbackUrl?: string }) {
  const t = useTranslations("auth");
  const [pending, startTransition] = useTransition();

  return (
    <Button
      size="lg"
      disabled={pending}
      onClick={() => startTransition(() => signInWithGoogle(callbackUrl))}
      className="w-full sm:w-auto"
    >
      <GoogleGlyph />
      {t("continueWithGoogle")}
    </Button>
  );
}

function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 11v2.8h3.9c-.2 1-1.5 3-3.9 3-2.3 0-4.3-1.9-4.3-4.3S9.7 8.2 12 8.2c1.3 0 2.2.6 2.7 1.1l1.8-1.8C15.3 6.4 13.8 5.8 12 5.8c-3.5 0-6.4 2.9-6.4 6.4S8.5 18.6 12 18.6c3.7 0 6.1-2.6 6.1-6.2 0-.4 0-.8-.1-1.1H12z"
      />
    </svg>
  );
}
