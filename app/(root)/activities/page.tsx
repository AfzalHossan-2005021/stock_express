'use client';

import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

type Activity = {
  _id: string;
  userId?: string | null;
  anonymousId?: string | null;
  type: 'view' | 'search' | 'click' | 'impression';
  symbol?: string | null;
  meta?: Record<string, unknown>;
  createdAt: string;
};

export default function ActivitiesPage() {
  const [items, setItems] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/stock/activity?limit=100');
      if (!res.ok) {
        if (res.status === 401) {
          setError('Please sign in to view your recent activities');
          return;
        }
        throw new Error('Failed to fetch');
      }
      const json = await res.json();
      setItems(json?.data || []);
      setError(null);
    } catch (e) {
      console.error('Failed to load activities', e);
      setError('Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this activity? This cannot be undone.')) return;
    try {
      const res = await fetch('/api/stock/activity?id=' + encodeURIComponent(id), {
        method: 'DELETE',
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error || 'Delete failed');
      }
      setItems((prev) => prev.filter((i) => i._id !== id));
      toast.success('Activity deleted');
    } catch (err) {
      console.error('Delete activity failed', err);
      toast.error('Failed to delete activity');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading recent activities...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-red-500">{error}</p>
        {error.toLowerCase().includes('sign in') && (
          <Link href="/sign-in" className="yellow-btn px-4 py-2 rounded">Sign in</Link>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-100 mb-1">Recent Activities</h1>
        <p className="text-gray-400">Your recent stock views, searches, clicks, and impressions</p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-700">
        <table className="w-full">
          <thead className="bg-gray-800 border-b border-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Type</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Symbol</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Info</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Time</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-300">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {items.map((item) => (
              <tr key={item._id} className="hover:bg-gray-800/50 transition-colors">
                <td className="px-6 py-4 text-gray-300 font-medium">{item.type}</td>
                <td className="px-6 py-4">
                  {item.symbol ? (
                    <Link href={`/stocks/${item.symbol}`}>
                      <span className="text-yellow-500 hover:text-yellow-400">{item.symbol}</span>
                    </Link>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="px-6 py-4 text-gray-400 text-sm">{item.meta ? JSON.stringify(item.meta) : '—'}</td>
                <td className="px-6 py-4 text-gray-400 text-sm">{new Date(item.createdAt).toLocaleString()}</td>
                <td className="px-6 py-4">
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => handleDelete(item._id)}
                      className="p-2 text-red-500 hover:bg-red-500/10 rounded transition-colors"
                      title="Delete activity"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-sm text-gray-400 mt-4">Total activities: <span className="font-semibold text-gray-300">{items.length}</span></div>
    </div>
  );
}
