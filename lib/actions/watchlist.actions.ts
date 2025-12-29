'use server';

import { connectToDatabase } from '../../database/mongoose';
import { Watchlist } from '../../database/models/watchlist.model';
import { auth } from '../better-auth/auth';
import { headers } from 'next/headers';
import { getStockProfile2 } from './finnhub.actions';
import { buildTradingViewSymbol, mapFinnhubExchangeToTradingView } from '../tradingview';

export async function getWatchlistSymbolsByEmail(email: string): Promise<string[]> {
  if (!email) return [];

  try {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error('MongoDB connection not found');

    // Better Auth stores users in the "user" collection
    const user = await db.collection('user').findOne<{ _id?: unknown; id?: string; email?: string }>({ email });

    if (!user) return [];

    const userId = (user.id as string) || String(user._id || '');
    if (!userId) return [];

    const items = await Watchlist.find({ userId }, { symbol: 1 }).lean();
    return items.map((i) => String(i.symbol));
  } catch (err) {
    console.error('getWatchlistSymbolsByEmail error:', err);
    return [];
  }
}

async function getCurrentUser() {
  // Try to call with headers in request context, otherwise fall back to headers-less call (for tests and non-request contexts)
  let session: any = null;
  try {
    session = await auth.api.getSession({ headers: await headers() });
  } catch (e) {
    // Fall back to an empty Headers instance to satisfy the API typing that requires headers.
    session = await auth.api.getSession({ headers: new Headers() }).catch(() => null);
  }

  if (!session?.user) {
    throw new Error('Not authenticated');
  }
  return session.user;
}

export async function addToWatchlist(
  symbol: string,
  company: string,
  tvSymbol?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const user = await getCurrentUser();
    const mongoose = await connectToDatabase();

    const normalizedSymbol = (symbol || '').toUpperCase().includes(':')
      ? (symbol || '').split(':').pop() || ''
      : (symbol || '');

    const cleanSymbol = normalizedSymbol.trim().toUpperCase();
    if (!cleanSymbol) throw new Error('Invalid symbol');

    const cleanTvSymbol = (tvSymbol || '').trim().toUpperCase() || undefined;
    const exchangeFromTv = cleanTvSymbol?.includes(':') ? cleanTvSymbol.split(':')[0] : undefined;

    // Check if already exists
    const existing = await Watchlist.findOne({
      userId: user.id,
      symbol: cleanSymbol,
    });

    if (existing) {
      return { success: false, message: 'Already in watchlist' };
    }

    // Add to watchlist
    await Watchlist.create({
      userId: user.id,
      symbol: cleanSymbol,
      company,
      exchange: exchangeFromTv,
      tvSymbol: cleanTvSymbol,
    });

    // Clear recommendation cache for this user so recommendations refresh
    try {
      const { clearRecommendationsCacheForUser } = await import('../recommendations');
      if (typeof user?.email === 'string') await clearRecommendationsCacheForUser(user.email);
    } catch (e) {
      // Non-fatal - don't block the main flow
      console.warn('Failed to clear recommendation cache for user', e);
    }

    return { success: true, message: 'Added to watchlist' };
  } catch (err) {
    console.error('addToWatchlist error:', err);
    throw new Error('Failed to add to watchlist');
  }
}

export async function removeFromWatchlist(symbol: string): Promise<{ success: boolean; message: string }> {
  try {
    const user = await getCurrentUser();

    const normalizedSymbol = (symbol || '').toUpperCase().includes(':')
      ? (symbol || '').split(':').pop() || ''
      : (symbol || '');
    const cleanSymbol = normalizedSymbol.trim().toUpperCase();
    if (!cleanSymbol) throw new Error('Invalid symbol');

    const result = await Watchlist.deleteOne({
      userId: user.id,
      symbol: cleanSymbol,
    });

    if (result.deletedCount === 0) {
      return { success: false, message: 'Not found in watchlist' };
    }

    // Clear recommendation cache for this user so recommendations refresh
    try {
      const { clearRecommendationsCacheForUser } = await import('../recommendations');
      if (typeof user?.email === 'string') await clearRecommendationsCacheForUser(user.email);
    } catch (e) {
      console.warn('Failed to clear recommendation cache for user', e);
    }

    return { success: true, message: 'Removed from watchlist' };
  } catch (err) {
    console.error('removeFromWatchlist error:', err);
    throw new Error('Failed to remove from watchlist');
  }
}

export async function getWatchlistItems(): Promise<StockWithWatchlistStatus[]> {
  try {
    const user = await getCurrentUser();

    const items = await Watchlist.find({ userId: user.id }).lean();

    const enriched = await Promise.all(
      items.map(async (item) => {
        const symbol = String(item.symbol || '').trim().toUpperCase();
        const name = String(item.company || symbol);

        const storedTvSymbol = (item as any).tvSymbol as string | undefined;
        const storedExchange = (item as any).exchange as string | undefined;

        let tvExchange = storedExchange && storedExchange !== 'US' ? storedExchange : undefined;
        let tvSymbol = storedTvSymbol;

        if (!tvSymbol && tvExchange) {
          tvSymbol = `${tvExchange}:${symbol}`;
        }

        if (!tvSymbol) {
          const profile = await getStockProfile2(symbol);
          const inferred = mapFinnhubExchangeToTradingView(profile?.exchange);
          tvExchange = inferred;
          tvSymbol = buildTradingViewSymbol(symbol, inferred);
        }

        return {
          symbol,
          name,
          exchange: tvExchange || 'US',
          type: 'Common Stock',
          isInWatchlist: true,
        } satisfies StockWithWatchlistStatus;
      })
    );

    return enriched;
  } catch (err) {
    console.error('getWatchlistItems error:', err);
    throw new Error('Failed to fetch watchlist');
  }
}

export async function isInWatchlist(symbol: string): Promise<boolean> {
  try {
    const user = await getCurrentUser();

    const normalizedSymbol = (symbol || '').toUpperCase().includes(':')
      ? (symbol || '').split(':').pop() || ''
      : (symbol || '');
    const cleanSymbol = normalizedSymbol.trim().toUpperCase();
    if (!cleanSymbol) return false;

    const item = await Watchlist.findOne({
      userId: user.id,
      symbol: cleanSymbol,
    });

    return !!item;
  } catch (err) {
    console.error('isInWatchlist error:', err);
    return false;
  }
}
