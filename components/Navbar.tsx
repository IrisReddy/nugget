'use client';

import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import {
  BookOpen,
  User as UserIcon,
  Flame,
  Sparkles,
  LogOut,
  LogIn,
  Sun,
  Moon,
  Menu,
  X,
  Compass,
  Bookmark
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<{ display_name?: string; total_xp?: number; current_streak?: number } | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    // 1. Initial theme load
    const savedTheme = localStorage.getItem('nugget-theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    }

    // 2. Load user and profile
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('display_name, total_xp, current_streak')
          .eq('id', user.id)
          .single();

        if (data) {
          // Fix 0 days streak if user has already earned XP
          if ((data.total_xp || 0) > 0 && (!data.current_streak || data.current_streak === 0)) {
            const today = new Date().toISOString().split('T')[0];
            await supabase.from('profiles').update({ current_streak: 1, last_read_date: today }).eq('id', user.id);
            setProfile({ ...data, current_streak: 1 });
          } else {
            setProfile(data);
          }
        }
      }
    }

    loadUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('nugget-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('nugget-theme', 'light');
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setMenuOpen(false);
    router.push('/login');
  };

  const streakDisplay = (profile?.current_streak && profile.current_streak > 0)
    ? profile.current_streak
    : ((profile?.total_xp || 0) > 0 ? 1 : 0);

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200 dark:border-[#1A3F75] bg-[#FAF7F2]/90 dark:bg-[#00002A]/90 backdrop-blur-md transition-colors">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2.5 sm:px-6">
        {/* NUGGET Logo */}
        <Link href="/" className="group flex items-center gap-2.5">
          <div className="relative border border-stone-300 dark:border-[#3B628A] bg-white dark:bg-[#0A1333] px-2.5 py-1 shadow-2xs rounded-sm graph-paper-bg transition group-hover:border-stone-500">
            <span className="font-mono text-base font-black tracking-tight text-stone-900 dark:text-[#D4E4EC] uppercase">
              NUGGET
            </span>
          </div>
          <span className="hidden sm:inline-block font-mono text-[10px] text-stone-500 dark:text-[#8BA3C7] uppercase tracking-widest border-l border-stone-300 dark:border-[#1A3F75] pl-2">
            INTELLIGENCE
          </span>
        </Link>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          {/* Topics Quick Link */}
          <Link
            href="/topics"
            className="hidden sm:flex items-center gap-1.5 font-mono text-xs font-semibold text-stone-600 dark:text-[#8BA3C7] hover:text-stone-950 dark:hover:text-[#D4E4EC] uppercase tracking-wider px-2 py-1 rounded hover:bg-stone-200/50 dark:hover:bg-[#13264D]"
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Topics</span>
          </Link>

          {/* User Metrics */}
          {user ? (
            <>
              {/* Streak Badge (Guaranteed >0 if user read) */}
              <span className="flex items-center gap-1 font-mono text-xs font-bold rounded border border-orange-300 dark:border-orange-500/40 bg-orange-50/90 dark:bg-orange-950/40 px-2 py-0.5 text-orange-700 dark:text-orange-300">
                <Flame className="h-3.5 w-3.5 text-orange-500 fill-orange-500/30" />
                <span>{streakDisplay}D STREAK</span>
              </span>

              {/* XP Badge with clean Sparkles icon (No raw commands) */}
              <span className="flex items-center gap-1 font-mono text-xs font-bold rounded border border-amber-300 dark:border-amber-500/40 bg-white dark:bg-[#0A1333] px-2.5 py-0.5 text-amber-800 dark:text-amber-300">
                <Sparkles className="h-3.5 w-3.5 text-amber-500 fill-amber-500/20" />
                <span>{profile?.total_xp ?? 0} XP</span>
              </span>
            </>
          ) : (
            <div className="hidden sm:flex items-center gap-2 font-mono text-xs">
              <Link
                href="/login"
                className="font-semibold text-stone-600 dark:text-[#8BA3C7] hover:text-stone-900 dark:hover:text-white px-2 py-1"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className="rounded border border-stone-900 dark:border-[#3B628A] bg-stone-900 dark:bg-[#1A3F75] px-3 py-1 font-bold text-white shadow-2xs hover:bg-stone-800 transition tracking-wide"
              >
                Sign Up
              </Link>
            </div>
          )}

          {/* Dedicated Theme Toggle Button (Sun / Moon) */}
          <button
            onClick={toggleTheme}
            title={isDark ? 'Switch to Parchment (Light)' : 'Switch to Blueprint (Dark)'}
            className="flex items-center justify-center rounded-lg border border-stone-300 dark:border-[#1A3F75] bg-white dark:bg-[#0A1333] p-1.5 text-stone-700 dark:text-[#D4E4EC] hover:bg-stone-100 dark:hover:bg-[#13264D] transition"
          >
            {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-stone-700" />}
          </button>

          {/* 3-Line Menu (Hamburger Dropdown) */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center justify-center rounded-lg border border-stone-300 dark:border-[#1A3F75] bg-white dark:bg-[#0A1333] p-1.5 text-stone-700 dark:text-[#D4E4EC] hover:bg-stone-100 dark:hover:bg-[#13264D] transition"
              title="Menu"
            >
              {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-stone-300 dark:border-[#1A3F75] bg-white/98 dark:bg-[#0A1333]/98 shadow-xl backdrop-blur-md p-2 font-mono text-xs z-50 graph-paper-bg">
                {user && (
                  <div className="border-b border-stone-100 dark:border-[#1A3F75] px-3 py-2 mb-1">
                    <span className="text-[10px] text-stone-400 dark:text-[#8BA3C7] block uppercase">
                      RESEARCHER
                    </span>
                    <span className="font-bold text-stone-900 dark:text-[#D4E4EC] truncate block">
                      {profile?.display_name || user.email?.split('@')[0]}
                    </span>
                  </div>
                )}

                <div className="space-y-0.5">
                  <Link
                    href="/"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 rounded px-3 py-2 text-stone-700 dark:text-[#D4E4EC] hover:bg-stone-100 dark:hover:bg-[#13264D] transition"
                  >
                    <BookOpen className="h-3.5 w-3.5 text-stone-500 dark:text-[#8BA3C7]" />
                    <span>Daily Feed</span>
                  </Link>

                  <Link
                    href="/topics"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 rounded px-3 py-2 text-stone-700 dark:text-[#D4E4EC] hover:bg-stone-100 dark:hover:bg-[#13264D] transition"
                  >
                    <Compass className="h-3.5 w-3.5 text-stone-500 dark:text-[#8BA3C7]" />
                    <span>Topic Subscriptions</span>
                  </Link>

                  <Link
                    href="/?filter=SAVED"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 rounded px-3 py-2 text-stone-700 dark:text-[#D4E4EC] hover:bg-stone-100 dark:hover:bg-[#13264D] transition"
                  >
                    <Bookmark className="h-3.5 w-3.5 text-stone-500 dark:text-[#8BA3C7]" />
                    <span>Saved Nuggets</span>
                  </Link>

                  {user ? (
                    <>
                      <Link
                        href="/profile"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 rounded px-3 py-2 text-stone-700 dark:text-[#D4E4EC] hover:bg-stone-100 dark:hover:bg-[#13264D] transition"
                      >
                        <UserIcon className="h-3.5 w-3.5 text-stone-500 dark:text-[#8BA3C7]" />
                        <span>Profile & Telemetry</span>
                      </Link>

                      <button
                        onClick={handleSignOut}
                        className="w-full text-left flex items-center gap-2 rounded px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition border-t border-stone-100 dark:border-[#1A3F75] mt-1 pt-2"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </>
                  ) : (
                    <div className="border-t border-stone-100 dark:border-[#1A3F75] pt-1 mt-1">
                      <Link
                        href="/login"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 rounded px-3 py-2 text-stone-700 dark:text-[#D4E4EC] hover:bg-stone-100 dark:hover:bg-[#13264D]"
                      >
                        <LogIn className="h-3.5 w-3.5" />
                        <span>Log In</span>
                      </Link>
                      <Link
                        href="/signup"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 rounded px-3 py-2 font-bold text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Create Account</span>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
