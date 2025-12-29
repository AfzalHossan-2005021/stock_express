'use client';

export type ActivityPayload = {
  type: 'view' | 'search' | 'click' | 'impression';
  symbol?: string;
  meta?: Record<string, unknown>;
  anonymousId?: string; // for unauthenticated users
};

export async function recordActivity(payload: ActivityPayload) {
  try {
    await fetch('/api/stock/activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    // Non-fatal: don't throw on client-side logging best-effort
    console.warn('recordActivity failed', err);
  }
}

// Server-side helper: import from server code
export async function getRecentActivitiesByUserId(userId: string, days = 30, limit = 50) {
  // This function is intended for server-side use only.
  const mongoose = await import('../../database/mongoose').then((m) => m.connectToDatabase());
  const { UserActivity } = await import('../../database/models/user_activity.model');

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const results = await UserActivity.find({ userId, createdAt: { $gte: since }, type: { $in: ['view', 'click', 'search', 'impression'] } })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  return results as Array<any>;
}
