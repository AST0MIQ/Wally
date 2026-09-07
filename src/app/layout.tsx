import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";

import { ACCENT_COOKIE, THEME_COOKIE, isAccentChoice, isThemeChoice } from "@/i18n/config";

import { Toaster } from "@/components/ui/toaster";
import { ConfirmHost } from "@/components/ui/confirm";
import { AppleSplash } from "@/components/pwa/apple-splash";
import { ServiceWorker } from "@/components/pwa/service-worker";
import "@/styles/globals.css";

export const metadata: Metadata = {
  applicationName: "Wally",
  title: {
    default: "Wally",
    template: "%s · Wally",
  },
  description: "Know where your money is. Know where your wealth is going.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  appleWebApp: {
    capable: true,
    title: "Wally",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f8fc" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0f1a" },
  ],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  const themeCookie = (await cookies()).get(THEME_COOKIE)?.value;
  const theme = isThemeChoice(themeCookie) ? themeCookie : "system";
  const dataTheme = theme === "system" ? undefined : theme;
  const accentCookie = (await cookies()).get(ACCENT_COOKIE)?.value;
  const accent = isAccentChoice(accentCookie) ? accentCookie : "blue";

  return (
    <html lang={locale} data-theme={dataTheme} data-accent={accent} suppressHydrationWarning>
      <head>
        <AppleSplash />
      </head>
      <body className="antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
          <Toaster />
          <ConfirmHost />
          <ServiceWorker />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
