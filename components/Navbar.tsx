'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { BookOpen, User as UserIcon, Flame, Sparkles, LogOut, LogIn } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<{ display_name?: string; total_xp?: number; current_streak?: number } | null>(null);
  const router = useRouter();

  useEffect(() => {
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
          setProfile(data);
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-amber-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-amber-950 text-xl tracking-tight">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm shadow-amber-200">
            <Sparkles className="h-5 w-5" />
          </div>
          <span>NUGGET</span>
        </Link>

        <nav className="flex items-center gap-3 sm:gap-6">
          <Link
            href="/topics"
            className="flex items-center gap-1.5 text-sm font-medium text-slate-600 transition hover:text-amber-600"
          >
            <BookOpen className="h-4 w-4" />
            <span>Topics</span>
          </Link>

          {user ? (
            <>
              <div className="hidden sm:flex items-center gap-3 text-xs font-semibold">
                <span className="flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-orange-600 border border-orange-200">
                  <Flame className="h-3.5 w-3.5" />
                  {profile?.current_streak ?? 0}d streak
                </span>
                <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-amber-700 border border-amber-200">
                  <Sparkles className="h-3.5 w-3.5" />
                  {profile?.total_xp ?? 0} XP
                </span>
              </div>

              <Link
                href="/profile"
                className="flex items-center gap-1.5 text-sm font-medium text-slate-700 hover:text-amber-600"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  <UserIcon className="h-4 w-4" />
                </div>
                <span className="hidden sm:inline font-medium">
                  {profile?.display_name || user.email?.split('@')[0]}
                </span>
              </Link>

              <button
                onClick={handleSignOut}
                title="Sign Out"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5"
              >
                <LogIn className="h-4 w-4" />
                <span>Log in</span>
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-amber-500 px-3.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 transition"
              >
                Get Started
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
