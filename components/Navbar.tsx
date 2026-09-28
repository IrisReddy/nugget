'use client';

import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import AwardBadge from '@/components/AwardBadge';
import {
  BookOpen,
  User as UserIcon,
  Flame,
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
          // Fix 0 days streak defense if user has already earned XP
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
    <header className="sticky top-0 z-50 border-b border-[#E1D4C2] dark:border-[#6E473B] bg-[#FAF7F2]/90 dark:bg-[#291C0E]/95 backdrop-blur-md transition-colors">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2.5 sm:px-6">
        {/* NUGGET Logo */}
        <Link href="/" className="group flex items-center gap-2.5">
          <div className="relative border border-[#BEB5A9] dark:border-[#A78D78] bg-white dark:bg-[#362215] px-2.5 py-1 shadow-2xs rounded-sm graph-paper-bg transition group-hover:border-[#6E473B]">
            <span className="font-mono text-base font-black tracking-tight text-[#291C0E] dark:text-[#E1D4C2] uppercase">
              NUGGET
            </span>
          </div>
          <span className="hidden sm:inline-block font-mono text-[10px] text-[#7A6652] dark:text-[#BEB5A9] uppercase tracking-widest border-l border-[#E1D4C2] dark:border-[#6E473B] pl-2">
            INTELLIGENCE
          </span>
        </Link>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          {/* Topics Quick Link */}
          <Link
            href="/topics"
            className="hidden sm:flex items-center gap-1.5 font-mono text-xs font-semibold text-[#6E473B] dark:text-[#BEB5A9] hover:text-[#291C0E] dark:hover:text-[#E1D4C2] uppercase tracking-wider px-2 py-1 rounded hover:bg-[#E1D4C2]/40 dark:hover:bg-[#482D1E]"
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Topics</span>
          </Link>

          {/* User Metrics */}
          {user ? (
            <>
              {/* Streak Badge (Guaranteed >0 if user read) */}
              <span className="flex items-center gap-1 font-mono text-xs font-bold rounded border border-orange-300 dark:border-orange-500/40 bg-orange-50/90 dark:bg-[#482D1E] px-2 py-0.5 text-orange-700 dark:text-orange-300">
                <Flame className="h-3.5 w-3.5 text-orange-500 fill-orange-500/30" />
                <span>{streakDisplay}D STREAK</span>
              </span>

              {/* XP Badge with signature AwardBadge icon */}
              <span className="flex items-center gap-1.5 font-mono text-xs font-bold rounded border border-amber-300 dark:border-[#6E473B] bg-white dark:bg-[#362215] px-2.5 py-0.5 text-amber-800 dark:text-amber-300 shadow-2xs">
                <AwardBadge className="h-4 w-4 text-amber-500 fill-amber-500/20" />
                <span>{profile?.total_xp ?? 0} XP</span>
              </span>
            </>
          ) : (
            <div className="hidden sm:flex items-center gap-2 font-mono text-xs">
              <Link
                href="/login"
                className="font-semibold text-[#6E473B] dark:text-[#BEB5A9] hover:text-[#291C0E] dark:hover:text-white px-2 py-1"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className="rounded-lg border border-[#291C0E] dark:border-[#A78D78] bg-[#291C0E] dark:bg-[#6E473B] px-3 py-1 font-bold text-white shadow-2xs hover:bg-[#6E473B] dark:hover:bg-[#482D1E] transition tracking-wide"
              >
                Sign Up
              </Link>
            </div>
          )}

          {/* Dedicated Theme Toggle Button (Sun / Moon) */}
          <button
            onClick={toggleTheme}
            title={isDark ? 'Switch to Warm Parchment (Light)' : 'Switch to Warm Espresso (Dark)'}
            className="flex items-center justify-center rounded-lg border border-[#E1D4C2] dark:border-[#6E473B] bg-white dark:bg-[#362215] p-1.5 text-[#291C0E] dark:text-[#E1D4C2] hover:bg-[#E1D4C2]/40 dark:hover:bg-[#482D1E] transition"
          >
            {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-[#291C0E]" />}
          </button>

          {/* 3-Line Menu (Hamburger Dropdown) */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center justify-center rounded-lg border border-[#E1D4C2] dark:border-[#6E473B] bg-white dark:bg-[#362215] p-1.5 text-[#291C0E] dark:text-[#E1D4C2] hover:bg-[#E1D4C2]/40 dark:hover:bg-[#482D1E] transition"
              title="Menu"
            >
              {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-[#E1D4C2] dark:border-[#6E473B] bg-white/98 dark:bg-[#362215]/98 shadow-xl backdrop-blur-md p-2 font-mono text-xs z-50 graph-paper-bg">
                {user && (
                  <div className="border-b border-[#E1D4C2] dark:border-[#6E473B] px-3 py-2 mb-1">
                    <span className="text-[10px] text-[#A78D78] dark:text-[#BEB5A9] block uppercase">
                      RESEARCHER
                    </span>
                    <span className="font-bold text-[#291C0E] dark:text-[#E1D4C2] truncate block">
                      {profile?.display_name || user.email?.split('@')[0]}
                    </span>
                  </div>
                )}

                <div className="space-y-0.5">
                  <Link
                    href="/"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 rounded px-3 py-2 text-[#291C0E] dark:text-[#E1D4C2] hover:bg-[#E1D4C2]/40 dark:hover:bg-[#482D1E] transition"
                  >
                    <BookOpen className="h-3.5 w-3.5 text-[#A78D78]" />
                    <span>Daily Feed</span>
                  </Link>

                  <Link
                    href="/topics"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 rounded px-3 py-2 text-[#291C0E] dark:text-[#E1D4C2] hover:bg-[#E1D4C2]/40 dark:hover:bg-[#482D1E] transition"
                  >
                    <Compass className="h-3.5 w-3.5 text-[#A78D78]" />
                    <span>Topic Subscriptions</span>
                  </Link>

                  <Link
                    href="/?filter=SAVED"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 rounded px-3 py-2 text-[#291C0E] dark:text-[#E1D4C2] hover:bg-[#E1D4C2]/40 dark:hover:bg-[#482D1E] transition"
                  >
                    <Bookmark className="h-3.5 w-3.5 text-[#A78D78]" />
                    <span>Saved Nuggets</span>
                  </Link>

                  {user ? (
                    <>
                      <Link
                        href="/profile"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 rounded px-3 py-2 text-[#291C0E] dark:text-[#E1D4C2] hover:bg-[#E1D4C2]/40 dark:hover:bg-[#482D1E] transition"
                      >
                        <UserIcon className="h-3.5 w-3.5 text-[#A78D78]" />
                        <span>Profile & Telemetry</span>
                      </Link>

                      <button
                        onClick={handleSignOut}
                        className="w-full text-left flex items-center gap-2 rounded px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition border-t border-[#E1D4C2] dark:border-[#6E473B] mt-1 pt-2"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </>
                  ) : (
                    <div className="border-t border-[#E1D4C2] dark:border-[#6E473B] pt-1 mt-1">
                      <Link
                        href="/login"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 rounded px-3 py-2 text-[#291C0E] dark:text-[#E1D4C2] hover:bg-[#E1D4C2]/40 dark:hover:bg-[#482D1E]"
                      >
                        <LogIn className="h-3.5 w-3.5" />
                        <span>Log In</span>
                      </Link>
                      <Link
                        href="/signup"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 rounded px-3 py-2 font-bold text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                      >
                        <AwardBadge className="h-3.5 w-3.5 text-amber-500" />
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
