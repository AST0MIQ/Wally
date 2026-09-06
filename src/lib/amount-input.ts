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
