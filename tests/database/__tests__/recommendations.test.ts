import { getPopularRecommendations, getPersonalizedRecommendations } from '../../lib/recommendations';
import { POPULAR_STOCK_SYMBOLS } from '../../lib/constants';

jest.mock('../../lib/actions/watchlist.actions', () => ({
  getWatchlistSymbolsByEmail: jest.fn(async (email: string) => []),
}));

jest.mock('../../lib/better-auth/auth', () => ({
  auth: {
    api: {
      getSession: jest.fn(),
    },
  },
}));

const { auth } = require('../../lib/better-auth/auth');
const { getWatchlistSymbolsByEmail } = require('../../lib/actions/watchlist.actions');

describe('recommendations', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('getPopularRecommendations returns requested number and top symbol', async () => {
    const res = await getPopularRecommendations(5);
    expect(Array.isArray(res)).toBe(true);
    expect(res).toHaveLength(5);
    expect(res[0].symbol).toBe(POPULAR_STOCK_SYMBOLS[0]);
    // scores should be in descending order
    for (let i = 1; i < res.length; i++) {
      expect(res[i - 1].score).toBeGreaterThanOrEqual(res[i].score);
    }
  });

  test('getPersonalized returns popular when unauthenticated', async () => {
    (auth.api.getSession as jest.Mock).mockResolvedValue(null);
    const res = await getPersonalizedRecommendations(5);
    const popular = await getPopularRecommendations(5);
    expect(res).toEqual(popular);
  });

  test('getPersonalized excludes watchlist symbols', async () => {
    (auth.api.getSession as jest.Mock).mockResolvedValue({ user: { email: 'test@example.com' } });
    (getWatchlistSymbolsByEmail as jest.Mock).mockResolvedValue(['AAPL', 'MSFT']);

    const res = await getPersonalizedRecommendations(10);
    const returnedSymbols = res.map((r) => r.symbol);
    expect(returnedSymbols).not.toContain('AAPL');
    expect(returnedSymbols).not.toContain('MSFT');
  });
});
