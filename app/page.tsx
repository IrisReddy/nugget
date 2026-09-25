'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import { User } from '@supabase/supabase-js';
import {
  Flame,
  Award,
  BookOpen,
  ArrowRight,
  Compass,
  CheckCircle2,
  Newspaper,
  ShieldCheck,
  Clock,
  Terminal,
  FileCheck2
} from 'lucide-react';

interface UserCategoryItem {
  category_id: string;
  categories: { name: string } | null;
}

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<{ display_name?: string; total_xp?: number; current_streak?: number } | null>(null);
  const [userCategories, setUserCategories] = useState<UserCategoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: profData } = await supabase
          .from('profiles')
          .select('display_name, total_xp, current_streak')
          .eq('id', user.id)
          .single();

        if (profData) setProfile(profData);

        const { data: catData } = await supabase
          .from('user_categories')
          .select('category_id, categories(name)')
          .eq('user_id', user.id);

        if (catData) setUserCategories(catData as unknown as UserCategoryItem[]);
      }
      setLoading(false);
    }

    loadDashboard();
  }, []);

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'Learner';

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="font-mono text-xs uppercase tracking-widest text-stone-500 animate-pulse">
            [SYS_INIT] Loading NUGGET workspace...
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
        <section className="relative rounded-2xl border border-stone-300 bg-white/95 p-6 sm:p-9 shadow-xs graph-paper-bg">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-3 mb-5">
            <span className="font-mono text-[11px] font-bold text-stone-600 uppercase tracking-widest flex items-center gap-1.5">
              <Terminal className="h-3.5 w-3.5 text-stone-800" />
              BRIEFING_DOC // DAILY_FEED
            </span>
            <span className="font-mono text-[11px] text-stone-600 uppercase tracking-widest">
              STEP: 05 / 10
            </span>
          </div>

          <div className="max-w-2xl">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-stone-900 uppercase font-mono">
              {user ? `GREETINGS, ${displayName}.` : 'DAILY LEARNING DOSSIER.'}
            </h1>
            <p className="mt-3 text-sm sm:text-base text-stone-600 leading-relaxed font-sans">
              What do you want to learn today? Transform noise, breaking curiosity, and disparate publications into
              compact, multi-source verified knowledge without artificial quiz mechanics.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/topics"
                className="inline-flex items-center gap-2 rounded border border-stone-900 bg-stone-900 px-4 py-2 font-mono text-xs font-bold text-white shadow-2xs hover:bg-stone-800 transition uppercase tracking-wider"
              >
                <Compass className="h-3.5 w-3.5" />
                <span>Configure Topics</span>
              </Link>
              {!user && (
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 rounded border border-stone-300 bg-white px-4 py-2 font-mono text-xs font-semibold text-stone-700 hover:bg-stone-50 transition uppercase tracking-wider"
                >
                  Create Account &rarr;
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* Nerdy Stats Ledger */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-stone-200 bg-white/95 p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] font-semibold text-stone-600 uppercase tracking-wider">
                CURRENT_STREAK
              </span>
              <Flame className="h-4 w-4 text-orange-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-mono text-3xl font-extrabold text-stone-900 tracking-tight">
                {profile?.current_streak ?? 0}
              </span>
              <span className="font-mono text-xs text-stone-600 uppercase">CONSECUTIVE_DAYS</span>
            </div>
          </div>

          <div className="rounded-xl border border-stone-200 bg-white/95 p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] font-semibold text-stone-600 uppercase tracking-wider">
                TOTAL_XP_ACCUMULATED
              </span>
              <Award className="h-4 w-4 text-amber-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-mono text-3xl font-extrabold text-stone-900 tracking-tight">
                {profile?.total_xp ?? 0}
              </span>
              <span className="font-mono text-xs text-stone-600 uppercase">XP_POINTS</span>
            </div>
          </div>

          <div className="rounded-xl border border-stone-200 bg-white/95 p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] font-semibold text-stone-600 uppercase tracking-wider">
                ACTIVE_FEEDS
              </span>
              <BookOpen className="h-4 w-4 text-blue-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-mono text-3xl font-extrabold text-stone-900 tracking-tight">
                {userCategories.length}
              </span>
              <span className="font-mono text-xs text-stone-600 uppercase">TOPICS_SUBSCRIBED</span>
            </div>
          </div>
        </section>

        {/* Selected Interests Pill Bar */}
        {user && userCategories.length > 0 && (
          <section className="rounded-xl border border-stone-200 bg-white/90 p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-3 border-b border-stone-100 pb-2">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-stone-500">
                ACTIVE_INTEREST_SUIT
              </span>
              <Link href="/topics" className="font-mono text-xs text-stone-600 hover:text-stone-900 underline">
                EDIT_TOPICS &rarr;
              </Link>
            </div>
            <div className="flex flex-wrap gap-2">
              {userCategories.map((item, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 rounded border border-stone-300 bg-stone-50 px-2.5 py-1 font-mono text-xs font-medium text-stone-800"
                >
                  <CheckCircle2 className="h-3 w-3 text-stone-500" />
                  {item.categories?.name || 'Topic'}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Observation Ledger: Today's Nuggets Feed Placeholder */}
        <section className="space-y-3">
          <div className="flex items-center justify-between border-b border-stone-300 pb-2">
            <div>
              <h2 className="font-mono text-base font-extrabold text-stone-900 uppercase tracking-tight">
                TODAY&apos;S_NUGGETS // FEED
              </h2>
              <p className="text-xs text-stone-500 mt-0.5 font-sans">
                Curated, multi-source verified summaries aligned with your selected topics.
              </p>
            </div>
            <span className="font-mono text-[10px] text-stone-500 border border-stone-300 bg-stone-100 px-2 py-0.5 rounded uppercase">
              STATUS: READY_FOR_API
            </span>
          </div>

          <div className="rounded-2xl border-2 border-dashed border-stone-300 bg-white/70 p-8 sm:p-12 text-center graph-paper-bg">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded border border-stone-300 bg-white text-stone-700 mb-4 shadow-2xs">
              <Newspaper className="h-6 w-6" />
            </div>
            <h3 className="font-mono text-sm font-bold text-stone-900 uppercase tracking-wider">
              [NO_ARTICLES_STAGED_YET]
            </h3>
            <p className="max-w-md mx-auto text-xs text-stone-600 mt-2 leading-relaxed font-sans">
              Currently on <span className="font-mono font-bold text-stone-900">STEP 05 (Topic System)</span>.
              Once News/API (Step 06) and AI Multi-Source Synthesis (Step 07) run, your personalized briefing ledger
              will populate with verified citations and reading tracking.
            </p>

            <div className="mt-5 flex justify-center">
              <Link
                href="/topics"
                className="inline-flex items-center gap-1.5 rounded border border-stone-800 bg-stone-900 px-3.5 py-1.5 font-mono text-xs font-semibold text-white shadow-2xs hover:bg-stone-800 transition uppercase tracking-wider"
              >
                <span>Select Topics</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Academic / Architectural Standards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-stone-200">
          <div className="rounded-lg border border-stone-200 bg-white/80 p-4">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <h4 className="font-mono text-xs font-bold text-stone-900 uppercase">Multi-Source Verification</h4>
            </div>
            <p className="text-xs text-stone-500 leading-relaxed">
              Every factual assertion links back to cross-checked primary sources with total transparency.
            </p>
          </div>

          <div className="rounded-lg border border-stone-200 bg-white/80 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-amber-600" />
              <h4 className="font-mono text-xs font-bold text-stone-900 uppercase">3-Minute Briefings</h4>
            </div>
            <p className="text-xs text-stone-500 leading-relaxed">
              Condenses complex breaking developments into fast, respectful reads built for high retention.
            </p>
          </div>

          <div className="rounded-lg border border-stone-200 bg-white/80 p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileCheck2 className="h-4 w-4 text-stone-700" />
              <h4 className="font-mono text-xs font-bold text-stone-900 uppercase">Zero Quiz Friction</h4>
            </div>
            <p className="text-xs text-stone-500 leading-relaxed">
              Streaks and XP are earned through deliberate reading sessions, not multiple-choice trivia.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
