'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AddToWatchlistButton } from './AddToWatchlistButton';
import { getWatchlistItems } from '@/lib/actions/watchlist.actions';

type Recommendation = {
  symbol: string;
  score: number;
  reasons: string[];
};

const Recommendations = () => {
  const [items, setItems] = useState<Recommendation[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [watchlistSymbols, setWatchlistSymbols] = useState<Set<string> | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchWatchlist = async () => {
      try {
        const wl = await getWatchlistItems().catch(() => []);
        if (!mounted) return;
        setWatchlistSymbols(new Set((wl || []).map((w) => String(w.symbol || '').toUpperCase())));
      } catch (e) {
        if (mounted) setWatchlistSymbols(new Set());
      }
    };

    const fetchRecs = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/stock/recommendations?limit=6');
        if (!res.ok) throw new Error('Failed to fetch');
        const json = await res.json();
        if (mounted) setItems(json?.data || []);
      } catch (e: any) {
        console.error('Recommendations fetch error', e);
        if (mounted) setError('Failed to load recommendations');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    // Run both in parallel
    fetchWatchlist();
    fetchRecs();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-700 bg-gray-900 p-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-100 mb-2">Recommended for you</h2>
          <p className="text-gray-400">Personalized suggestions based on your watchlist</p>
        </div>
        <div className="mt-4 text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-gray-700 bg-gray-900 p-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-100 mb-2">Recommended for you</h2>
          <p className="text-gray-400">Personalized suggestions based on your watchlist</p>
        </div>
        <div className="mt-4 text-sm text-red-500">{error}</div>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="rounded-lg border border-gray-700 bg-gray-900 p-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-100 mb-2">Recommended for you</h2>
          <p className="text-gray-400">Personalized suggestions based on your watchlist</p>
        </div>
        <div className="mt-4 text-sm text-muted-foreground">No recommendations right now.</div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900 p-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-100 mb-2">Recommended for you</h2>
        <p className="text-gray-400 mb-4">Personalized suggestions based on your watchlist</p>
      </div>
      <ul className="space-y-3">
        {items.map((rec) => {
          const symbolUpper = String(rec.symbol || '').toUpperCase();
          const initial = !!(watchlistSymbols && watchlistSymbols.has(symbolUpper));
          return (
            <li key={rec.symbol} className="flex items-center justify-between gap-3">
              <div>
                <Link href={`/stocks/${rec.symbol}`} className="font-semibold text-yellow-500 hover:text-yellow-400">
                  {rec.symbol}
                </Link>
                <div className="text-xs text-gray-400">{rec.reasons?.slice(0, 2).join(' • ')}</div>
              </div>
              <div>
                <AddToWatchlistButton
                  symbol={rec.symbol}
                  company={rec.symbol}
                  initialInWatchlist={initial}
                  onChange={(isIn) => {
                    setWatchlistSymbols((prev) => {
                      const next = new Set(prev || []);
                      if (isIn) next.add(symbolUpper);
                      else next.delete(symbolUpper);
                      return next;
                    });
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default Recommendations;
