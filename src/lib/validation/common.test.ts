import { describe, expect, it } from "vitest";

import { zAmount, zAmountNonNegative, zQuantity, zUnitPrice } from "./common";

const parse = (schema: { parse: (v: unknown) => string }, value: string) =>
  schema.parse(value);

describe("money amounts round to two decimals", () => {
  it("leaves two decimals alone", () => {
    expect(parse(zAmount, "935.15")).toBe("935.15");
    expect(parse(zAmount, "100")).toBe("100");
    expect(parse(zAmount, "0.01")).toBe("0.01");
  });

  it("rounds a third and fourth digit away", () => {
    expect(parse(zAmount, "930.6374")).toBe("930.64");
    expect(parse(zAmount, "930.6344")).toBe("930.63");
    expect(parse(zAmount, "1234.5678")).toBe("1234.57");
  });

  it("rounds half up on the decimal string, not through a float", () => {
    // parseFloat("1.005") is 1.00499999999999989, which rounds the wrong way.
    expect(parse(zAmount, "1.005")).toBe("1.01");
    expect(parse(zAmount, "8.165")).toBe("8.17");
  });

  it("carries into the whole part", () => {
    expect(parse(zAmount, "9.999")).toBe("10.00");
    expect(parse(zAmount, "0.999")).toBe("1.00");
  });

  it("keeps every digit of a large amount", () => {
    expect(parse(zAmount, "999999999999.994")).toBe("999999999999.99");
  });

  it("rejects an amount that rounds away to nothing", () => {
    expect(() => parse(zAmount, "0.004")).toThrow();
    expect(() => parse(zAmount, "0")).toThrow();
  });

  it("rounds fees and opening balances too, and allows zero", () => {
    expect(parse(zAmountNonNegative, "0")).toBe("0");
    expect(parse(zAmountNonNegative, "0.004")).toBe("0.00");
    expect(parse(zAmountNonNegative, "1.39")).toBe("1.39");
  });
});

describe("per-unit values keep their precision", () => {
  it("does not round a share price", () => {
    expect(parse(zUnitPrice, "328.63")).toBe("328.63");
    expect(parse(zUnitPrice, "1142.9612")).toBe("1142.9612");
    // A sub-cent price would be zeroed out by money rounding.
    expect(parse(zUnitPrice, "0.000123")).toBe("0.000123");
  });

  it("does not round a share quantity", () => {
    expect(parse(zQuantity, "2.831873")).toBe("2.831873");
    expect(parse(zQuantity, "0.8718")).toBe("0.8718");
  });
});
