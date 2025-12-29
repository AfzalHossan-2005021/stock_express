# Code Refactoring Templates & Examples

## 1. Refactoring Error Handling

### Before (Current)
```typescript
// lib/actions/watchlist.actions.ts
export async function addToWatchlist(symbol: string, company: string, tvSymbol?: string) {
  try {
    const user = await getCurrentUser();
    const mongoose = await connectToDatabase();
    // ... validation logic
    await Watchlist.create({ userId: user.id, symbol: cleanSymbol, company });
    return { success: true, message: 'Added to watchlist' };
  } catch (err) {
    console.error('addToWatchlist error:', err);
    throw new Error('Failed to add to watchlist');
  }
}
```

### After (Improved)
```typescript
// lib/actions/watchlist.actions.ts
import { AppError, ErrorCode } from '@/lib/error-handler';
import { StockSymbolSchema } from '@/lib/validation/schemas';

export async function addToWatchlist(
  symbol: string,
  company: string,
  tvSymbol?: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Validate input early
    const cleanSymbol = StockSymbolSchema.parse(symbol);
    if (!company?.trim()) {
      throw new AppError(
        ErrorCode.INVALID_INPUT,
        'Company name is required',
        400
      );
    }

    const user = await getCurrentUser();
    if (!user?.id) {
      throw new AppError(
        ErrorCode.AUTHENTICATION_FAILED,
        'User not authenticated',
        401
      );
    }

    const mongoose = await connectToDatabase();
    if (!mongoose) {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        'Database connection failed',
        500
      );
    }

    // Check for duplicates
    const existing = await Watchlist.findOne({
      userId: user.id,
      symbol: cleanSymbol,
    }).catch(err => {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        'Failed to check watchlist',
        500,
        err
      );
    });

    if (existing) {
      return { success: false, message: 'Already in watchlist' };
    }

    // Add to watchlist
    await Watchlist.create({
      userId: user.id,
      symbol: cleanSymbol,
      company: company.trim(),
      exchange: tvSymbol?.split(':')[0],
      tvSymbol: tvSymbol?.toUpperCase(),
    });

    return { success: true, message: 'Added to watchlist' };

  } catch (err) {
    if (err instanceof AppError) {
      return { success: false, message: err.message };
    }

    console.error('Unexpected error in addToWatchlist:', err);
    return { success: false, message: 'An unexpected error occurred' };
  }
}
```

---

## 2. Refactoring API Request Handling

### Before (No Rate Limiting)
```typescript
// lib/actions/finnhub.actions.ts
export async function getNews(symbols?: string[]) {
  const cleanSymbols = (symbols || [])
    .map((s) => s?.trim().toUpperCase())
    .filter((s): s is string => Boolean(s));

  // Concurrent requests without limit
  await Promise.all(
    cleanSymbols.map(async (sym) => {
      const url = `${FINNHUB_BASE_URL}/company-news?...`;
      const articles = await fetchJSON<RawNewsArticle[]>(url);
    })
  );
}
```

### After (With Rate Limiting)
```typescript
// lib/api-client/finnhub.client.ts
import { PQueue } from 'p-queue';

const queue = new PQueue({ concurrency: 2, interval: 1000, intervalCap: 60 });

export async function getNews(symbols?: string[]): Promise<MarketNewsArticle[]> {
  const cleanSymbols = (symbols || [])
    .map((s) => s?.trim().toUpperCase())
    .filter((s): s is string => Boolean(s) && validateSymbol(s));

  if (cleanSymbols.length === 0) {
    return getGeneralNews();
  }

  try {
    // Use queue to rate-limit requests
    const newsPerSymbol = await Promise.all(
      cleanSymbols.map(sym =>
        queue.add(() => fetchCompanyNews(sym))
      )
    );

    return aggregateNews(newsPerSymbol);

  } catch (err) {
    console.error('Error fetching news:', err);
    // Fallback to general news
    return getGeneralNews();
  }
}

private function validateSymbol(symbol: string): boolean {
  return /^[A-Z0-9]{1,5}$/.test(symbol);
}
```

---

## 3. Refactoring Input Validation

### Before (Manual Validation)
```typescript
// lib/actions/auth.actions.ts
export const signUpWithEmail = async ({ 
  email, password, fullName, country, investmentGoals, 
  riskTolerance, preferredIndustry 
}: SignUpFormData) => {
  // No validation - assumes client-side validation
  try {
    const response = await auth.api.signUpEmail({
      body: {email, password, name: fullName}
    })
    // ...
  } catch (err) {
    // Generic error handling
  }
}
```

