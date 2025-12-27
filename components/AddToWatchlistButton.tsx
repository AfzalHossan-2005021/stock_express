'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';
import { addToWatchlist, removeFromWatchlist } from '@/lib/actions/watchlist.actions';
import { toast } from 'sonner';

interface AddToWatchlistButtonProps {
  symbol: string;
  company: string;
  initialInWatchlist?: boolean;
}

export const AddToWatchlistButton = ({
  symbol,
  company,
  initialInWatchlist = false,
}: AddToWatchlistButtonProps) => {
  const [isInWatchlist, setIsInWatchlist] = useState(initialInWatchlist);
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      if (isInWatchlist) {
        await removeFromWatchlist(symbol);
        setIsInWatchlist(false);
        toast.success(`${symbol} removed from watchlist`);
      } else {
        await addToWatchlist(symbol, company);
        setIsInWatchlist(true);
        toast.success(`${symbol} added to watchlist`);
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
