'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';
import { addToWatchlist, removeFromWatchlist } from '@/lib/actions/watchlist.actions';
import { toast } from 'sonner';

interface AddToWatchlistButtonProps {
  symbol: string;
  company: string;
  initialInWatchlist?: boolean;
  onChange?: (isInWatchlist: boolean) => void;
}

export const AddToWatchlistButton = ({
  symbol,
  company,
  initialInWatchlist = false,
  onChange,
}: AddToWatchlistButtonProps) => {
  const [isInWatchlist, setIsInWatchlist] = useState(initialInWatchlist);
  const [isLoading, setIsLoading] = useState(false);

  // Keep local state in sync if parent updates initialInWatchlist later
  useEffect(() => {
    setIsInWatchlist(initialInWatchlist);
  }, [initialInWatchlist]);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      if (isInWatchlist) {
        await removeFromWatchlist(symbol);
        setIsInWatchlist(false);
        toast.success(`${symbol} removed from watchlist`);
        onChange?.(false);
        // notify other components to refresh
        const symbolUpper = String(symbol || '').toUpperCase();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('watchlist:update', { detail: { symbol: symbolUpper, action: 'removed' } }));
        }
      } else {
        await addToWatchlist(symbol, company);
        setIsInWatchlist(true);
        toast.success(`${symbol} added to watchlist`);
        onChange?.(true);
        const symbolUpper = String(symbol || '').toUpperCase();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('watchlist:update', { detail: { symbol: symbolUpper, action: 'added' } }));
        }
      }
    } catch (error) {
      console.error('Error updating watchlist:', error);
      toast.error(
        isInWatchlist
          ? `Failed to remove ${symbol} from watchlist`
          : `Failed to add ${symbol} to watchlist`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={isLoading}
      className={`yellow-btn w-full gap-2 ${
        isInWatchlist ? 'bg-yellow-500 text-black hover:bg-yellow-600' : ''
      }`}
    >
      <Star
        size={20}
        fill={isInWatchlist ? 'currentColor' : 'none'}
        className={isInWatchlist ? '' : ''}
      />
      {isLoading
        ? 'Loading...'
        : isInWatchlist
          ? 'Remove from Watchlist'
          : 'Add to Watchlist'}
    </Button>
  );
};
