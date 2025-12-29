'use client';

import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

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
  const [activityToDelete, setActivityToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDeleteClick = (id: string) => {
    setActivityToDelete(id);
  };

  const confirmDelete = async () => {
    if (!activityToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch('/api/stock/activity?id=' + encodeURIComponent(activityToDelete), {
        method: 'DELETE',
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error || 'Delete failed');
      }
      setItems((prev) => prev.filter((i) => i._id !== activityToDelete));
      toast.success('Activity deleted');
      setActivityToDelete(null);
    } catch (err) {
      console.error('Delete activity failed', err);
      toast.error('Failed to delete activity');
    } finally {
      setIsDeleting(false);
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
                      onClick={() => handleDeleteClick(item._id)}
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

      <Dialog open={!!activityToDelete} onOpenChange={(open) => !open && setActivityToDelete(null)}>
        <DialogContent className="border-gray-700 bg-gray-900 sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-gray-100">Delete Activity</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to delete this activity? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => setActivityToDelete(null)}
              className="text-gray-400 border-gray-600 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
