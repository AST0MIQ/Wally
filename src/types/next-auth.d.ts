import type { DefaultSession } from "next-auth";

type AppRole = "USER" | "ADMIN";
type AppLocale = "TH" | "EN";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: AppRole;
      locale: AppLocale;
      baseCurrency: string;
      timezone: string;
      accent: string;
      lastSeenVersion: string;
    } & DefaultSession["user"];
  }
}
