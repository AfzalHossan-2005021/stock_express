'use client';

import { useState, useEffect } from 'react';
import {
  CommandDialog,
  CommandEmpty,
  CommandInput,
  CommandList,
} from '@/components/ui/command';
import Link from 'next/link';
import { Button } from './ui/button';
import { Loader2, TrendingUp, Star } from 'lucide-react';
import { searchStocks } from '@/lib/actions/finnhub.actions';
import { addToWatchlist, removeFromWatchlist } from '@/lib/actions/watchlist.actions';
import { useDebounce } from '@/hooks/useDebounce';
import { toast } from 'sonner';

export const SearchCommand = ({ renderAs = 'button', label = 'Add stock', initialStocks }: SearchCommandProps) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [stocks, setStocks] = useState<StockWithWatchlistStatus[]>(initialStocks);

  const isSearchMode = !!searchTerm.trim();
  const displayStocks = isSearchMode ? stocks : stocks.slice(0, 10);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleSearch = async () => {
    if (!isSearchMode) return setStocks(initialStocks);
    setLoading(true);
    try {
      const results = await searchStocks(searchTerm);
      setStocks(results);
    } catch (error) {
      console.error('Error searching stocks:', error);
      setStocks([]);
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = useDebounce(handleSearch, 300);

  useEffect(() => {
    debouncedSearch();
  }, [searchTerm]);

  const handleSelectStock = () => {
    setOpen(false);
    setSearchTerm('');
    setStocks(initialStocks);
  };

  const handleToggleWatchlist = async (
    e: React.MouseEvent<HTMLButtonElement>,
    stock: StockWithWatchlistStatus
  ) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      if (stock.isInWatchlist) {
        await removeFromWatchlist(stock.symbol);
        setStocks((prev) =>
          prev.map((s) =>
            s.symbol === stock.symbol ? { ...s, isInWatchlist: false } : s
          )
        );
        toast.success(`${stock.symbol} removed from watchlist`);
      } else {
        await addToWatchlist(stock.symbol, stock.name);
        setStocks((prev) =>
          prev.map((s) =>
            s.symbol === stock.symbol ? { ...s, isInWatchlist: true } : s
          )
        );
        toast.success(`${stock.symbol} added to watchlist`);
      }
    } catch (error) {
      console.error('Error toggling watchlist:', error);
      toast.error(
        stock.isInWatchlist
          ? `Failed to remove ${stock.symbol}`
          : `Failed to add ${stock.symbol}`
      );
    }
  };

  return (
    <>
      {renderAs === 'text' ? (
        <span onClick={() => setOpen(true)} className="search-text">
          {label}
        </span>
      ) : (
        <Button onClick={() => setOpen(true)} className='search-btn'>
          {label}
        </Button>

      )}
      <CommandDialog open={open} onOpenChange={setOpen} className='search-dialog'>
        <div className='search-field'>
          <CommandInput
            placeholder="Search stocks..."
            value={searchTerm}
            onValueChange={setSearchTerm}
            className='search-input'
          />
          {loading && <Loader2 className='search-loader' />}
        </div>
        <CommandList className='search-list'>
          {loading ? (
            <CommandEmpty className='search-empty'>Loading stocks...</CommandEmpty>
          ) : displayStocks.length === 0 ? (
            <div className='search-list-indicator'>
              {isSearchMode ? 'No stocks found.' : 'Type to search stocks.'}
            </div>
          ) : (
            <ul>
              <div className='search-count'>
                {isSearchMode
                  ? `Showing ${displayStocks.length} result(s)`
                  : `Showing top ${displayStocks.length} stocks`}
              </div>
              {displayStocks?.map((stock, i) => (
                <li key={stock.symbol} className='search-item'>
                  <Link
                    href={`/stocks/${stock.symbol}`}
                    onClick={() => handleSelectStock()}
                    className='search-item-link'
                  >
                    <TrendingUp className='h-4 w-4 text-yellow-500' />
                    <div className='flex-1'>
                      <div className='search-item-name'>{stock.name}</div>
                      <div className='text-sm text-gray-500'>
                        {stock.symbol} | {stock.exchange} | {stock.type}
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleToggleWatchlist(e, stock)}
                      className='p-2 text-yellow-500 hover:bg-yellow-500/10 rounded transition-colors'
                      title={stock.isInWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
                    >
                      <Star
                        size={18}
                        fill={stock.isInWatchlist ? 'currentColor' : 'none'}
                      />
                    </button>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
};
