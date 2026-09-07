import { describe, expect, it } from "vitest";
import { formatCurrency, formatMoney } from "@/lib/format";

describe("money formatting", () => {
  it("never rounds a decimal balance to an integer", () => {
    expect(formatMoney("3492.75", "USD", "en")).toBe("$3,492.75");
    expect(formatMoney("3492", "USD", "en")).toBe("$3,492.00");
  });

  it("preserves source precision for investment prices", () => {
    expect(formatCurrency("169.5505", "USD", "en")).toBe("$169.5505");
  });
});
