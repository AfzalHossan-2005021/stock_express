'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import { SearchCommand } from '@/components/SearchCommand';
import TickerTape from '@/components/TickerTape';
import { getWatchlistItems, removeFromWatchlist } from '@/lib/actions/watchlist.actions';
import { searchStocks } from '@/lib/actions/finnhub.actions';
import { toast } from 'sonner';
import Recommendations from '@/components/Recommendations';

interface WatchlistItem extends StockWithWatchlistStatus { }

export default function WatchlistPage() {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialStocks, setInitialStocks] = useState<StockWithWatchlistStatus[]>([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        // Fetch initial stocks for search
        const stocks = await searchStocks().catch(() => []);
        setInitialStocks(stocks);

        // Fetch watchlist items
        const data = await getWatchlistItems();
        setItems(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Failed to load watchlist. Please try again.');
        toast.error('Failed to load watchlist');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Listen for watchlist updates from other components (e.g., Recommendations)
  useEffect(() => {
    const handler = (e: Event) => {
      // run async refresh without returning a promise to the event system
      void (async () => {
        try {
          const data = await getWatchlistItems();
          setItems(data);
        } catch (err) {
          console.error('Failed to refresh watchlist after update event:', err);
        }
      })();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('watchlist:update', handler as EventListener);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('watchlist:update', handler as EventListener);
      }
    };
  }, []);

  const handleRemove = async (symbol: string) => {
    try {
      await removeFromWatchlist(symbol);
      setItems((prev) => prev.filter((item) => item.symbol !== symbol));
      toast.success(`${symbol} removed from watchlist`);
    } catch (err) {
      console.error('Failed to remove from watchlist:', err);
      toast.error(`Failed to remove ${symbol} from watchlist`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your watchlist...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] gap-8">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
        </div>
        <SearchCommand
          renderAs="button"
          label="Search & Add Stocks"
          initialStocks={initialStocks}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-row gap-6">
      {items.length > 0 && (
        <div className="flex-1">

          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-100 mb-2">Your Watchlist</h1>
              <p className="text-gray-400">Track your favorite stocks in one place</p>
            </div>

            {items.length > 0 && (
              <div className="rounded-lg border border-gray-700 bg-gray-900 overflow-hidden">
                <TickerTape
                  symbols={items
                    .map((item) => (item.exchange && item.exchange !== 'US' ? `${item.exchange}:${item.symbol}` : null))
                    .filter((s): s is string => Boolean(s))}
                />
              </div>
            )}

            <div className="overflow-x-auto rounded-lg border border-gray-700">
              <table className="w-full">
                <thead className="bg-gray-800 border-b border-gray-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Symbol</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Company</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Exchange</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Type</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {items.map((item) => (
                    <tr
                      key={item.symbol}
                      className="hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <Link href={`/stocks/${item.symbol}`}>
                          <span className="font-semibold text-yellow-500 hover:text-yellow-400 cursor-pointer transition-colors">
                            {item.symbol}
                          </span>
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-gray-300">{item.name}</td>
                      <td className="px-6 py-4 text-gray-400">{item.exchange}</td>
                      <td className="px-6 py-4 text-gray-400">{item.type}</td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleRemove(item.symbol)}
                            className="p-2 text-red-500 hover:bg-red-500/10 rounded transition-colors"
                            title="Remove from watchlist"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="text-sm text-gray-400">
              Total stocks: <span className="font-semibold text-gray-300">{items.length}</span>
            </div>
          </div>
        </div>
      )}
      <div className="flex-1">
        <section className="w-full">
          <div className="max-w-4xl mx-auto">
            <Recommendations />
          </div>
        </section>
      </div>
    </div>
  );
}
