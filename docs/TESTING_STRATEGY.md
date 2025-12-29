# Testing Strategy for Stock Express

## Current State
- ✅ Database tests: `/tests/database/__tests__/`
- ❌ Server action tests: Missing
- ❌ Component tests: Missing
- ❌ API endpoint tests: Missing
- ❌ Integration tests: Missing

## Recommended Test Coverage

### 1. Server Actions Tests (HIGH PRIORITY)

```typescript
// __tests__/lib/actions/auth.actions.test.ts
import { signUpWithEmail, signInWithEmail } from '@/lib/actions/auth.actions';

describe('Auth Actions', () => {
  describe('signUpWithEmail', () => {
    it('should create a new user with valid input', async () => {
      const result = await signUpWithEmail({
        email: 'test@example.com',
        password: 'ValidPassword123',
        fullName: 'Test User',
        country: 'US',
        investmentGoals: 'Growth',
        riskTolerance: 'Medium',
        preferredIndustry: 'Technology',
      });

      expect(result.success).toBe(true);
    });

    it('should return error for invalid email', async () => {
      const result = await signUpWithEmail({
        email: 'invalid-email',
        password: 'ValidPassword123',
        // ...
      });

      expect(result.success).toBe(false);
    });

    it('should reject weak passwords', async () => {
      const result = await signUpWithEmail({
        email: 'test@example.com',
        password: '123', // Too short
        // ...
      });

      expect(result.success).toBe(false);
    });
  });
});
```

### 2. Watchlist Actions Tests

```typescript
// __tests__/lib/actions/watchlist.actions.test.ts
describe('Watchlist Actions', () => {
  describe('addToWatchlist', () => {
    it('should add stock to watchlist', async () => {
      const result = await addToWatchlist('AAPL', 'Apple Inc', 'NASDAQ:AAPL');
      expect(result.success).toBe(true);
    });

    it('should prevent duplicates', async () => {
      await addToWatchlist('AAPL', 'Apple Inc');
      const result = await addToWatchlist('AAPL', 'Apple Inc');
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Already in watchlist');
    });

    it('should normalize stock symbols', async () => {
      // Both should work the same
      await addToWatchlist('aapl', 'Apple Inc');
      await addToWatchlist('AAPL', 'Apple Inc');
    });
  });

  describe('removeFromWatchlist', () => {
    it('should remove stock from watchlist', async () => {
      await addToWatchlist('AAPL', 'Apple Inc');
      const result = await removeFromWatchlist('AAPL');
      expect(result.success).toBe(true);
    });
  });
});
```

### 3. Finnhub API Tests

```typescript
// __tests__/lib/actions/finnhub.actions.test.ts
describe('Finnhub Actions', () => {
  describe('getStockProfile2', () => {
    it('should fetch stock profile', async () => {
      const profile = await getStockProfile2('AAPL');
      expect(profile).toMatchObject({
        name: expect.any(String),
        exchange: expect.any(String),
      });
    });

    it('should return null for invalid symbol', async () => {
      const profile = await getStockProfile2('INVALID');
      expect(profile).toBeNull();
    });

    it('should cache results', async () => {
      const start = Date.now();
      await getStockProfile2('AAPL');
      const first = Date.now();
      
      await getStockProfile2('AAPL');
      const second = Date.now();

      // Second call should be faster (cached)
      expect(second - first).toBeLessThan(first - start);
    });
  });

  describe('getNews', () => {
    it('should fetch market news', async () => {
      const articles = await getNews();
      expect(Array.isArray(articles)).toBe(true);
      expect(articles.length).toBeGreaterThan(0);
    });

    it('should fetch news for specific symbols', async () => {
      const articles = await getNews(['AAPL', 'GOOGL']);
      expect(articles.length).toBeGreaterThan(0);
      expect(articles[0]).toHaveProperty('headline');
    });
  });
});
```

### 4. Component Tests

