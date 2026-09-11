/**
 * Pure reducer for the on-screen numpad. Enforces a single decimal point and
 * at most 2 fraction digits, with no leading zeros.
 */
export function applyAmountKey(current: string, key: string): string {
  if (key === "back") return current.slice(0, -1);
  if (key === ".") {
    if (current.includes(".")) return current;
    return current === "" ? "0." : `${current}.`;
  }
  const [, decimals] = current.split(".");
  if (decimals !== undefined && decimals.length >= 2) return current;
  if (current === "0") return key;
  return current + key;
}

/** Fraction digits the numpad — and every amount field — accepts. */
export const AMOUNT_DECIMALS = 2;

/**
 * Does `charge` exceed `available`, judged at the precision a user can
 * actually type?
 *
 * A stored balance can carry more precision than anyone can enter: settling a
 * stock trade of 2.831873 shares at 328.63 charges 930.638 to the cash
 * account, leaving sub-cent change. `applyAmountKey` above caps input at two
 * decimals and every balance is displayed rounded to two — so comparing
 * exactly rejects "move the whole balance" with a message quoting the very
 * figure the user just typed.
 */
export function exceedsAvailable(charge: number, available: number): boolean {
  const unit = 10 ** AMOUNT_DECIMALS;
  return Math.round(charge * unit) > Math.round(available * unit);
}
