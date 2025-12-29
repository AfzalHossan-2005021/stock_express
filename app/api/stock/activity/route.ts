import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '../../../../lib/better-auth/auth';
import { connectToDatabase } from '../../../../database/mongoose';
import { UserActivity } from '../../../../database/models/user_activity.model';

type ActivityType = 'view' | 'search' | 'click' | 'impression';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { type, symbol, meta, anonymousId } = body as {
      type?: ActivityType;
      symbol?: string;
      meta?: Record<string, unknown>;
      anonymousId?: string;
    };

    if (!type || !['view', 'search', 'click', 'impression'].includes(type)) {
      return NextResponse.json({ error: 'Invalid activity type' }, { status: 400 });
    }

    // Determine user identity if available
    let session: any = null;
    try {
      // Pass the current request headers to the auth library so it can read cookies
      session = await auth.api.getSession({ headers: request.headers });
    } catch (e) {
      // Fallback: try without headers (tests/background jobs)
      session = await auth.api.getSession().catch(() => null);
    }

    const userId = session?.user?.id ?? null;

    if (!userId && !anonymousId) {
      return NextResponse.json({ error: 'Not authenticated; provide anonymousId for unauthenticated events' }, { status: 401 });
    }

    const mongoose = await connectToDatabase();
    if (!mongoose?.connection?.db) {
      throw new Error('MongoDB connection not found');
    }

    const doc = await UserActivity.create({
      userId: userId || null,
      anonymousId: userId ? undefined : anonymousId || null,
      type,
      symbol: symbol ? String(symbol).toUpperCase().trim() : undefined,
      meta: meta || undefined,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true, id: String(doc._id) }, { status: 201 });
  } catch (err: any) {
    console.error('activity POST error:', err);
    return NextResponse.json({ error: 'Failed to record activity' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const limit = Math.max(1, Math.min(200, Number(url.searchParams.get('limit') || '20')));

    // Must be authenticated to read personal activity
    let session: any = null;
    try {
      session = await auth.api.getSession({ headers: request.headers });
    } catch (e) {
      session = await auth.api.getSession().catch(() => null);
    }

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const mongoose = await connectToDatabase();
    if (!mongoose?.connection?.db) {
      throw new Error('MongoDB connection not found');
    }

    const items = await UserActivity.find({ userId: session.user.id }).sort({ createdAt: -1 }).limit(limit).lean();

    return NextResponse.json({ data: items });
  } catch (err: any) {
    console.error('activity GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    // Accept id as query param or in json body
    const url = new URL(request.url);
    const idFromQuery = url.searchParams.get('id');
    const body = await request.json().catch(() => ({}));
    const id = idFromQuery || (body && body.id);

    if (!id) {
      return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
    }

    // Auth required
    let session: any = null;
    try {
      session = await auth.api.getSession({ headers: request.headers });
    } catch (e) {
      session = await auth.api.getSession().catch(() => null);
    }

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const mongoose = await connectToDatabase();
    if (!mongoose?.connection?.db) {
      throw new Error('MongoDB connection not found');
    }

    // Ensure the activity belongs to the user
    const maybeDoc = await UserActivity.findOne({ _id: id });
    const doc = maybeDoc && typeof (maybeDoc as any).lean === 'function' ? await (maybeDoc as any).lean() : maybeDoc;
    if (!doc) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (String(doc.userId) !== String(session.user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await UserActivity.deleteOne({ _id: id });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('activity DELETE error:', err);
    return NextResponse.json({ error: 'Failed to delete activity' }, { status: 500 });
  }
}
