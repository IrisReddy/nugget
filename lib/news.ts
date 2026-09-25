import Parser from 'rss-parser';
import { supabase } from './supabase';

const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'NUGGET-Intelligence/1.0 (+https://nugget.app)',
  },
});

export interface IngestedArticle {
  title: string;
  url: string;
  sourceName: string;
  sourceUrl: string;
  summary: string;
  publishedAt: string;
  category: string;
}

// Curated high-credibility feeds for NUGGET's 10 categories
export const CATEGORY_FEEDS: Record<string, { name: string; url: string; domain: string }[]> = {
  Technology: [
    { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index', domain: 'arstechnica.com' },
    { name: 'Wired Tech', url: 'https://www.wired.com/feed/category/gear/latest/rss', domain: 'wired.com' },
  ],
  Science: [
    { name: 'Phys.org', url: 'https://phys.org/rss-feed/', domain: 'phys.org' },
    { name: 'ScienceDaily', url: 'https://www.sciencedaily.com/rss/top/science.xml', domain: 'sciencedaily.com' },
  ],
  Business: [
    { name: 'BBC Business', url: 'https://feeds.bbci.co.uk/news/business/rss.xml', domain: 'bbc.com' },
    { name: 'CNBC Top Stories', url: 'https://search.cnbc.com/rs/search/view.html?partnerId=2000&keywords=business&sort=date', domain: 'cnbc.com' },
  ],
  World: [
    { name: 'BBC World News', url: 'https://feeds.bbci.co.uk/news/world/rss.xml', domain: 'bbc.com' },
    { name: 'NPR World News', url: 'https://feeds.npr.org/1004/rss.xml', domain: 'npr.org' },
  ],
  Politics: [
    { name: 'NPR Politics', url: 'https://feeds.npr.org/1014/rss.xml', domain: 'npr.org' },
    { name: 'Politico', url: 'https://rss.politico.com/politics-news.xml', domain: 'politico.com' },
  ],
  Health: [
    { name: 'Medical News Today', url: 'https://www.medicalnewstoday.com/feed', domain: 'medicalnewstoday.com' },
    { name: 'ScienceDaily Health', url: 'https://www.sciencedaily.com/rss/health_medicine.xml', domain: 'sciencedaily.com' },
  ],
  Finance: [
    { name: 'MarketWatch', url: 'https://feeds.content.dowjones.io/public/rss/mw_topstories', domain: 'marketwatch.com' },
  ],
  Sports: [
    { name: 'BBC Sport', url: 'https://feeds.bbci.co.uk/sport/rss.xml', domain: 'bbc.com' },
  ],
  Entertainment: [
    { name: 'Variety', url: 'https://variety.com/feed/', domain: 'variety.com' },
  ],
  History: [
    { name: 'Smithsonian Magazine History', url: 'https://www.smithsonianmag.com/rss/history/', domain: 'smithsonianmag.com' },
  ],
};

/**
 * Fetches recent articles from curated feeds for a specific category
 */
export async function fetchNewsForCategory(categoryName: string, maxItemsPerFeed = 5): Promise<IngestedArticle[]> {
  const feeds = CATEGORY_FEEDS[categoryName] || [];
  const results: IngestedArticle[] = [];

  for (const feed of feeds) {
    try {
      const parsed = await parser.parseURL(feed.url);
      const items = (parsed.items || []).slice(0, maxItemsPerFeed);

      for (const item of items) {
        if (!item.title || !item.link) continue;

        // Clean up summary string (strip HTML tags)
        const rawContent = item.contentSnippet || item.content || item.summary || '';
        const cleanSummary = rawContent.replace(/<[^>]*>?/gm, '').trim();

        results.push({
          title: item.title.trim(),
          url: item.link.trim(),
          sourceName: feed.name,
          sourceUrl: `https://${feed.domain}`,
          summary: cleanSummary.slice(0, 500),
          publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
          category: categoryName,
        });
      }
    } catch (err: unknown) {
      console.warn(`[NEWS_INGEST] Warning: Failed to fetch feed ${feed.name}:`, err instanceof Error ? err.message : err);
    }
  }

  return results;
}

/**
 * Ingests external news articles into Supabase tables: sources, articles, topics
 */
export async function ingestNewsToSupabase(categoryName: string, categoryId?: string) {
  const articles = await fetchNewsForCategory(categoryName, 4);

  if (!articles.length) {
    return { success: false, message: 'No articles retrieved from feeds.', count: 0 };
  }

  let insertedCount = 0;

  for (const art of articles) {
    try {
      // 1. Ensure source exists in `sources` table
      let sourceId: string | null = null;
      const { data: existingSource } = await supabase
        .from('sources')
        .select('id')
        .eq('name', art.sourceName)
        .maybeSingle();

      if (existingSource) {
        sourceId = existingSource.id;
      } else {
        const { data: newSource, error: sourceErr } = await supabase
          .from('sources')
          .insert({
            name: art.sourceName,
            url: art.sourceUrl,
          })
          .select('id')
          .single();

        if (!sourceErr && newSource) {
          sourceId = newSource.id;
        }
      }

      // 2. Insert or update article in `articles` table
      const { error: artErr } = await supabase
        .from('articles')
        .upsert(
          {
            title: art.title,
            url: art.url,
            summary: art.summary,
            source_id: sourceId,
            published_at: art.publishedAt,
            ...(categoryId ? { category_id: categoryId } : {}),
          },
          { onConflict: 'url' }
        );

      if (!artErr) {
        insertedCount++;
      }
    } catch (err: unknown) {
      console.error(`[NEWS_INGEST] Error storing article:`, err);
    }
  }

  return {
    success: true,
    message: `Ingested ${insertedCount} articles for ${categoryName}`,
    count: insertedCount,
  };
}
