'use server';

import { connectToDatabase } from '@/database/mongoose';
import { Watchlist } from '@/database/models/watchlist.model';
import { auth } from '@/lib/better-auth/auth';
import { headers } from 'next/headers';

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
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    throw new Error('Not authenticated');
  }
  return session.user;
}

export async function addToWatchlist(
  symbol: string,
  company: string
): Promise<{ success: boolean; message: string }> {
  try {
    const user = await getCurrentUser();
    const mongoose = await connectToDatabase();

    // Check if already exists
    const existing = await Watchlist.findOne({
      userId: user.id,
      symbol: symbol.toUpperCase(),
    });

    if (existing) {
      return { success: false, message: 'Already in watchlist' };
    }

    // Add to watchlist
    await Watchlist.create({
      userId: user.id,
      symbol: symbol.toUpperCase(),
      company,
    });

    return { success: true, message: 'Added to watchlist' };
  } catch (err) {
    console.error('addToWatchlist error:', err);
    throw new Error('Failed to add to watchlist');
  }
}

export async function removeFromWatchlist(symbol: string): Promise<{ success: boolean; message: string }> {
  try {
    const user = await getCurrentUser();

    const result = await Watchlist.deleteOne({
      userId: user.id,
      symbol: symbol.toUpperCase(),
    });

    if (result.deletedCount === 0) {
      return { success: false, message: 'Not found in watchlist' };
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

    return items.map((item) => ({
      symbol: String(item.symbol),
      name: String(item.company),
      exchange: 'US',
      type: 'Common Stock',
      isInWatchlist: true,
    }));
  } catch (err) {
    console.error('getWatchlistItems error:', err);
    throw new Error('Failed to fetch watchlist');
  }
}

export async function isInWatchlist(symbol: string): Promise<boolean> {
  try {
    const user = await getCurrentUser();

    const item = await Watchlist.findOne({
      userId: user.id,
      symbol: symbol.toUpperCase(),
    });

    return !!item;
  } catch (err) {
    console.error('isInWatchlist error:', err);
    return false;
  }
}
