/**
 * Minimal Finnhub client (free tier: 60 req/min). Degrades gracefully:
 * when FINNHUB_API_KEY is unset, search returns [] and quotes return null so
 * the UI falls back to manual price entry.
 */
const BASE = "https://finnhub.io/api/v1";

export function finnhubEnabled(): boolean {
  return Boolean(process.env.FINNHUB_API_KEY);
}

function key(): string | null {
  return process.env.FINNHUB_API_KEY || null;
}

export type SecuritySearchResult = {
  symbol: string;
  displaySymbol: string;
  description: string;
  type: string;
};

export async function searchSecurities(
  query: string,
): Promise<SecuritySearchResult[]> {
  const token = key();
  if (!token || !query.trim()) return [];
  const url = `${BASE}/search?q=${encodeURIComponent(query.trim())}&token=${token}`;
  try {
    const res = await fetch(url, { headers: { accept: "application/json" } });
    if (!res.ok) return [];
    const data = (await res.json()) as {
      result?: Array<{
        symbol: string;
        displaySymbol: string;
        description: string;
        type: string;
      }>;
    };
    return (data.result ?? [])
      .filter((r) => r.symbol && !r.symbol.includes("."))
      .slice(0, 15)
      .map((r) => ({
        symbol: r.symbol,
        displaySymbol: r.displaySymbol || r.symbol,
        description: r.description || r.symbol,
        type: r.type || "Common Stock",
      }));
  } catch {
    return [];
  }
}

export type Quote = { price: number; asOf: Date } | null;

export async function getQuote(symbol: string): Promise<Quote> {
  const token = key();
  if (!token) return null;
  const url = `${BASE}/quote?symbol=${encodeURIComponent(symbol)}&token=${token}`;
  try {
    const res = await fetch(url, { headers: { accept: "application/json" } });
    if (!res.ok) return null;
    const data = (await res.json()) as { c?: number; t?: number };
    if (!data.c || data.c <= 0) return null;
    return {
      price: data.c,
      asOf: data.t ? new Date(data.t * 1000) : new Date(),
    };
  } catch {
    return null;
  }
}

export type Profile = { currency: string | null; name: string | null };

export async function getProfile(symbol: string): Promise<Profile> {
  const token = key();
  if (!token) return { currency: null, name: null };
  const url = `${BASE}/stock/profile2?symbol=${encodeURIComponent(symbol)}&token=${token}`;
  try {
    const res = await fetch(url, { headers: { accept: "application/json" } });
    if (!res.ok) return { currency: null, name: null };
    const data = (await res.json()) as { currency?: string; name?: string };
    return { currency: data.currency ?? null, name: data.name ?? null };
  } catch {
    return { currency: null, name: null };
  }
}
