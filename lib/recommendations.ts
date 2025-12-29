'use server';

import { POPULAR_STOCK_SYMBOLS } from './constants';
import { getWatchlistSymbolsByEmail } from './actions/watchlist.actions';
import { auth } from './better-auth/auth';
import { headers } from 'next/headers';

export type Recommendation = {
  symbol: string;
  score: number; // 0..1
  reasons: string[];
  metadata?: Record<string, unknown>;
};

// Simple in-memory cache as an MVP. Replace with Redis if available.
const CACHE = new Map<string, { expires: number; value: Recommendation[] }>();

function setCache(key: string, value: Recommendation[], ttlSeconds = 300) {
  CACHE.set(key, { expires: Date.now() + ttlSeconds * 1000, value });
}

function getCache(key: string) {
  const entry = CACHE.get(key);
  if (!entry) return null;
  if (entry.expires < Date.now()) {
    CACHE.delete(key);
    return null;
  }
  return entry.value;
}

function popularityScoreFromRank(index: number, total: number) {
  if (total <= 0) return 0;
  // Normalize so top item gets near 1, last gets small > 0
  return (total - index) / total;
}

export async function getPopularRecommendations(limit = 10): Promise<Recommendation[]> {
  const cacheKey = `popular:${limit}`;
  const cached = getCache(cacheKey);
  if (cached) return cached.slice(0, limit);

  const total = POPULAR_STOCK_SYMBOLS.length;
  const items = POPULAR_STOCK_SYMBOLS.slice(0, 100).map((sym, idx) => {
    const popScore = popularityScoreFromRank(idx, total);

    const r: Recommendation = {
      symbol: sym,
      score: Math.max(0, Math.min(1, popScore)),
      reasons: ['Popular among users'],
    };
    return r;
  });

  const result = items.slice(0, limit);
  setCache(cacheKey, result, 60); // 1 minute cache for popular picks
  return result;
}

export async function getPersonalizedRecommendations(limit = 10): Promise<Recommendation[]> {
  // Try to derive headers in a request context; fallback for tests or other non-request contexts
  let session: any = null;
  try {
    session = await auth.api.getSession({ headers: await headers() });
  } catch (e) {
    // Called outside request scope (tests or other contexts) — fallback to a headers-less call
    session = await auth.api.getSession().catch(() => null);
  }

  if (!session?.user?.email) {
    return getPopularRecommendations(limit);
  }

  const cacheKey = `personal:${session.user.email}:${limit}`;
  const cached = getCache(cacheKey);
  if (cached) return cached.slice(0, limit);

  const watchlist = (await getWatchlistSymbolsByEmail(session.user.email)).map((s) => s.toUpperCase());
  const watchset = new Set(watchlist);

  // Build candidate pool: popular symbols excluding user's watchlist
  const candidates = POPULAR_STOCK_SYMBOLS.filter((s) => !watchset.has(s)).slice(0, 200);

  const total = POPULAR_STOCK_SYMBOLS.length;

  const scored = candidates.map((sym, idx) => {
    const popScore = popularityScoreFromRank(idx, total);

    // simple affinity heuristic: if first char matches any watchlist symbol, small boost
    const firstChar = sym[0];
    let affinityBoost = 0;
    if (watchlist.length > 0 && watchlist.some((w) => w[0] === firstChar)) {
      affinityBoost = 0.15;
    }

    const score = Math.max(0, Math.min(1, popScore * 0.8 + affinityBoost));

    const reasons = ['Popular among users'];
    if (affinityBoost > 0) reasons.push('Related to your watchlist');

    const r: Recommendation = { symbol: sym, score, reasons };
    return r;
  });

  // Sort by score desc and return top-N
  scored.sort((a, b) => b.score - a.score);
  const result = scored.slice(0, limit);

  setCache(cacheKey, result, 300); // 5 minutes for personalized
  return result;
}

export async function clearRecommendationsCacheForUser(email: string) {
  // Utility to help flush cache when user updates watchlist
  if (!email) return;
  for (const key of Array.from(CACHE.keys())) {
    if (key.startsWith(`personal:${email}:`)) CACHE.delete(key);
  }
}