### After (With Zod Validation)
```typescript
// lib/validation/schemas.ts
import { z } from 'zod';

export const SignUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase letter')
    .regex(/[0-9]/, 'Must contain number'),
  fullName: z.string().min(2, 'Name too short').max(100, 'Name too long'),
  country: z.string().min(2, 'Country required'),
  investmentGoals: z.enum(['Growth', 'Income', 'Balanced', 'Conservative']),
  riskTolerance: z.enum(['Low', 'Medium', 'High']),
  preferredIndustry: z.string().min(1, 'Industry required'),
});

// lib/actions/auth.actions.ts
import { SignUpSchema } from '@/lib/validation/schemas';

export const signUpWithEmail = async (formData: unknown) => {
  try {
    // Parse and validate all fields
    const validData = SignUpSchema.parse(formData);

    const response = await auth.api.signUpEmail({
      body: {
        email: validData.email,
        password: validData.password,
        name: validData.fullName,
      }
    });

    if (!response?.user) {
      throw new AppError(ErrorCode.AUTHENTICATION_FAILED, 'Sign up failed', 401);
    }

    // Send welcome email async
    await sendWelcomeEmailAsync(validData).catch(err => {
      console.error('Email send failed:', err);
      // Don't fail sign-up if email fails
    });

    return { success: true, message: 'Sign up successful' };

  } catch (err) {
    if (err instanceof z.ZodError) {
      const firstError = err.errors[0];
      return {
        success: false,
        message: `${firstError.path.join('.')}: ${firstError.message}`,
      };
    }

    if (err instanceof AppError) {
      return { success: false, message: err.message };
    }

    console.error('Unexpected sign-up error:', err);
    return { success: false, message: 'Sign up failed. Please try again.' };
  }
};
```

---

## 4. Refactoring Component Props

### Before (Loose Typing)
```typescript
// components/SearchCommand.tsx
export const SearchCommand = ({ renderAs = 'button', label = 'Add stock', initialStocks }: SearchCommandProps) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [stocks, setStocks] = useState(initialStocks);
  // ...
}
```

### After (Extracted Logic)
```typescript
// types/search.ts
export interface SearchCommandProps {
  renderAs?: 'button' | 'text';
  label?: string;
  initialStocks: StockWithWatchlistStatus[];
  onStockSelect?: (stock: StockWithWatchlistStatus) => void;
  onError?: (error: Error) => void;
}

// hooks/useStockSearch.ts
export function useStockSearch(initialStocks: StockWithWatchlistStatus[]) {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [stocks, setStocks] = useState(initialStocks);
  const [error, setError] = useState<Error | null>(null);

  const handleSearch = useCallback(async () => {
    if (!searchTerm.trim()) {
      setStocks(initialStocks);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const results = await searchStocks(searchTerm);
      const withStatus = await Promise.all(
        results.map(async stock => ({
          ...stock,
          isInWatchlist: await isInWatchlist(stock.symbol),
        }))
      );
      setStocks(withStatus);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Search failed');
      setError(error);
      setStocks([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, initialStocks]);

  return { searchTerm, setSearchTerm, stocks, setStocks, loading, error, handleSearch };
}

// components/SearchCommand.tsx
export const SearchCommand = ({ 
  renderAs = 'button', 
  label = 'Add stock', 
  initialStocks,
  onStockSelect,
  onError,
}: SearchCommandProps) => {
  const [open, setOpen] = useState(false);
  const { searchTerm, setSearchTerm, stocks, loading, error, handleSearch } = 
    useStockSearch(initialStocks);

  useEffect(() => {
    if (error) {
      onError?.(error);
      toast.error('Failed to search stocks');
    }
  }, [error, onError]);

  const handleSelectStock = (stock: StockWithWatchlistStatus) => {
    onStockSelect?.(stock);
    setOpen(false);
    setSearchTerm('');
  };

  return (
    // Component JSX
  );
}
```

---

## 5. Refactoring API Route with Proper Error Handling

### Before (Minimal Error Handling)
```typescript
// app/api/stock/profile/route.ts
export async function POST(req: NextRequest) {
  const { symbol } = await req.json();
  const token = process.env.FINNHUB_API_KEY;
  const url = `${FINNHUB_BASE_URL}/stock/profile2?symbol=${symbol}&token=${token}`;
  const profile = await fetchJSON(url);
  return NextResponse.json(profile);
}
```

