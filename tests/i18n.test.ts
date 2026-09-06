import { describe, expect, it } from "vitest";

import en from "../messages/en.json";
import th from "../messages/th.json";

function flatKeys(obj: unknown, prefix = ""): string[] {
  if (obj === null || typeof obj !== "object") return [prefix];
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
    flatKeys(v, prefix ? `${prefix}.${k}` : k),
  );
}

describe("i18n message catalogs", () => {
  it("th and en expose exactly the same keys", () => {
    const enKeys = flatKeys(en).sort();
    const thKeys = flatKeys(th).sort();
    expect(thKeys).toEqual(enKeys);
  });

  it("has no empty string values", () => {
    for (const catalog of [en, th]) {
      const empties = flatKeys(catalog).filter((path) => {
        const value = path
          .split(".")
          .reduce<unknown>(
            (acc, key) =>
              acc && typeof acc === "object"
                ? (acc as Record<string, unknown>)[key]
                : undefined,
            catalog,
          );
        return value === "";
      });
      expect(empties).toEqual([]);
    }
  });
});
