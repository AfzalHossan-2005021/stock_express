import { GET } from '../../app/api/stock/recommendations/route';

jest.mock('../../lib/actions/watchlist.actions', () => ({
  getWatchlistSymbolsByEmail: jest.fn(async (email: string) => ['AAPL']),
}));

jest.mock('../../lib/better-auth/auth', () => ({
  auth: {
    api: {
      getSession: jest.fn(async (opts: any) => ({ user: { email: 'test@example.com' } })),
    },
  },
}));

describe('recommendations API', () => {
  afterEach(() => jest.clearAllMocks());

  test('GET returns personalized recommendations for authenticated user', async () => {
    const req = new Request('http://localhost/api/stock/recommendations?limit=5');
    const res = await GET(req as any);
    const json = await res.json();
    expect(json).toHaveProperty('data');
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.data.length).toBeLessThanOrEqual(5);
  });

  test('GET popular type returns popular recommendations', async () => {
    const req = new Request('http://localhost/api/stock/recommendations?type=popular&limit=3');
    const res = await GET(req as any);
    const json = await res.json();
    expect(json).toHaveProperty('data');
    expect(json.data.length).toBe(3);
  });
});