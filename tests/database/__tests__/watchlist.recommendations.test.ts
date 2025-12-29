jest.mock('../../../lib/recommendations', () => ({
  clearRecommendationsCacheForUser: jest.fn(),
}));

jest.mock('../../../database/mongoose', () => ({
  connectToDatabase: jest.fn(async () => ({ connection: { db: {} } })),
}));

jest.mock('../../../database/models/watchlist.model', () => ({
  Watchlist: {
    findOne: jest.fn(async () => null),
    create: jest.fn(async () => ({})),
    deleteOne: jest.fn(async () => ({ deletedCount: 1 })),
  },
}));

jest.mock('../../../lib/better-auth/auth', () => ({
  auth: {
    api: {
      getSession: jest.fn(async () => ({ user: { id: 'uid', email: 'u@e.com' } })),
    },
  },
}));

const { clearRecommendationsCacheForUser } = require('../../../lib/recommendations');
const { addToWatchlist, removeFromWatchlist } = require('../../../lib/actions/watchlist.actions');

describe('watchlist recommendation cache hooks', () => {
  afterEach(() => jest.clearAllMocks());

  test('addToWatchlist calls clearRecommendationsCacheForUser', async () => {
    const res = await addToWatchlist('TEST', 'Test Company');
    expect(res.success).toBe(true);
    expect(clearRecommendationsCacheForUser).toHaveBeenCalledWith('u@e.com');
  });

  test('removeFromWatchlist calls clearRecommendationsCacheForUser', async () => {
    const res = await removeFromWatchlist('TEST');
    expect(res.success).toBe(true);
    expect(clearRecommendationsCacheForUser).toHaveBeenCalledWith('u@e.com');
  });
});