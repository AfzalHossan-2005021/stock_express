import { POST, GET, DELETE } from '../../app/api/stock/activity/route';

jest.mock('../../lib/better-auth/auth', () => ({
  auth: {
    api: {
      getSession: jest.fn(),
    },
  },
}));

jest.mock('../../database/mongoose', () => ({
  connectToDatabase: jest.fn(async () => ({ connection: { db: {} } })),
}));

jest.mock('../../database/models/user_activity.model', () => ({
  UserActivity: {
    create: jest.fn(async (doc: any) => ({ _id: 'newid', ...doc })),
    find: jest.fn(() => ({
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn(async () => [{ type: 'view', symbol: 'AAPL' }]),
    })),
    findOne: jest.fn(async (q: any) => ({ _id: q._id || 'a1', userId: 'u1' })),
    deleteOne: jest.fn(async (q: any) => ({ deletedCount: 1 })),
  },
}));

const { auth } = require('../../lib/better-auth/auth');
const { UserActivity } = require('../../database/models/user_activity.model');

describe('activity API', () => {
  afterEach(() => jest.clearAllMocks());

  test('POST records activity for authenticated user', async () => {
    (auth.api.getSession as jest.Mock).mockResolvedValue({ user: { id: 'u1', email: 'u@e.com' } });
    const req = new Request('http://localhost/api/stock/activity', {
      method: 'POST',
      body: JSON.stringify({ type: 'view', symbol: 'AAPL' }),
      headers: { 'Content-Type': 'application/json' },
    } as any);

    const res = await POST(req as any);
    const json = await res.json();
    expect(res.status).toBe(201);
    expect(json).toHaveProperty('success', true);
    expect(UserActivity.create).toHaveBeenCalled();
  });

  test('POST records activity for anonymous user with anonymousId', async () => {
    (auth.api.getSession as jest.Mock).mockResolvedValue(null);
    const req = new Request('http://localhost/api/stock/activity', {
      method: 'POST',
      body: JSON.stringify({ type: 'impression', symbol: 'TSLA', anonymousId: 'anon-123' }),
      headers: { 'Content-Type': 'application/json' },
    } as any);

    const res = await POST(req as any);
    const json = await res.json();
    expect(res.status).toBe(201);
    expect(json).toHaveProperty('success', true);
  });

  test('POST records search activity', async () => {
    (auth.api.getSession as jest.Mock).mockResolvedValue({ user: { id: 'u1', email: 'u@e.com' } });
    const req = new Request('http://localhost/api/stock/activity', {
      method: 'POST',
      body: JSON.stringify({ type: 'search', meta: { query: 'AAPL' } }),
      headers: { 'Content-Type': 'application/json' },
    } as any);

    const res = await POST(req as any);
    const json = await res.json();
    expect(res.status).toBe(201);
    expect(json).toHaveProperty('success', true);
    expect(UserActivity.create).toHaveBeenCalled();
  });

  test('POST rejects invalid activity type', async () => {
    (auth.api.getSession as jest.Mock).mockResolvedValue({ user: { id: 'u1' } });
    const req = new Request('http://localhost/api/stock/activity', {
      method: 'POST',
      body: JSON.stringify({ type: 'invalid' }),
      headers: { 'Content-Type': 'application/json' },
    } as any);

    const res = await POST(req as any);
    expect(res.status).toBe(400);
  });

  test('GET returns personal activity for authenticated user', async () => {
    (auth.api.getSession as jest.Mock).mockResolvedValue({ user: { id: 'u1' } });
    const req = new Request('http://localhost/api/stock/activity?limit=5');
    const res = await GET(req as any);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(Array.isArray(json.data)).toBe(true);
    expect(UserActivity.find).toHaveBeenCalled();
  });

  test('DELETE removes an activity owned by the user', async () => {
    (auth.api.getSession as jest.Mock).mockResolvedValue({ user: { id: 'u1' } });
    const fakeDoc = { _id: 'a1', userId: 'u1' };
    UserActivity.findOne = jest.fn().mockResolvedValue(fakeDoc);
    UserActivity.deleteOne = jest.fn().mockResolvedValue({ deletedCount: 1 });

    const req = new Request('http://localhost/api/stock/activity?id=a1', { method: 'DELETE' } as any);
    const res = await DELETE(req as any);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json).toHaveProperty('success', true);
    expect(UserActivity.deleteOne).toHaveBeenCalledWith({ _id: 'a1' });
  });

  test('DELETE forbids removing another user\'s activity', async () => {
    (auth.api.getSession as jest.Mock).mockResolvedValue({ user: { id: 'u1' } });
    const fakeDoc = { _id: 'a2', userId: 'other' };
    UserActivity.findOne = jest.fn().mockResolvedValue(fakeDoc);

    const req = new Request('http://localhost/api/stock/activity?id=a2', { method: 'DELETE' } as any);
    const res = await DELETE(req as any);
    const json = await res.json();
    expect(res.status).toBe(403);
    expect(json).toHaveProperty('error', 'Forbidden');
  });

  test('DELETE returns 400 for missing id', async () => {
    (auth.api.getSession as jest.Mock).mockResolvedValue({ user: { id: 'u1' } });
    const req = new Request('http://localhost/api/stock/activity', { method: 'DELETE' } as any);
    const res = await DELETE(req as any);
    expect(res.status).toBe(400);
  });
});
