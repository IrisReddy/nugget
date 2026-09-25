'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import { Mail, Lock, ArrowRight, Terminal } from 'lucide-react';

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
        <div className="w-full max-w-sm rounded-2xl border border-stone-300 bg-white/95 p-7 shadow-xs graph-paper-bg">
          <div className="mb-6">
            <div className="flex items-center gap-1.5 font-mono text-[10px] text-stone-500 uppercase tracking-widest mb-1.5">
              <Terminal className="h-3 w-3" />
              <span>AUTH // GATEWAY</span>
            </div>
            <h1 className="font-mono text-xl font-black text-stone-900 uppercase tracking-tight">
              SESSION_LOGIN
            </h1>
            <p className="text-xs text-stone-500 mt-1 font-sans">
              Enter your credentials to resume your daily verified feeds.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 rounded border border-rose-300 bg-rose-50/80 p-3 font-mono text-xs text-rose-800">
              [{errorMsg}]
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-stone-500 mb-1">
                EMAIL_IDENTIFIER
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-3.5 w-3.5 text-stone-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="researcher@nugget.io"
                  className="w-full rounded border border-stone-300 bg-white pl-9 pr-3 py-2 font-mono text-xs focus:border-stone-900 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-stone-500 mb-1">
                ACCESS_PASSPHRASE
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-stone-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded border border-stone-300 bg-white pl-9 pr-3 py-2 font-mono text-xs focus:border-stone-900 focus:outline-hidden"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-1.5 rounded border border-stone-900 bg-stone-900 py-2.5 font-mono text-xs font-bold text-white shadow-2xs hover:bg-stone-800 disabled:opacity-50 transition uppercase tracking-wider"
            >
              <span>{loading ? 'AUTHENTICATING...' : 'ESTABLISH_SESSION'}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>

          <p className="mt-5 text-center font-mono text-xs text-stone-500 border-t border-stone-100 pt-4">
            NO_ACCOUNT?{' '}
            <Link href="/signup" className="font-bold text-stone-900 hover:underline">
              REGISTER &rarr;
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
