import { describe, expect, it } from "vitest";

import { applyAmountKey, exceedsAvailable } from "./amount-input";

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

describe("exceedsAvailable", () => {
  // The reported case: settling a 2.831873-share trade at 328.63 charges
  // 930.638 to the USD account, so the balance keeps sub-cent change. It is
  // displayed as US$935.15 and the numpad only accepts two decimals, so
  // "935.15" is the most the user can possibly type to mean "all of it".
  it("lets the user spend a balance that is displayed rounded up", () => {
    expect(exceedsAvailable(935.15, 935.1478)).toBe(false);
  });

  it("lets the user spend a balance that is displayed rounded down", () => {
    expect(exceedsAvailable(935.15, 935.1523)).toBe(false);
  });

  it("still rejects a real overdraft", () => {
    expect(exceedsAvailable(935.16, 935.1478)).toBe(true);
    expect(exceedsAvailable(936, 935.1478)).toBe(true);
  });

  it("allows spending the balance exactly", () => {
    expect(exceedsAvailable(935.15, 935.15)).toBe(false);
  });

  it("is not fooled by binary floating point", () => {
    // 0.1 + 0.2 === 0.30000000000000004
    expect(exceedsAvailable(0.1 + 0.2, 0.3)).toBe(false);
  });
});
