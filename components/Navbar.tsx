'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { BookOpen, User as UserIcon, Flame, Terminal, LogOut, LogIn } from 'lucide-react';
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
    <header className="sticky top-0 z-50 border-b border-stone-200 bg-stone-50/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2.5 sm:px-6">
        {/* NUGGET logo with graph grid border accent */}
        <Link href="/" className="group flex items-center gap-2.5">
          <div className="relative border border-stone-300 bg-white px-2.5 py-1 shadow-xs rounded-sm graph-paper-bg transition group-hover:border-stone-400">
            <span className="font-mono text-base font-black tracking-tight text-stone-900 uppercase">
              NUGGET
            </span>
          </div>
          <span className="hidden sm:inline-block font-mono text-[10px] text-stone-600 uppercase tracking-widest border-l border-stone-200 pl-2">
            v0.1 / lab
          </span>
        </Link>

        <nav className="flex items-center gap-3 sm:gap-5">
          <Link
            href="/topics"
            className="flex items-center gap-1.5 font-mono text-xs font-semibold text-stone-600 hover:text-stone-950 transition uppercase tracking-wider px-2 py-1 rounded hover:bg-stone-200/50"
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>[Topics]</span>
          </Link>

          {user ? (
            <>
              <div className="hidden sm:flex items-center gap-2 font-mono text-[11px] font-semibold">
                <span className="flex items-center gap-1 rounded border border-orange-200 bg-orange-50/80 px-2 py-0.5 text-orange-700">
                  <Flame className="h-3 w-3" />
                  {profile?.current_streak ?? 0}D STREAK
                </span>
                <span className="flex items-center gap-1 rounded border border-stone-300 bg-white px-2 py-0.5 text-stone-700">
                  <Terminal className="h-3 w-3 text-amber-600" />
                  {profile?.total_xp ?? 0} XP
                </span>
              </div>

              <Link
                href="/profile"
                className="flex items-center gap-1.5 font-mono text-xs font-medium text-stone-700 hover:text-stone-950 border border-stone-300 bg-white px-2.5 py-1 rounded shadow-2xs hover:bg-stone-50 transition"
              >
                <UserIcon className="h-3.5 w-3.5 text-stone-500" />
                <span className="hidden sm:inline font-mono">
                  {profile?.display_name || user.email?.split('@')[0]}
                </span>
              </Link>

              <button
                onClick={handleSignOut}
                title="Sign Out"
                className="rounded p-1 text-stone-400 hover:bg-stone-200/70 hover:text-stone-700 transition"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2 font-mono text-xs">
              <Link
                href="/login"
                className="flex items-center gap-1 font-semibold text-stone-600 hover:text-stone-900 px-2 py-1"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Log In</span>
              </Link>
              <Link
                href="/signup"
                className="rounded border border-stone-900 bg-stone-900 px-3 py-1 font-bold text-white shadow-xs hover:bg-stone-800 transition tracking-wide"
              >
                Sign Up &rarr;
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
