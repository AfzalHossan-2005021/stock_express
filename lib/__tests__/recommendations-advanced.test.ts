import { getPersonalizedRecommendations } from '@/lib/recommendations';

jest.mock('@/lib/actions/watchlist.actions', () => ({
  getWatchlistSymbolsByEmail: jest.fn(async () => []),
}));

jest.mock('@/lib/better-auth/auth', () => ({
  auth: {
    api: {
      getSession: jest.fn(),
    },
  },
}));

// Mock the activity helper imported dynamically in recommendations
jest.mock('@/lib/actions/activity.actions', () => ({
  getRecentActivitiesByUserId: jest.fn(async (userId: string) => [
    { symbol: 'TSLA' },
    { symbol: 'AAPL' },
  ]),
}));

const { auth } = require('@/lib/better-auth/auth');
const { getRecentActivitiesByUserId } = require('@/lib/actions/activity.actions');

describe('recommendations advanced signals', () => {
  afterEach(() => jest.clearAllMocks());

  test('recent views boost results', async () => {
    (auth.api.getSession as jest.Mock).mockResolvedValue({ user: { id: 'u1', email: 'u@e.com' } });

    const res = await getPersonalizedRecommendations(10);
    // ensure recent symbols appear in top results
    const symbols = res.map((r) => r.symbol);
    expect(symbols).toContain('TSLA');
    expect(symbols).toContain('AAPL');
    // verify the activity helper was called with the user id
    expect(getRecentActivitiesByUserId).toHaveBeenCalledWith('u1', 30, 100);
  });
});
