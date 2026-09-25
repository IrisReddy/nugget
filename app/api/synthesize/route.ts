import { NextRequest, NextResponse } from 'next/server';
import { synthesizeArticleToNugget } from '@/lib/ai';
import { IngestedArticle } from '@/lib/news';

export async function POST(request: NextRequest) {
  try {
    const article: IngestedArticle = await request.json();

    if (!article || !article.title || !article.summary) {
      return NextResponse.json(
        { success: false, error: 'Article payload missing required fields.' },
        { status: 400 }
      );
    }

    const nugget = await synthesizeArticleToNugget(article);

    return NextResponse.json({
      success: true,
      nugget,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Synthesis pipeline failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
