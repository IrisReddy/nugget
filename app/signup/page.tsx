'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import { Mail, Lock, User as UserIcon, ArrowRight, Terminal, Check } from 'lucide-react';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          display_name: displayName || email.split('@')[0],
          username: displayName?.toLowerCase().replace(/\s+/g, '_') || email.split('@')[0],
        });
      }

      if (data.session) {
        setMessage({ type: 'success', text: 'ACCOUNT_PROVISIONED_SUCCESSFULLY' });
        setTimeout(() => router.push('/topics'), 1500);
      } else {
        setMessage({
          type: 'success',
          text: 'VERIFICATION_DISPATCHED: Check your email inbox to confirm registration.',
        });
      }
    } catch (err: unknown) {
      const text = err instanceof Error ? err.message : 'REGISTRATION_FAILED';
      setMessage({ type: 'error', text });
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
              <span>REGISTRATION // IDENTITY_INIT</span>
            </div>
            <h1 className="font-mono text-xl font-black text-stone-900 uppercase tracking-tight">
              CREATE_ACCOUNT
            </h1>
            <p className="text-xs text-stone-500 mt-1 font-sans">
              Provision a new NUGGET researcher profile to track verified learning streaks.
            </p>
          </div>

          {message && (
            <div
              className={`mb-4 rounded border p-3 font-mono text-xs ${
                message.type === 'success'
                  ? 'border-emerald-300 bg-emerald-50/80 text-emerald-800'
                  : 'border-rose-300 bg-rose-50/80 text-rose-800'
              }`}
            >
              {message.type === 'success' && <Check className="inline h-3.5 w-3.5 mr-1 text-emerald-600" />}
              [{message.text}]
            </div>
          )}

          <form onSubmit={handleSignUp} className="space-y-3.5">
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-stone-500 mb-1">
                DISPLAY_NAME
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-2.5 h-3.5 w-3.5 text-stone-400" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Alex Turing"
                  className="w-full rounded border border-stone-300 bg-white pl-9 pr-3 py-2 text-xs font-sans focus:border-stone-900 focus:outline-hidden"
                />
              </div>
            </div>

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
                PASSPHRASE
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-stone-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  className="w-full rounded border border-stone-300 bg-white pl-9 pr-3 py-2 font-mono text-xs focus:border-stone-900 focus:outline-hidden"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-1.5 rounded border border-stone-900 bg-stone-900 py-2.5 font-mono text-xs font-bold text-white shadow-2xs hover:bg-stone-800 disabled:opacity-50 transition uppercase tracking-wider"
            >
              <span>{loading ? 'PROVISIONING...' : 'INITIALIZE_ACCOUNT'}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>

          <p className="mt-5 text-center font-mono text-xs text-stone-500 border-t border-stone-100 pt-4">
            ALREADY_REGISTERED?{' '}
            <Link href="/login" className="font-bold text-stone-900 hover:underline">
              SIGN_IN &rarr;
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
