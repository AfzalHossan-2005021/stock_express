'use server';

import { getDateRange, validateArticle, formatArticle } from '@/lib/utils';
import { POPULAR_STOCK_SYMBOLS } from '../constants';
import { cache } from 'react';
import { mapFinnhubExchangeToTradingView } from '@/lib/tradingview';

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const NEXT_PUBLIC_FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY ?? '';

async function fetchJSON<T>(url: string, revalidateSeconds?: number): Promise<T> {
  const options: RequestInit & { next?: { revalidate?: number } } = revalidateSeconds
    ? { cache: 'force-cache', next: { revalidate: revalidateSeconds } }
    : { cache: 'no-store' };

  const res = await fetch(url, options);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Fetch failed ${res.status}: ${text}`);
  }
  return (await res.json()) as T;
}

export { fetchJSON };

export const getStockProfile2 = cache(async (symbol: string): Promise<{ name?: string; exchange?: string } | null> => {
  try {
    const token = process.env.FINNHUB_API_KEY ?? NEXT_PUBLIC_FINNHUB_API_KEY;
    if (!token) return null;

    const clean = (symbol || '').trim().toUpperCase();
    if (!clean) return null;

    const url = `${FINNHUB_BASE_URL}/stock/profile2?symbol=${encodeURIComponent(clean)}&token=${token}`;
    const profile = await fetchJSON<any>(url, 3600).catch(() => null);
    if (!profile) return null;

    return {
      name: profile?.name || profile?.ticker || undefined,
      exchange: profile?.exchange || undefined,
    };
  } catch (err) {
    console.error('getStockProfile2 error:', err);
    return null;
  }
});

export async function getNews(symbols?: string[]): Promise<MarketNewsArticle[]> {
  try {
    const range = getDateRange(5);
    const token = process.env.FINNHUB_API_KEY;
    if (!token) {
      throw new Error('FINNHUB_API_KEY environment variable is not configured');
    }
    const cleanSymbols = (symbols || [])
      .map((s) => s?.trim().toUpperCase())
      .filter((s): s is string => Boolean(s));

    const maxArticles = 6;

    // If we have symbols, try to fetch company news per symbol and round-robin select
    if (cleanSymbols.length > 0) {
      const perSymbolArticles: Record<string, RawNewsArticle[]> = {};

      await Promise.all(
        cleanSymbols.map(async (sym) => {
          try {
            const url = `${FINNHUB_BASE_URL}/company-news?symbol=${encodeURIComponent(sym)}&from=${range.from}&to=${range.to}&token=${token}`;
            const articles = await fetchJSON<RawNewsArticle[]>(url, 300);
            perSymbolArticles[sym] = (articles || [])
              .filter(validateArticle)
              .sort((a, b) => (b.datetime || 0) - (a.datetime || 0));
          } catch (e) {
            console.error('Error fetching company news for', sym, e);
            perSymbolArticles[sym] = [];
          }
        })
      );

      const collected: MarketNewsArticle[] = [];
      const symbolIndices: Record<string, number> = {};

      // Initialize indices for each symbol
      cleanSymbols.forEach(sym => symbolIndices[sym] = 0);

      // Round-robin up to 6 picks
      for (let round = 0; round < maxArticles; round++) {
        for (let i = 0; i < cleanSymbols.length; i++) {
          const sym = cleanSymbols[i];
          const list = perSymbolArticles[sym] || [];
          const currentIndex = symbolIndices[sym];

          if (currentIndex >= list.length) continue;

          const article = list[currentIndex];
          symbolIndices[sym]++;

          if (!article || !validateArticle(article)) continue;
          collected.push(formatArticle(article, true, sym, round));
          if (collected.length >= maxArticles) break;
        }
        if (collected.length >= maxArticles) break;
      }

      if (collected.length > 0) {
        return collected.slice(0, maxArticles);
      }
      console.warn('No articles found for symbols:', cleanSymbols, '- falling back to general news');
    }

    // General market news fallback or when no symbols provided
    const generalUrl = `${FINNHUB_BASE_URL}/news?category=general&token=${token}`;
    const general = await fetchJSON<RawNewsArticle[]>(generalUrl, 300);

    const seen = new Set<string>();
    const unique: RawNewsArticle[] = [];
    for (const art of general || []) {
      if (!validateArticle(art)) continue;
      const key = `${art.id}-${art.url}-${art.headline}`;
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(art);
      if (unique.length >= maxArticles) break; // cap early before final slicing
    }

    const formatted = unique.slice(0, maxArticles).map((a, idx) => formatArticle(a, false, undefined, idx));
    return formatted;
  } catch (err) {
    console.error('getNews error:', err);
    throw new Error('Failed to fetch news');
  }
}

export const searchStocks = cache(async (query?: string): Promise<StockWithWatchlistStatus[]> => {
  try {
    const token = process.env.FINNHUB_API_KEY ?? NEXT_PUBLIC_FINNHUB_API_KEY;
    if (!token) {
      // If no token, log and return empty to avoid throwing per requirements
      console.error('Error in stock search:', new Error('FINNHUB API key is not configured'));
      return [];
    }

    const trimmed = typeof query === 'string' ? query.trim() : '';

    let results: FinnhubSearchResult[] = [];

    // For query-mode results, Finnhub search doesn't include enough exchange info to build TradingView symbols.
    // We'll enrich with profile2 (cached) for up to 15 results.

    if (!trimmed) {
      // Fetch top 10 popular symbols' profiles
      const top = POPULAR_STOCK_SYMBOLS.slice(0, 10);
      const profiles = await Promise.all(
        top.map(async (sym) => {
          try {
            const url = `${FINNHUB_BASE_URL}/stock/profile2?symbol=${encodeURIComponent(sym)}&token=${token}`;
            // Revalidate every hour
            const profile = await fetchJSON<any>(url, 3600);
            return { sym, profile } as { sym: string; profile: any };
          } catch (e) {
            console.error('Error fetching profile2 for', sym, e);
            return { sym, profile: null } as { sym: string; profile: any };
          }
        })
      );

      results = profiles
        .map(({ sym, profile }) => {
          const symbol = sym.toUpperCase();
          const name: string | undefined = profile?.name || profile?.ticker || undefined;
          const exchange: string | undefined = profile?.exchange || undefined;
          if (!name) return undefined;
          const r: FinnhubSearchResult = {
            symbol,
            description: name,
            displaySymbol: symbol,
            type: 'Common Stock',
          };
          // We don't include exchange in FinnhubSearchResult type, so carry via mapping later using profile
          // To keep pipeline simple, attach exchange via closure map stage
          // We'll reconstruct exchange when mapping to final type
          (r as any).__exchange = exchange; // internal only (Finnhub exchange string)
          return r;
        })
        .filter((x): x is FinnhubSearchResult => Boolean(x));
    } else {
      const url = `${FINNHUB_BASE_URL}/search?q=${encodeURIComponent(trimmed)}&token=${token}`;
      const data = await fetchJSON<FinnhubSearchResponse>(url, 1800);
      results = Array.isArray(data?.result) ? data.result : [];
    }

    const uniqueSymbols = Array.from(
      new Set(
        (results || [])
          .map((r) => (r?.symbol || '').trim().toUpperCase())
          .filter((s) => Boolean(s))
      )
    ).slice(0, 15);

    const profileBySymbol = new Map<string, { name?: string; exchange?: string }>();

    // Only enrich when needed (query-mode); for popular mode we already have exchange in __exchange.
    if (trimmed && uniqueSymbols.length > 0) {
      await Promise.all(
        uniqueSymbols.map(async (sym) => {
          const profile = await getStockProfile2(sym);
          if (profile) profileBySymbol.set(sym, profile);
        })
      );
    }

    const mapped: StockWithWatchlistStatus[] = (results || [])
      .map((r) => {
        const upper = (r?.symbol || '').trim().toUpperCase();
        if (!upper) return undefined;

        const profile = trimmed ? profileBySymbol.get(upper) : undefined;
        const exchangeRaw = (r as any)?.__exchange as string | undefined;
        const tvExchange = mapFinnhubExchangeToTradingView(profile?.exchange || exchangeRaw);

        const name = r?.description || profile?.name || upper;
        const type = r?.type || 'Stock';

        const item: StockWithWatchlistStatus = {
          symbol: upper,
          name,
          exchange: tvExchange || 'US',
          type,
          isInWatchlist: false,
        };
        return item;
      })
      .filter((x): x is StockWithWatchlistStatus => Boolean(x))
      .slice(0, 15);

    return mapped;
  } catch (err) {
    console.error('Error in stock search:', err);
    return [];
  }
});
