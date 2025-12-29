import { NextResponse } from 'next/server';
import { getPersonalizedRecommendations, getPopularRecommendations } from '../../../../lib/recommendations';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const limitParam = url.searchParams.get('limit');
    const type = url.searchParams.get('type');

    const limit = Math.max(1, Math.min(50, Number(limitParam || '10')));

    if (type === 'popular') {
      const results = await getPopularRecommendations(limit);
      return NextResponse.json({ data: results });
    }

    // Default: try personalized; fallback to popular inside function
    const results = await getPersonalizedRecommendations(limit);
    return NextResponse.json({ data: results });
  } catch (err: any) {
    console.error('recommendations GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch recommendations' }, { status: 500 });
  }
}
