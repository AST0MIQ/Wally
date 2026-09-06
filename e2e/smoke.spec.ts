import { test, expect } from "@playwright/test";
import { E2E_SESSION_TOKEN } from "./global-setup";

test("landing page renders", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator("body")).toContainText("Wally");
});

test("protected route redirects to landing when unauthenticated", async ({
  page,
}) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/\?callbackUrl=%2Fdashboard/);
});

test("offline fallback page renders", async ({ page }) => {
  await page.goto("/~offline");
  await expect(page.locator("h1")).toBeVisible();
});

test("authenticated user reaches the dashboard", async ({ context, page }) => {
  await context.addCookies([
    {
      name: "authjs.session-token",
      value: E2E_SESSION_TOKEN,
      domain: "localhost",
      path: "/",
    },
  ]);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/dashboard/);
  // dashboard shows either the populated view or the empty-state CTA
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("language switch to English works", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "EN" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});
