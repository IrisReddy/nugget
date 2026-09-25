import { supabase } from '@/lib/supabase';
import { IngestedArticle } from '@/lib/news';

const LOCAL_STORAGE_KEY = 'nugget_saved_articles';

export interface BookmarkedArticle extends IngestedArticle {
  savedAt: string;
}

/**
 * Get all bookmarked articles for the current session.
 * Reads from localStorage cache and reconciles with Supabase if logged in.
 */
export async function getBookmarkedArticles(userId?: string | null): Promise<BookmarkedArticle[]> {
  let localBookmarks: BookmarkedArticle[] = [];
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        localBookmarks = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to parse local bookmarks:', e);
    }
  }

  if (!userId) {
    return localBookmarks;
  }

  // Attempt to fetch from Supabase bookmarks table if user is logged in
  try {
    const { data, error } = await supabase
      .from('bookmarks')
      .select('article_url, title, summary, source_name, category, published_at, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      const remoteBookmarks: BookmarkedArticle[] = data.map((b) => ({
        url: b.article_url,
        title: b.title,
        summary: b.summary || '',
        sourceName: b.source_name || 'Verified Source',
        sourceUrl: b.article_url,
        category: b.category || 'General',
        publishedAt: b.published_at || b.created_at,
        savedAt: b.created_at,
      }));

      // Merge and deduplicate by URL
      const map = new Map<string, BookmarkedArticle>();
      for (const b of [...remoteBookmarks, ...localBookmarks]) {
        map.set(b.url, b);
      }
      const merged = Array.from(map.values());
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
      }
      return merged;
    }
  } catch (err) {
    // If Supabase table is not yet provisioned, seamlessly use localStorage cache
    console.debug('Supabase bookmarks query error, using local cache:', err);
  }

  return localBookmarks;
}

/**
 * Check if a specific article URL is bookmarked.
 */
export function isArticleBookmarked(url: string, bookmarks: BookmarkedArticle[]): boolean {
  return bookmarks.some((b) => b.url === url);
}

/**
 * Save an article to bookmarks.
 */
export async function saveArticle(article: IngestedArticle, userId?: string | null): Promise<BookmarkedArticle[]> {
  const newBookmark: BookmarkedArticle = {
    ...article,
    savedAt: new Date().toISOString(),
  };

  let updatedList: BookmarkedArticle[] = [];

  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      const currentList: BookmarkedArticle[] = stored ? JSON.parse(stored) : [];
      if (!currentList.some((b) => b.url === article.url)) {
        updatedList = [newBookmark, ...currentList];
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedList));
      } else {
        updatedList = currentList;
      }
    } catch {
      updatedList = [newBookmark];
    }
  }

  if (userId) {
    try {
      await supabase.from('bookmarks').upsert({
        user_id: userId,
        article_url: article.url,
        title: article.title,
        summary: article.summary,
        source_name: article.sourceName,
        category: article.category,
        published_at: article.publishedAt,
        created_at: newBookmark.savedAt,
      });
    } catch (err) {
      console.debug('Failed to sync bookmark to Supabase:', err);
    }
  }

  return updatedList;
}

/**
 * Remove an article from bookmarks.
 */
export async function removeArticle(url: string, userId?: string | null): Promise<BookmarkedArticle[]> {
  let updatedList: BookmarkedArticle[] = [];

  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const currentList: BookmarkedArticle[] = JSON.parse(stored);
        updatedList = currentList.filter((b) => b.url !== url);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedList));
      }
    } catch {
      updatedList = [];
    }
  }

  if (userId) {
    try {
      await supabase.from('bookmarks').delete().eq('user_id', userId).eq('article_url', url);
    } catch (err) {
      console.debug('Failed to remove bookmark from Supabase:', err);
    }
  }

  return updatedList;
}
