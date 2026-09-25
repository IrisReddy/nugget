'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import { User } from '@supabase/supabase-js';
import {
  Sparkles,
  Flame,
  Award,
  BookOpen,
  ArrowRight,
  Compass,
  CheckCircle2,
  Newspaper,
  ShieldCheck,
  Clock
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
        // Fetch profile
        const { data: profData } = await supabase
          .from('profiles')
          .select('display_name, total_xp, current_streak')
          .eq('id', user.id)
          .single();

        if (profData) setProfile(profData);

        // Fetch user selected categories
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
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="text-slate-500 font-medium animate-pulse">Loading NUGGET dashboard...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Welcome & Learning Intent Hero */}
        <section className="rounded-3xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 p-8 sm:p-10 text-white shadow-xl shadow-amber-500/10 relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-md mb-4 text-amber-50">
              <Sparkles className="h-3.5 w-3.5" />
              Daily Bite-Sized Learning
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              {user ? `Welcome back, ${displayName}!` : 'Welcome to NUGGET'}
            </h1>
            <p className="mt-3 text-base sm:text-lg text-amber-100 font-medium leading-relaxed">
              What do you want to learn today? Turn real news and reliable curiosities into trustworthy,
              multi-source verified knowledge without quiz anxiety.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/topics"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-amber-900 shadow-md hover:bg-amber-50 transition"
              >
                <Compass className="h-4 w-4 text-amber-600" />
                <span>Choose your topics</span>
              </Link>
              {!user && (
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-900/30 px-5 py-2.5 text-sm font-semibold text-white border border-white/20 hover:bg-amber-900/40 transition"
                >
                  Create free account
                </Link>
              )}
            </div>
          </div>

          <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 opacity-10 pointer-events-none">
            <Sparkles className="h-96 w-96 text-white" />
          </div>
        </section>

        {/* Progress & Habit Formation Section */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-500 border border-orange-100">
              <Flame className="h-6 w-6" />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500">Current Streak</div>
              <div className="text-2xl font-bold text-slate-900 tracking-tight">
                {profile?.current_streak ?? 0} <span className="text-sm font-normal text-slate-500">days</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500">Total XP Earned</div>
              <div className="text-2xl font-bold text-slate-900 tracking-tight">
                {profile?.total_xp ?? 0} <span className="text-sm font-normal text-slate-500">XP</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500">Active Topics</div>
              <div className="text-2xl font-bold text-slate-900 tracking-tight">
                {userCategories.length} <span className="text-sm font-normal text-slate-500">selected</span>
              </div>
            </div>
          </div>
        </section>

        {/* Selected Topics Pill Bar */}
        {user && userCategories.length > 0 && (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Your Active Interests</span>
              <Link href="/topics" className="text-xs font-semibold text-amber-600 hover:text-amber-700">
                Manage interests &rarr;
              </Link>
            </div>
            <div className="flex flex-wrap gap-2">
              {userCategories.map((item, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 rounded-lg bg-amber-50 border border-amber-200/60 px-3 py-1 text-xs font-medium text-amber-900"
                >
                  <CheckCircle2 className="h-3 w-3 text-amber-600" />
                  {item.categories?.name || 'Topic'}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Today's Nuggets Feed Placeholder */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Today&apos;s Nuggets</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Curated, multi-source verified summaries aligned with your selected topics.
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
              <Clock className="h-3.5 w-3.5" />
              Next Step: News API & AI Pipeline
            </span>
          </div>

          <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white/50 p-8 sm:p-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 mb-4">
              <Newspaper className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No Nuggets Generated Yet</h3>
            <p className="max-w-md mx-auto text-sm text-slate-500 mt-2 leading-relaxed">
              We&apos;re currently on <span className="font-semibold text-slate-800">Step 5 (Topic System)</span>.
              Once we configure News/API (Step 6) and the AI Synthesis Pipeline (Step 7), your personalized daily
              bite-sized articles will appear here automatically with verified citations and reading tracking.
            </p>

            <div className="mt-6 flex flex-wrap justify-center items-center gap-3">
              <Link
                href="/topics"
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 transition"
              >
                <span>Select or Update Topics</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Product Pillars / Philosophy */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-200">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-slate-900">Multi-Source Verification</h4>
              <p className="text-xs text-slate-500 mt-1">
                Every claim links back to cross-checked primary sources with complete transparency.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-slate-900">Bite-Sized & Respectful</h4>
              <p className="text-xs text-slate-500 mt-1">
                Distills complex current events into 3-minute reads designed for deep comprehension.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-slate-900">Zero Quiz Anxiety</h4>
              <p className="text-xs text-slate-500 mt-1">
                Earn XP and maintain streaks purely through genuine reading behavior and habit formation.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