```typescript
// __tests__/components/SearchCommand.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SearchCommand } from '@/components/SearchCommand';

describe('SearchCommand', () => {
  const mockStocks = [
    {
      symbol: 'AAPL',
      name: 'Apple Inc',
      exchange: 'NASDAQ',
      type: 'Common Stock',
      isInWatchlist: false,
    },
  ];

  it('should render search button', () => {
    render(<SearchCommand renderAs="button" initialStocks={mockStocks} />);
    expect(screen.getByRole('button', { name: /add stock/i })).toBeInTheDocument();
  });

  it('should open dialog on button click', () => {
    render(<SearchCommand renderAs="button" initialStocks={mockStocks} />);
    const button = screen.getByRole('button', { name: /add stock/i });
    fireEvent.click(button);

    expect(screen.getByPlaceholderText(/search stocks/i)).toBeInTheDocument();
  });

  it('should search stocks when typing', async () => {
    render(<SearchCommand renderAs="button" initialStocks={mockStocks} />);
    const button = screen.getByRole('button', { name: /add stock/i });
    fireEvent.click(button);

    const input = screen.getByPlaceholderText(/search stocks/i);
    fireEvent.change(input, { target: { value: 'MSFT' } });

    await waitFor(() => {
      expect(screen.getByText(/microsoft/i)).toBeInTheDocument();
    }, { timeout: 500 });
  });
});
```

### 5. API Endpoint Tests

```typescript
// __tests__/app/api/stock/profile.test.ts
import { POST } from '@/app/api/stock/profile/route';
import { NextRequest } from 'next/server';

describe('Stock Profile API', () => {
  it('should return stock profile for valid symbol', async () => {
    const req = new NextRequest('http://localhost:3000/api/stock/profile', {
      method: 'POST',
      body: JSON.stringify({ symbol: 'AAPL' }),
    });

    const response = await POST(req);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('name');
    expect(data).toHaveProperty('exchange');
  });

  it('should return 400 for invalid symbol', async () => {
    const req = new NextRequest('http://localhost:3000/api/stock/profile', {
      method: 'POST',
      body: JSON.stringify({ symbol: 'INVALID_SYMBOL_TOO_LONG' }),
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
  });

  it('should reject missing symbol', async () => {
    const req = new NextRequest('http://localhost:3000/api/stock/profile', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
  });
});
```

## Test Setup Instructions

### 1. Install Testing Dependencies

```bash
npm install --save-dev \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  vitest \
  @vitest/ui \
  jsdom \
  @types/jest
```

### 2. Update jest.config.js

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom', // For component tests
  roots: ['<rootDir>'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    'hooks/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      statements: 70,
      branches: 70,
      functions: 70,
      lines: 70,
    },
  },
};
```

### 3. Create jest.setup.ts

```typescript
import '@testing-library/jest-dom';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return '';
  },
}));

// Mock next/headers
jest.mock('next/headers', () => ({
  headers: async () => new Map(),
}));
```

### 4. Update package.json scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ui": "vitest --ui"
  }
}
```

## Test Coverage Goals

| Module | Current | Target | Priority |
|--------|---------|--------|----------|
| lib/actions | 0% | 85% | Critical |
| lib/utils | 0% | 90% | High |
| components | 0% | 70% | High |
| app/api | 0% | 80% | Critical |
| database | 40% | 90% | Medium |
| hooks | 0% | 80% | Medium |

## Mocking Strategy

### Mock Finnhub API
```typescript
jest.mock('@/lib/actions/finnhub.actions', () => ({
  getStockProfile2: jest.fn(async (symbol) => ({
    name: 'Test Company',
    exchange: 'NASDAQ',
  })),
  getNews: jest.fn(async () => []),
  searchStocks: jest.fn(async () => []),
}));
```

### Mock Database
```typescript
jest.mock('@/database/mongoose', () => ({
  connectToDatabase: jest.fn(async () => ({
    connection: { db: mockDB },
  })),
}));
```

### Mock Authentication
```typescript
jest.mock('@/lib/better-auth/auth', () => ({
  auth: {
    api: {
      getSession: jest.fn(),
      signUpEmail: jest.fn(),
      signInEmail: jest.fn(),
    },
  },
}));
```

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - run: npm ci
      - run: npm run test:coverage
      - run: npm run lint
      
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

## Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch

# Run specific test file
npm test -- auth.actions.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="should add stock"
```

## Next Steps

1. **Week 1**: Set up testing infrastructure and add server action tests
2. **Week 2**: Add API endpoint tests and component tests
3. **Week 3**: Add integration tests and improve coverage
4. **Week 4+**: Maintain >70% coverage threshold
