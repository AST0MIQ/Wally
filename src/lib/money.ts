import { Prisma } from "@prisma/client";

/**
 * All monetary math goes through Prisma.Decimal (decimal.js under the hood).
 * NEVER use JS floating point for money.
 */
export const Decimal = Prisma.Decimal;
export type Decimal = Prisma.Decimal;
export type DecimalInput = Prisma.Decimal | string | number;

export const ZERO = new Prisma.Decimal(0);

export function money(value: DecimalInput): Prisma.Decimal {
  return value instanceof Prisma.Decimal
    ? value
    : new Prisma.Decimal(value);
}

export function sum(values: Iterable<DecimalInput>): Prisma.Decimal {
  let acc = new Prisma.Decimal(0);
  for (const v of values) acc = acc.plus(money(v));
  return acc;
}

/** Round to a currency's minor unit for display / storage of derived totals. */
export function roundTo(value: DecimalInput, fractionDigits = 2): Prisma.Decimal {
  return money(value).toDecimalPlaces(
    fractionDigits,
    Prisma.Decimal.ROUND_HALF_UP,
  );
}

/**
 * Does `charge` exceed `available` at the precision amounts are entered in?
 *
 * The numpad caps input at two decimals (see AMOUNT_DECIMALS) and balances are
 * displayed rounded to two, while a stored balance can carry more — settling a
 * stock trade leaves sub-cent change in the cash account. Comparing exactly
 * therefore rejects "spend the whole balance" for a fraction of a cent the
 * user was never shown and could not have typed.
 */
export function exceedsBalance(
  charge: DecimalInput,
  available: DecimalInput,
  fractionDigits = 2,
): boolean {
  return roundTo(charge, fractionDigits).gt(roundTo(available, fractionDigits));
}

/** Serialize for the client boundary (Server Component -> Client Component props). */
export function toPlain(value: DecimalInput): string {
  return money(value).toString();
}

export function isPositive(value: DecimalInput): boolean {
  return money(value).gt(0);
}
