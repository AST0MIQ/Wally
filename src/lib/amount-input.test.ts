import { describe, expect, it } from "vitest";

import { applyAmountKey } from "./amount-input";

const type = (keys: string[]) => keys.reduce(applyAmountKey, "");

describe("applyAmountKey", () => {
  it("builds a plain number", () => {
    expect(type(["1", "2", "3"])).toBe("123");
  });

  it("prevents leading zeros", () => {
    expect(type(["0", "5"])).toBe("5");
  });

  it("allows a single decimal point", () => {
    expect(type(["1", ".", "5", "."])).toBe("1.5");
  });

  it("caps at 2 decimals", () => {
    expect(type(["1", ".", "2", "3", "4"])).toBe("1.23");
  });

  it("leading dot becomes 0.", () => {
    expect(type(["."])).toBe("0.");
  });

  it("backspace removes the last char", () => {
    expect(applyAmountKey("12.5", "back")).toBe("12.");
    expect(applyAmountKey("", "back")).toBe("");
  });
});
