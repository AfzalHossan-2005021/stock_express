import { Schema, model, models, type Document, type Model } from 'mongoose';

export interface IWatchlistItem extends Document {
  userId: string;
  symbol: string;
  company: string;
  exchange?: string;
  tvSymbol?: string;
  addedAt: Date;
}

const WatchlistSchema = new Schema<IWatchlistItem>(
  {
    userId: { type: String, required: true, index: true },
    symbol: { type: String, required: true, uppercase: true, trim: true },
    company: { type: String, required: true, trim: true },
    exchange: { type: String, required: false, uppercase: true, trim: true },
    tvSymbol: { type: String, required: false, uppercase: true, trim: true },
    addedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// Prevent duplicate symbols per user
WatchlistSchema.index({ userId: 1, symbol: 1 }, { unique: true });

export const Watchlist: Model<IWatchlistItem> =
  (models?.Watchlist as Model<IWatchlistItem>) || model<IWatchlistItem>('Watchlist', WatchlistSchema);
