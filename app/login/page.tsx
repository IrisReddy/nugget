'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import AwardBadge from '@/components/AwardBadge';
import { Mail, Lock, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      router.push('/');
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Authentication failed.';
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-2xl border border-[#E1D4C2] dark:border-[#6E473B] bg-white/95 dark:bg-[#362215] p-7 shadow-xs graph-paper-bg">
          <div className="mb-6">
            <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-widest mb-1.5">
              <AwardBadge className="h-4 w-4 text-amber-500" />
              <span>Scholar Access</span>
            </div>
            <h1 className="font-mono text-xl font-black text-[#291C0E] dark:text-[#E1D4C2] uppercase tracking-tight">
              Log In
            </h1>
            <p className="text-xs text-[#6E473B] dark:text-[#BEB5A9] mt-1 font-sans">
              Enter your credentials to resume your daily verified feeds.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 rounded-lg border border-rose-300 dark:border-rose-500/40 bg-rose-50/90 dark:bg-rose-950/40 p-3 font-mono text-xs text-rose-800 dark:text-rose-200">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="block font-mono text-xs uppercase tracking-wider text-[#6E473B] dark:text-[#BEB5A9] mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#A78D78] dark:text-[#BEB5A9]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="researcher@nugget.io"
                  className="w-full rounded-lg border border-[#BEB5A9] dark:border-[#6E473B] bg-white dark:bg-[#291C0E] text-[#291C0E] dark:text-[#E1D4C2] pl-9 pr-3 py-2 font-mono text-xs focus:border-[#291C0E] dark:focus:border-amber-400 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block font-mono text-xs uppercase tracking-wider text-[#6E473B] dark:text-[#BEB5A9] mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#A78D78] dark:text-[#BEB5A9]" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-[#BEB5A9] dark:border-[#6E473B] bg-white dark:bg-[#291C0E] text-[#291C0E] dark:text-[#E1D4C2] pl-9 pr-3 py-2 font-mono text-xs focus:border-[#291C0E] dark:focus:border-amber-400 focus:outline-hidden"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-1.5 rounded-lg border border-[#291C0E] dark:border-[#A78D78] bg-[#291C0E] dark:bg-[#6E473B] py-2.5 font-mono text-xs font-bold text-white shadow-2xs hover:bg-[#6E473B] dark:hover:bg-[#482D1E] disabled:opacity-50 transition uppercase tracking-wider"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>

          <p className="mt-5 text-center font-mono text-xs text-[#6E473B] dark:text-[#BEB5A9] border-t border-[#E1D4C2] dark:border-[#6E473B] pt-4">
            Need an account?{' '}
            <Link href="/signup" className="font-bold text-[#291C0E] dark:text-[#E1D4C2] hover:underline">
              Create Account &rarr;
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
