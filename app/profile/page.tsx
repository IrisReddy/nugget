'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import { Save, Check, AlertCircle, Award, Flame, Calendar, Terminal } from 'lucide-react';

interface ProfileData {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  total_xp: number;
  current_streak: number;
  longest_streak: number;
  last_read_date: string | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      setEmail(user.email || '');

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
      }

      if (data) {
        setProfile(data);
        setUsername(data.username || '');
        setDisplayName(data.display_name || '');
      } else {
        const initialProfile: ProfileData = {
          id: user.id,
          username: user.email?.split('@')[0] || '',
          display_name: user.email?.split('@')[0] || '',
          avatar_url: null,
          total_xp: 0,
          current_streak: 0,
          longest_streak: 0,
          last_read_date: null,
        };
        setProfile(initialProfile);
        setUsername(initialProfile.username);
        setDisplayName(initialProfile.display_name);
      }

      setLoading(false);
    }

    fetchProfile();
  }, [router]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setSaving(true);
    setStatusMessage(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: profile.id,
          username,
          display_name: displayName,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      setStatusMessage({ type: 'success', text: 'PROFILE_UPDATED_SUCCESSFULLY' });
      setProfile((prev) => (prev ? { ...prev, username, display_name: displayName } : null));
    } catch (err: unknown) {
      const text = err instanceof Error ? err.message : 'FAILED_TO_UPDATE_PROFILE';
      setStatusMessage({ type: 'error', text });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="font-mono text-xs uppercase tracking-widest text-stone-500 animate-pulse">
            [SYS_QUERY] Fetching researcher profile...
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        <div className="mb-6 border-b border-stone-300 pb-4">
          <div className="inline-flex items-center gap-1.5 font-mono text-[10px] text-stone-500 uppercase tracking-widest mb-1.5">
            <Terminal className="h-3 w-3" />
            <span>IDENTITY // DOSSIER</span>
          </div>
          <h1 className="font-mono text-2xl sm:text-3xl font-black text-stone-900 uppercase tracking-tight">
            RESEARCHER_PROFILE
          </h1>
          <p className="text-xs text-stone-500 mt-1 font-sans">
            Manage your credentials and inspect your telemetry and habit streaks.
          </p>
        </div>

        {statusMessage && (
          <div
            className={`mb-6 flex items-center gap-2 rounded border p-3 font-mono text-xs ${
              statusMessage.type === 'success'
                ? 'border-emerald-300 bg-emerald-50/80 text-emerald-800'
                : 'border-rose-300 bg-rose-50/80 text-rose-800'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <Check className="h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            )}
            <span>[{statusMessage.text}]</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Stats Column */}
          <div className="space-y-3">
            <div className="rounded-xl border border-stone-200 bg-white/95 p-5 shadow-2xs">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-3 border-b border-stone-100 pb-2">
                TELEMETRY_LOG
              </span>

              <div className="space-y-4">
                <div>
                  <div className="font-mono text-[10px] text-stone-400 uppercase flex items-center gap-1">
                    <Award className="h-3 w-3 text-amber-500" />
                    TOTAL_XP
                  </div>
                  <div className="font-mono text-2xl font-black text-stone-900 mt-0.5">
                    {profile?.total_xp ?? 0} <span className="text-xs font-normal text-stone-500">XP</span>
                  </div>
                </div>

                <div>
                  <div className="font-mono text-[10px] text-stone-400 uppercase flex items-center gap-1">
                    <Flame className="h-3 w-3 text-orange-500" />
                    CURRENT_STREAK
                  </div>
                  <div className="font-mono text-2xl font-black text-stone-900 mt-0.5">
                    {profile?.current_streak ?? 0} <span className="text-xs font-normal text-stone-500">DAYS</span>
                  </div>
                </div>

                <div>
                  <div className="font-mono text-[10px] text-stone-400 uppercase flex items-center gap-1">
                    <Flame className="h-3 w-3 text-purple-500" />
                    LONGEST_STREAK
                  </div>
                  <div className="font-mono text-2xl font-black text-stone-900 mt-0.5">
                    {profile?.longest_streak ?? 0} <span className="text-xs font-normal text-stone-500">DAYS</span>
                  </div>
                </div>

                <div className="border-t border-stone-100 pt-3">
                  <div className="font-mono text-[10px] text-stone-400 uppercase flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-stone-500" />
                    LAST_READ_TIMESTAMP
                  </div>
                  <div className="font-mono text-xs font-semibold text-stone-800 mt-0.5">
                    {profile?.last_read_date ? profile.last_read_date : '[NO_SESSION_RECORDED]'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Edit Profile Form */}
          <div className="md:col-span-2">
            <div className="rounded-xl border border-stone-200 bg-white/95 p-5 sm:p-7 shadow-2xs">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-5 border-b border-stone-100 pb-2">
                CREDENTIAL_CONFIG
              </span>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-stone-500 mb-1">
                    ACCOUNT_EMAIL (READ_ONLY)
                  </label>
                  <input
                    type="email"
                    disabled
                    value={email}
                    className="w-full rounded border border-stone-200 bg-stone-50 px-3.5 py-2 font-mono text-xs text-stone-500 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-stone-600 mb-1">
                    DISPLAY_NAME
                  </label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Alex Turing"
                    className="w-full rounded border border-stone-300 bg-white px-3.5 py-2 text-xs font-sans focus:border-stone-900 focus:outline-hidden"
                  />
                  <p className="font-mono text-[10px] text-stone-400 mt-1">Visible on daily dashboard and briefs.</p>
                </div>

                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-stone-600 mb-1">
                    SYSTEM_HANDLE / USERNAME
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. alex_learner"
                    className="w-full rounded border border-stone-300 bg-white px-3.5 py-2 text-xs font-mono focus:border-stone-900 focus:outline-hidden"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 rounded border border-stone-900 bg-stone-900 px-4 py-2 font-mono text-xs font-bold text-white shadow-2xs hover:bg-stone-800 disabled:opacity-50 transition uppercase tracking-wider"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>{saving ? 'UPDATING...' : 'SAVE_PROFILE'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
