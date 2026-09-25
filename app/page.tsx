'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import { User } from '@supabase/supabase-js';
import { IngestedArticle } from '@/lib/news';
import NuggetReaderModal from '@/components/NuggetReaderModal';
import AchievementsModal from '@/components/AchievementsModal';
import { calculateLevel } from '@/lib/xp';
import {
  getBookmarkedArticles,
  isArticleBookmarked,
  saveArticle,
  removeArticle,
  BookmarkedArticle
} from '@/lib/bookmarks';
import {
  Flame,
  Award,
  BookOpen,
  Compass,
  CheckCircle2,
  Newspaper,
  ShieldCheck,
  Clock,
  FileCheck2,
  ExternalLink,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Bookmark,
  Star
} from 'lucide-react';

interface UserCategoryItem {
  category_id: string;
  interest_level?: number;
  categories: { name: string } | null;
}

function HomePageContent() {
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<{
    display_name?: string;
    total_xp?: number;
    current_streak?: number;
    longest_streak?: number;
    last_read_date?: string | null;
  } | null>(null);
  const [showAchievements, setShowAchievements] = useState(false);
  const [userCategories, setUserCategories] = useState<UserCategoryItem[]>([]);
  const [articles, setArticles] = useState<IngestedArticle[]>([]);
  const [bookmarkedArticles, setBookmarkedArticles] = useState<BookmarkedArticle[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const [selectedArticle, setSelectedArticle] = useState<IngestedArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingArticles, setLoadingArticles] = useState(false);

  // Sync initial query parameter if filter is provided (e.g. ?filter=SAVED)
  useEffect(() => {
    const initialFilter = searchParams.get('filter');
    if (initialFilter && initialFilter.toUpperCase() === 'SAVED') {
      setSelectedFilter('SAVED');
    }
  }, [searchParams]);

  const handleReadingComplete = (newTotalXp?: number, newStreak?: number) => {
    const today = new Date().toISOString().split('T')[0];
    if (newTotalXp !== undefined) {
      setProfile((prev) => (prev ? {
        ...prev,
        total_xp: newTotalXp,
        current_streak: newStreak !== undefined ? newStreak : Math.max(1, prev.current_streak || 1),
        last_read_date: today,
      } : null));
    }
  };

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      // Load bookmarks
      const saved = await getBookmarkedArticles(user?.id);
      setBookmarkedArticles(saved);

      if (user) {
        const { data: profData } = await supabase
          .from('profiles')
          .select('display_name, total_xp, current_streak, longest_streak, last_read_date')
          .eq('id', user.id)
          .single();

        if (profData) {
          // Fix 0 days streak defense if user has already earned XP
          if ((profData.total_xp || 0) > 0 && (!profData.current_streak || profData.current_streak === 0)) {
            const today = new Date().toISOString().split('T')[0];
            await supabase.from('profiles').update({ current_streak: 1, last_read_date: today }).eq('id', user.id);
            setProfile({ ...profData, current_streak: 1 });
          } else {
            setProfile(profData);
          }
        }

        const { data: catData } = await supabase
          .from('user_categories')
          .select('category_id, interest_level, categories(name)')
          .eq('user_id', user.id);

        if (catData) {
          const typedCats = catData as unknown as UserCategoryItem[];
          setUserCategories(typedCats);
          
          // Fetch live news for user's subscribed categories
          const catNames = typedCats.map((c) => c.categories?.name).filter(Boolean);
          await loadArticles(catNames.length > 0 ? (catNames as string[]) : ['Technology', 'Science', 'World'], typedCats);
        }
      } else {
        // Fallback preview for unauthenticated visitors
        await loadArticles(['Technology', 'Science', 'World'], []);
      }

      setLoading(false);
    }

    loadDashboard();
  }, []);

  async function loadArticles(catNames: string[], categoriesConfig: UserCategoryItem[]) {
    setLoadingArticles(true);
    try {
      const res = await fetch(`/api/news?categories=${encodeURIComponent(catNames.join(','))}`);
      const data = await res.json();
      if (data.success && data.articles) {
        let fetchedArticles: IngestedArticle[] = data.articles;

        // Step 10: Topic Prioritization
        // Find high-priority categories (interest_level === 2)
        const highPriorityNames = new Set(
          categoriesConfig
            .filter((c) => c.interest_level === 2 && c.categories?.name)
            .map((c) => c.categories!.name.toLowerCase())
        );

        if (highPriorityNames.size > 0) {
          // Sort high priority categories to the top of the feed
          fetchedArticles = [...fetchedArticles].sort((a, b) => {
            const aIsHigh = highPriorityNames.has(a.category.toLowerCase()) ? 1 : 0;
            const bIsHigh = highPriorityNames.has(b.category.toLowerCase()) ? 1 : 0;
            return bIsHigh - aIsHigh;
          });
        }

        setArticles(fetchedArticles);
      }
    } catch (err: unknown) {
      console.error('Failed to load articles:', err);
    } finally {
      setLoadingArticles(false);
    }
  }

  const handleRefresh = async () => {
    const catNames = userCategories.map((c) => c.categories?.name).filter(Boolean);
    await loadArticles(catNames.length > 0 ? (catNames as string[]) : ['Technology', 'Science', 'World'], userCategories);
  };

  const handleToggleBookmark = async (article: IngestedArticle) => {
    const isSaved = isArticleBookmarked(article.url, bookmarkedArticles);
    if (isSaved) {
      const updated = await removeArticle(article.url, user?.id);
      setBookmarkedArticles(updated);
    } else {
      const updated = await saveArticle(article, user?.id);
      setBookmarkedArticles(updated);
    }
  };

  const reloadBookmarks = async () => {
    const saved = await getBookmarkedArticles(user?.id);
    setBookmarkedArticles(saved);
  };

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'Learner';

  const streakDisplay = (profile?.current_streak && profile.current_streak > 0)
    ? profile.current_streak
    : ((profile?.total_xp || 0) > 0 ? 1 : 0);

  // Filter selection logic
  const filteredArticles = selectedFilter === 'SAVED'
    ? bookmarkedArticles
    : selectedFilter === 'ALL'
    ? articles
    : articles.filter((a) => a.category.toLowerCase() === selectedFilter.toLowerCase());

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-widest text-stone-500 dark:text-[#8BA3C7] animate-pulse">
            <Sparkles className="h-4 w-4 animate-spin text-amber-500" />
            <span>Loading your daily briefing...</span>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Dossier Header / Hero */}
        <section className="relative rounded-2xl border border-stone-200 dark:border-[#1A3F75] bg-white/95 dark:bg-[#0A1333] p-6 sm:p-9 shadow-xs graph-paper-bg">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 dark:border-[#1A3F75] pb-3 mb-5">
            <span className="font-mono text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              Daily Learning Dossier
            </span>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded uppercase">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Live Feeds Active
              </span>
            </div>
          </div>

          <div className="max-w-2xl">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-stone-900 dark:text-[#D4E4EC] uppercase font-mono">
              {user ? `Greetings, ${displayName}.` : 'Daily Learning Dossier.'}
            </h1>
            <p className="mt-3 text-sm sm:text-base text-stone-600 dark:text-[#8BA3C7] leading-relaxed font-sans">
              What do you want to learn today? Transform noise, breaking curiosity, and disparate publications into
              compact, multi-source verified knowledge without artificial quiz mechanics.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/topics"
                className="inline-flex items-center gap-2 rounded-lg border border-stone-900 dark:border-[#3B628A] bg-stone-900 dark:bg-[#1A3F75] px-4 py-2 font-mono text-xs font-bold text-white shadow-2xs hover:bg-stone-800 dark:hover:bg-[#13264D] transition uppercase tracking-wider"
              >
                <Compass className="h-3.5 w-3.5" />
                <span>Configure Topics</span>
              </Link>
              {!user && (
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 rounded-lg border border-stone-300 dark:border-[#1A3F75] bg-white dark:bg-[#0A1333] px-4 py-2 font-mono text-xs font-semibold text-stone-700 dark:text-[#D4E4EC] hover:bg-stone-50 dark:hover:bg-[#13264D] transition uppercase tracking-wider"
                >
                  Create Account &rarr;
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* Habit & Streak Telemetry Ledger */}
        {(() => {
          const currentTotalXp = profile?.total_xp || 0;
          const levelInfo = calculateLevel(currentTotalXp);
          const todayStr = new Date().toISOString().split('T')[0];
          const isReadToday = profile?.last_read_date === todayStr;
          const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

          return (
            <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Card 1: Habit Streak */}
              <div className="rounded-xl border border-stone-200 dark:border-[#1A3F75] bg-white/95 dark:bg-[#0A1333] p-4 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-stone-600 dark:text-[#8BA3C7] uppercase tracking-wider">
                      Daily Habit Streak
                    </span>
                    <Flame className={`h-4 w-4 ${streakDisplay > 0 ? 'text-orange-500 fill-orange-500/20' : 'text-stone-300 dark:text-stone-600'}`} />
                  </div>

                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="font-mono text-3xl font-extrabold text-stone-900 dark:text-[#D4E4EC] tracking-tight">
                      {streakDisplay}
                    </span>
                    <span className="font-mono text-xs text-stone-600 dark:text-[#8BA3C7] uppercase">Days Active</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 dark:border-[#1A3F75] flex items-center justify-between">
                  {/* 7-Day Matrix */}
                  <div className="flex items-center gap-1.5">
                    {dayLabels.map((day, i) => (
                      <div key={i} className="flex flex-col items-center gap-1">
                        <span className="font-mono text-[9px] text-stone-400 dark:text-[#8BA3C7]">{day}</span>
                        <div
                          className={`h-2.5 w-2.5 rounded-xs border ${
                            i === 6 && isReadToday
                              ? 'border-orange-500 bg-orange-500 shadow-2xs'
                              : i < Math.min(6, streakDisplay)
                              ? 'border-stone-800 dark:border-amber-500 bg-stone-800 dark:bg-amber-500'
                              : 'border-stone-200 dark:border-[#1A3F75] bg-stone-100 dark:bg-[#13264D]'
                          }`}
                        />
                      </div>
                    ))}
                  </div>

                  <span
                    className={`font-mono text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${
                      isReadToday
                        ? 'border-emerald-300 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                        : 'border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                    }`}
                  >
                    {isReadToday ? 'Read Today 🔥' : 'Reading Pending ⏳'}
                  </span>
                </div>
              </div>

              {/* Card 2: Scholar Tier & XP Leveling */}
              <div className="rounded-xl border border-stone-200 dark:border-[#1A3F75] bg-white/95 dark:bg-[#0A1333] p-4 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-stone-600 dark:text-[#8BA3C7] uppercase tracking-wider">
                      Scholar Tier {levelInfo.level}
                    </span>
                    <Award className="h-4 w-4 text-amber-500" />
                  </div>

                  <div className="mt-2">
                    <div className="font-mono text-base font-black text-stone-900 dark:text-[#D4E4EC] uppercase">
                      {levelInfo.title}
                    </div>
                    <div className="flex items-center justify-between font-mono text-[10px] text-stone-500 dark:text-[#8BA3C7] mt-1">
                      <span className="flex items-center gap-1 font-bold text-amber-700 dark:text-amber-400">
                        <Sparkles className="h-3 w-3 text-amber-500" />
                        {currentTotalXp} XP
                      </span>
                      <span>{levelInfo.maxXp} XP Next</span>
                    </div>

                    <div className="h-1.5 w-full bg-stone-200 dark:bg-[#1A3F75] rounded-full overflow-hidden mt-1.5">
                      <div
                        className="h-full bg-amber-500 transition-all duration-500"
                        style={{ width: `${levelInfo.progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-stone-100 dark:border-[#1A3F75] flex items-center justify-between">
                  <button
                    onClick={() => setShowAchievements(true)}
                    className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-200 underline uppercase tracking-wider"
                  >
                    <span>View Badges & Accolades &rarr;</span>
                  </button>
                  <span className="font-mono text-[9px] text-stone-400 dark:text-[#8BA3C7]">
                    +{levelInfo.maxXp - currentTotalXp} XP to Tier {levelInfo.level + 1}
                  </span>
                </div>
              </div>

              {/* Card 3: Active Dispatches */}
              <div className="rounded-xl border border-stone-200 dark:border-[#1A3F75] bg-white/95 dark:bg-[#0A1333] p-4 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-stone-600 dark:text-[#8BA3C7] uppercase tracking-wider">
                      Subscribed Topics
                    </span>
                    <BookOpen className="h-4 w-4 text-blue-500" />
                  </div>

                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="font-mono text-3xl font-extrabold text-stone-900 dark:text-[#D4E4EC] tracking-tight">
                      {userCategories.length}
                    </span>
                    <span className="font-mono text-xs text-stone-600 dark:text-[#8BA3C7] uppercase">Active Topics</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 dark:border-[#1A3F75] flex items-center justify-between">
                  <span className="font-mono text-[10px] text-stone-400 dark:text-[#8BA3C7] uppercase">
                    {articles.length} dispatches in feed
                  </span>
                  <Link
                    href="/topics"
                    className="font-mono text-[10px] font-bold text-stone-700 dark:text-[#D4E4EC] hover:text-stone-950 dark:hover:text-white underline uppercase"
                  >
                    Manage &rarr;
                  </Link>
                </div>
              </div>
            </section>
          );
        })()}

        {/* Selected Interests Pill Bar with Priority Badges */}
        {user && userCategories.length > 0 && (
          <section className="rounded-xl border border-stone-200 dark:border-[#1A3F75] bg-white/90 dark:bg-[#0A1333]/90 p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-3 border-b border-stone-100 dark:border-[#1A3F75] pb-2">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-[#D4E4EC]">
                Active Interests & Priorities
              </span>
              <Link href="/topics" className="font-mono text-xs text-stone-600 dark:text-[#8BA3C7] hover:text-stone-900 dark:hover:text-white underline">
                Edit Priorities &rarr;
              </Link>
            </div>
            <div className="flex flex-wrap gap-2">
              {userCategories.map((item, idx) => {
                const isHigh = item.interest_level === 2;
                return (
                  <span
                    key={idx}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 font-mono text-xs font-medium ${
                      isHigh
                        ? 'border-amber-300 dark:border-amber-500/50 bg-amber-50/80 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300'
                        : 'border-stone-200 dark:border-[#1A3F75] bg-stone-50 dark:bg-[#13264D] text-stone-800 dark:text-[#D4E4EC]'
                    }`}
                  >
                    {isHigh ? (
                      <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                    ) : (
                      <CheckCircle2 className="h-3 w-3 text-stone-500 dark:text-[#8BA3C7]" />
                    )}
                    <span>{item.categories?.name || 'Topic'}</span>
                    {isHigh && <span className="text-[10px] opacity-75">(2x)</span>}
                  </span>
                );
              })}
            </div>
          </section>
        )}

        {/* Live Observation Ledger: Today's Nuggets Feed */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-stone-200 dark:border-[#1A3F75] pb-3">
            <div>
              <h2 className="font-mono text-base font-extrabold text-stone-900 dark:text-[#D4E4EC] uppercase tracking-tight flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                Today&apos;s Verified Nuggets
              </h2>
              <p className="text-xs text-stone-500 dark:text-[#8BA3C7] mt-0.5 font-sans">
                Curated, multi-source verified summaries aligned with your subscribed topics and priority weighting.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                disabled={loadingArticles}
                className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 dark:border-[#1A3F75] bg-white dark:bg-[#0A1333] px-3 py-1 font-mono text-xs text-stone-600 dark:text-[#D4E4EC] hover:bg-stone-50 dark:hover:bg-[#13264D] disabled:opacity-50 transition uppercase tracking-wider"
                title="Sync Feeds"
              >
                <RefreshCw className={`h-3 w-3 ${loadingArticles ? 'animate-spin' : ''}`} />
                <span>Sync</span>
              </button>

              <span className="font-mono text-[10px] text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded uppercase">
                Status: Ingestion Active
              </span>
            </div>
          </div>

          {/* Filter Pills with Saved Tab (Step 10 Personalization) */}
          <div className="flex flex-wrap items-center gap-1.5 pb-1">
            <button
              onClick={() => setSelectedFilter('ALL')}
              className={`rounded-lg px-3 py-1 font-mono text-xs uppercase tracking-wider transition ${
                selectedFilter === 'ALL'
                  ? 'border border-stone-900 dark:border-[#3B628A] bg-stone-900 dark:bg-[#1A3F75] text-white font-bold'
                  : 'border border-stone-200 dark:border-[#1A3F75] bg-white dark:bg-[#0A1333] text-stone-600 dark:text-[#8BA3C7] hover:border-stone-400 dark:hover:border-[#3B628A]'
              }`}
            >
              All ({articles.length})
            </button>

            {/* Saved Tab */}
            <button
              onClick={() => setSelectedFilter('SAVED')}
              className={`inline-flex items-center gap-1 rounded-lg px-3 py-1 font-mono text-xs uppercase tracking-wider transition ${
                selectedFilter === 'SAVED'
                  ? 'border border-amber-600 bg-amber-600 dark:border-amber-500 dark:bg-amber-600 text-white font-bold'
                  : 'border border-stone-200 dark:border-[#1A3F75] bg-white dark:bg-[#0A1333] text-stone-600 dark:text-[#8BA3C7] hover:border-stone-400 dark:hover:border-[#3B628A]'
              }`}
            >
              <Bookmark className={`h-3 w-3 ${selectedFilter === 'SAVED' ? 'fill-white' : ''}`} />
              <span>Saved ({bookmarkedArticles.length})</span>
            </button>

            {userCategories.map((c, i) => {
              const name = c.categories?.name;
              if (!name) return null;
              const isSelected = selectedFilter.toLowerCase() === name.toLowerCase();
              const count = articles.filter((a) => a.category.toLowerCase() === name.toLowerCase()).length;
              return (
                <button
                  key={i}
                  onClick={() => setSelectedFilter(name)}
                  className={`rounded-lg px-3 py-1 font-mono text-xs uppercase tracking-wider transition ${
                    isSelected
                      ? 'border border-stone-900 dark:border-[#3B628A] bg-stone-900 dark:bg-[#1A3F75] text-white font-bold'
                      : 'border border-stone-200 dark:border-[#1A3F75] bg-white dark:bg-[#0A1333] text-stone-600 dark:text-[#8BA3C7] hover:border-stone-400 dark:hover:border-[#3B628A]'
                  }`}
                >
                  {name} ({count})
                </button>
              );
            })}
          </div>

          {/* Articles Stream */}
          {loadingArticles ? (
            <div className="rounded-2xl border border-stone-200 dark:border-[#1A3F75] bg-white dark:bg-[#0A1333] p-12 text-center graph-paper-bg">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto text-stone-400 dark:text-[#8BA3C7] mb-3" />
              <div className="font-mono text-xs text-stone-600 dark:text-[#D4E4EC] uppercase tracking-widest">
                Curating multi-source news stories...
              </div>
            </div>
          ) : filteredArticles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredArticles.map((article, idx) => {
                const isSaved = isArticleBookmarked(article.url, bookmarkedArticles);
                const dateStr = article.publishedAt
                  ? new Date(article.publishedAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })
                  : 'Today';

                return (
                  <article
                    key={idx}
                    className="group relative flex flex-col justify-between rounded-xl border border-stone-200 dark:border-[#1A3F75] bg-white/95 dark:bg-[#0A1333] p-5 shadow-2xs hover:border-stone-900 dark:hover:border-[#3B628A] hover:shadow-xs transition-all"
                  >
                    <div>
                      {/* Top Metadata Line */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="font-mono text-[10px] font-bold uppercase tracking-wider rounded border border-stone-200 dark:border-[#1A3F75] bg-stone-100 dark:bg-[#13264D] px-2 py-0.5 text-stone-800 dark:text-[#D4E4EC]">
                          {article.category}
                        </span>

                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5 font-mono text-[10px] text-stone-400 dark:text-[#8BA3C7] uppercase">
                            <span>{article.sourceName}</span>
                            <span>•</span>
                            <span>{dateStr}</span>
                          </div>

                          {/* Quick Bookmark Toggle (Step 10 Personalization) */}
                          <button
                            onClick={() => handleToggleBookmark(article)}
                            title={isSaved ? 'Remove bookmark' : 'Save for later'}
                            className="p-1 rounded text-stone-400 hover:text-stone-700 dark:hover:text-white transition"
                          >
                            <Bookmark className={`h-3.5 w-3.5 ${isSaved ? 'fill-amber-500 text-amber-500' : ''}`} />
                          </button>
                        </div>
                      </div>

                      {/* Headline */}
                      <h3 className="font-sans text-base font-bold text-stone-900 dark:text-[#D4E4EC] leading-snug group-hover:text-amber-700 dark:group-hover:text-amber-400 transition">
                        {article.title}
                      </h3>

                      {/* Bite-sized summary */}
                      <p className="mt-2 text-xs text-stone-600 dark:text-[#8BA3C7] leading-relaxed font-sans line-clamp-3">
                        {article.summary || 'Summary unavailable. Click to read the full source.'}
                      </p>
                    </div>

                    {/* Footer / Transparency Badge */}
                    <div className="mt-4 pt-3 border-t border-stone-100 dark:border-[#1A3F75] flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-mono text-[10px] text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                        <span>Verified Source</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg text-stone-400 dark:text-[#8BA3C7] hover:text-stone-700 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-[#13264D] transition"
                          title="Open original source dispatch"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>

                        <button
                          onClick={() => setSelectedArticle(article)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-stone-800 dark:border-[#3B628A] bg-stone-900 dark:bg-[#1A3F75] px-3 py-1 font-mono text-xs font-bold text-white shadow-2xs hover:bg-stone-800 dark:hover:bg-[#13264D] transition uppercase tracking-wider"
                        >
                          <span>Read Nugget</span>
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-stone-300 dark:border-[#1A3F75] bg-white/70 dark:bg-[#0A1333]/70 p-8 sm:p-12 text-center graph-paper-bg">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-stone-300 dark:border-[#1A3F75] bg-white dark:bg-[#0A1333] text-stone-700 dark:text-[#D4E4EC] mb-4 shadow-2xs">
                {selectedFilter === 'SAVED' ? (
                  <Bookmark className="h-6 w-6 text-amber-500" />
                ) : (
                  <Newspaper className="h-6 w-6" />
                )}
              </div>
              <h3 className="font-mono text-sm font-bold text-stone-900 dark:text-[#D4E4EC] uppercase tracking-wider">
                {selectedFilter === 'SAVED' ? 'No Saved Nuggets Yet' : 'No Dispatches Found'}
              </h3>
              <p className="max-w-md mx-auto text-xs text-stone-600 dark:text-[#8BA3C7] mt-2 leading-relaxed font-sans">
                {selectedFilter === 'SAVED'
                  ? 'Click the bookmark icon on any article in your feed to save it for quick review here.'
                  : "No active dispatches found for your selected topic. Click 'Sync' above or configure additional topics."}
              </p>
            </div>
          )}
        </section>

        {/* Academic / Architectural Standards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-stone-200 dark:border-[#1A3F75]">
          <div className="rounded-xl border border-stone-200 dark:border-[#1A3F75] bg-white/80 dark:bg-[#0A1333]/80 p-4">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <h4 className="font-mono text-xs font-bold text-stone-900 dark:text-[#D4E4EC] uppercase">Multi-Source Verification</h4>
            </div>
            <p className="text-xs text-stone-500 dark:text-[#8BA3C7] leading-relaxed">
              Every factual assertion links back to cross-checked primary sources with total transparency.
            </p>
          </div>

          <div className="rounded-xl border border-stone-200 dark:border-[#1A3F75] bg-white/80 dark:bg-[#0A1333]/80 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <h4 className="font-mono text-xs font-bold text-stone-900 dark:text-[#D4E4EC] uppercase">3-Minute Briefings</h4>
            </div>
            <p className="text-xs text-stone-500 dark:text-[#8BA3C7] leading-relaxed">
              Condenses complex breaking developments into fast, respectful reads built for high retention.
            </p>
          </div>

          <div className="rounded-xl border border-stone-200 dark:border-[#1A3F75] bg-white/80 dark:bg-[#0A1333]/80 p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileCheck2 className="h-4 w-4 text-stone-700 dark:text-stone-300" />
              <h4 className="font-mono text-xs font-bold text-stone-900 dark:text-[#D4E4EC] uppercase">Zero Quiz Friction</h4>
            </div>
            <p className="text-xs text-stone-500 dark:text-[#8BA3C7] leading-relaxed">
              Streaks and XP are earned through deliberate reading sessions, not multiple-choice trivia.
            </p>
          </div>
        </section>

        {/* Reader Modal */}
        <NuggetReaderModal
          isOpen={!!selectedArticle}
          onClose={() => setSelectedArticle(null)}
          article={selectedArticle}
          userId={user?.id}
          onReadingComplete={handleReadingComplete}
          onBookmarkChange={reloadBookmarks}
        />

        {/* Achievements Accolades Modal */}
        <AchievementsModal
          isOpen={showAchievements}
          onClose={() => setShowAchievements(false)}
          userId={user?.id}
          totalXp={profile?.total_xp || 0}
        />
      </main>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1 flex items-center justify-center p-4">
            <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-widest text-stone-500 animate-pulse">
              <Sparkles className="h-4 w-4 animate-spin text-amber-500" />
              <span>Loading NUGGET...</span>
            </div>
          </main>
        </div>
      }
    >
      <HomePageContent />
    </Suspense>
  );
}
