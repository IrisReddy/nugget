import { NextRequest, NextResponse } from 'next/server';
import { fetchNewsForCategory, ingestNewsToSupabase } from '@/lib/news';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || 'Technology';

  try {
    const articles = await fetchNewsForCategory(category, 6);
    return NextResponse.json({
      success: true,
      category,
      count: articles.length,
      articles,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch news feed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const category = body.category || 'Technology';
    const categoryId = body.categoryId;

    const result = await ingestNewsToSupabase(category, categoryId);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to ingest news';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
