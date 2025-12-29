import { recordActivity } from '@/lib/actions/activity.actions';

describe('recordActivity', () => {
  beforeEach(() => {
    (global as any).fetch = jest.fn(() => Promise.resolve({ ok: true })) as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('sends POST to activity endpoint', async () => {
    await recordActivity({ type: 'impression', symbol: 'AAPL', meta: { source: 'test' } });
    expect((global as any).fetch).toHaveBeenCalledTimes(1);
    const [url, opts] = (global as any).fetch.mock.calls[0];
    expect(url).toBe('/api/stock/activity');
    expect(opts.method).toBe('POST');
    const body = JSON.parse(opts.body);
    expect(body.type).toBe('impression');
    expect(body.symbol).toBe('AAPL');
    expect(body.meta).toEqual({ source: 'test' });
  });
});