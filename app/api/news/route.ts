import { NextRequest, NextResponse } from 'next/server';
import { fetchNewsForCategory, fetchNewsForCategories, ingestNewsToSupabase } from '@/lib/news';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const categoriesParam = searchParams.get('categories');
  const singleCategory = searchParams.get('category');

  try {
    let articles;
    if (categoriesParam) {
      const catList = categoriesParam.split(',').map((c) => c.trim()).filter(Boolean);
      articles = await fetchNewsForCategories(catList, 3);
    } else {
      const category = singleCategory || 'Technology';
      articles = await fetchNewsForCategory(category, 6);
    }

    return NextResponse.json({
      success: true,
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