### After (Comprehensive Error Handling)
```typescript
// app/api/stock/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { StockSymbolSchema } from '@/lib/validation/schemas';
import { AppError, ErrorCode } from '@/lib/error-handler';
import { z } from 'zod';

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const REQUEST_TIMEOUT = 10000; // 10 seconds

/**
 * POST /api/stock/profile
 * Fetch stock profile from Finnhub API
 * 
 * Request: { symbol: string }
 * Response: { name: string; exchange: string }
 */
export async function POST(req: NextRequest) {
  try {
    // Validate request method
    if (req.method !== 'POST') {
      return NextResponse.json(
        { error: 'Method not allowed' },
        { status: 405 }
      );
    }

    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Validate symbol using Zod
    let symbol: string;
    try {
      symbol = StockSymbolSchema.parse(body.symbol);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return NextResponse.json(
          { error: err.errors[0].message },
          { status: 400 }
        );
      }
      throw err;
    }

    // Verify API key is configured
    const apiKey = process.env.FINNHUB_API_KEY;
    if (!apiKey) {
      console.error('FINNHUB_API_KEY not configured');
      return NextResponse.json(
        { error: 'Service configuration error' },
        { status: 500 }
      );
    }

    // Fetch from Finnhub with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      const url = new URL(`${FINNHUB_BASE_URL}/stock/profile2`);
      url.searchParams.set('symbol', symbol);
      url.searchParams.set('token', apiKey);

      const response = await fetch(url.toString(), {
        method: 'GET',
        signal: controller.signal,
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 3600 }, // Cache for 1 hour
      });

      clearTimeout(timeout);

      // Handle API errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 429) {
          console.warn('Finnhub rate limit exceeded');
          return NextResponse.json(
            { error: 'Service temporarily unavailable' },
            { status: 429, headers: { 'Retry-After': '60' } }
          );
        }

        if (response.status === 401) {
          console.error('Invalid Finnhub API key');
          return NextResponse.json(
            { error: 'Service configuration error' },
            { status: 500 }
          );
        }

        throw new Error(`Finnhub API error ${response.status}: ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();

      // Validate response structure
      if (!data.name && !data.ticker) {
        return NextResponse.json(
          { error: 'Stock not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          name: data.name || data.ticker || symbol,
          exchange: data.exchange || 'UNKNOWN',
        },
        { status: 200 }
      );

    } catch (err) {
      clearTimeout(timeout);

      if (err instanceof DOMException && err.name === 'AbortError') {
        console.warn('Finnhub request timeout');
        return NextResponse.json(
          { error: 'Request timeout' },
          { status: 504 }
        );
      }

      throw err;
    }

  } catch (err) {
    console.error('Stock profile API error:', {
      error: err instanceof Error ? err.message : 'Unknown error',
      stack: err instanceof Error ? err.stack : undefined,
    });

    return NextResponse.json(
      { error: 'Failed to fetch stock profile' },
      { status: 500 }
    );
  }
}
```

---

## 6. Database Connection with Health Checks

### Before (Simple Caching)
```typescript
// database/mongoose.ts
let cached = global.mongooseCache;

export const connectToDatabase = async () => {
  if (!MONGODB_URI) throw new Error('MONGODB_URI must be set');
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI);
  }
  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }
  return cached.conn;
}
```

### After (With Health Checks)
```typescript
// database/connection.ts
import mongoose from 'mongoose';

declare global {
  var mongooseCache: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  }
}

const MONGODB_URI = process.env.MONGODB_URI;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

let cached = global.mongooseCache || { conn: null, promise: null };
if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export async function connectToDatabase() {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI must be set in environment variables');
  }

  // Return existing connection if healthy
  if (cached.conn) {
    const readyState = cached.conn.connection?.readyState;
    if (readyState === 1) { // Connected
      return cached.conn;
    }
    // Connection lost, reset cache
    cached.conn = null;
    cached.promise = null;
  }

  // Return pending promise if already connecting
  if (cached.promise) {
    try {
      return await cached.promise;
    } catch (err) {
      cached.promise = null;
      throw err;
    }
  }

  // Create new connection with retry logic
  cached.promise = connectWithRetry(MAX_RETRIES);

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (err) {
    cached.promise = null;
    throw err;
  }
}

async function connectWithRetry(retries: number): Promise<typeof mongoose> {
  try {
    return await mongoose.connect(MONGODB_URI!, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
  } catch (err) {
    if (retries > 0) {
      console.warn(`MongoDB connection failed, retrying... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return connectWithRetry(retries - 1);
    }
    throw err;
  }
}

export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const conn = await connectToDatabase();
    const admin = conn.connection.db?.admin();
    const status = await admin?.ping();
    return !!status;
  } catch {
    return false;
  }
}
```

---

## Summary of Refactoring Patterns

| Issue | Pattern | Benefit |
|-------|---------|---------|
| Error Handling | AppError class | Consistent error types and messages |
| Input Validation | Zod schemas | Type-safe validation, reusable schemas |
| API Requests | p-queue for rate limiting | Prevents quota limits and API bans |
| Component Logic | Custom hooks | Easier to test, reuse, and maintain |
| Database | Health checks + retry | More reliable connections |
| Type Safety | Separate type files | Better organization and tree-shaking |
| Error Logging | Structured logging | Better debugging and monitoring |

---

## Next Steps

1. Start with error handling refactor (highest impact)
2. Add validation layer to all input points
3. Extract business logic from components
4. Add database health checks
5. Implement rate limiting for API calls
6. Update all API routes with proper error handling

Each refactor should include corresponding tests to ensure functionality remains intact.
