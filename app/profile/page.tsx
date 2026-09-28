'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import AwardBadge from '@/components/AwardBadge';
import { Save, Check, AlertCircle, Award, Flame, Calendar, User as UserIcon } from 'lucide-react';

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
        // Fix 0-day streak defense if user has earned XP
        if ((data.total_xp || 0) > 0 && (!data.current_streak || data.current_streak === 0)) {
          const today = new Date().toISOString().split('T')[0];
          await supabase.from('profiles').update({ current_streak: 1, last_read_date: today }).eq('id', user.id);
          data.current_streak = 1;
        }
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

      setStatusMessage({ type: 'success', text: 'Profile updated successfully.' });
      setProfile((prev) => (prev ? { ...prev, username, display_name: displayName } : null));
    } catch (err: unknown) {
      const text = err instanceof Error ? err.message : 'Failed to update profile.';
      setStatusMessage({ type: 'error', text });
    } finally {
      setSaving(false);
    }
  };

  const streakDisplay = (profile?.current_streak && profile.current_streak > 0)
    ? profile.current_streak
    : ((profile?.total_xp || 0) > 0 ? 1 : 0);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-widest text-[#7A6652] dark:text-[#BEB5A9] animate-pulse">
            <AwardBadge className="h-5 w-5 animate-spin text-amber-500" />
            <span>Loading researcher profile...</span>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        <div className="mb-6 border-b border-[#E1D4C2] dark:border-[#6E473B] pb-4">
          <div className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-widest mb-1.5">
            <UserIcon className="h-3.5 w-3.5" />
            <span>Scholar Identity & Preferences</span>
          </div>
          <h1 className="font-mono text-2xl sm:text-3xl font-black text-[#291C0E] dark:text-[#E1D4C2] uppercase tracking-tight">
            Researcher Profile
          </h1>
          <p className="text-xs text-[#6E473B] dark:text-[#BEB5A9] mt-1 font-sans">
            Manage your credentials and inspect your telemetry and habit streaks.
          </p>
        </div>

        {statusMessage && (
          <div
            className={`mb-6 flex items-center gap-2 rounded-xl border p-3.5 font-mono text-xs ${
              statusMessage.type === 'success'
                ? 'border-emerald-300 dark:border-emerald-500/40 bg-emerald-50/90 dark:bg-[#482D1E] text-emerald-800 dark:text-emerald-300'
                : 'border-rose-300 dark:border-rose-500/40 bg-rose-50/90 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <Check className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Stats Column */}
          <div className="space-y-3">
            <div className="rounded-xl border border-[#E1D4C2] dark:border-[#6E473B] bg-white/95 dark:bg-[#362215] p-5 shadow-2xs">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#A78D78] dark:text-[#BEB5A9] block mb-3 border-b border-[#E1D4C2] dark:border-[#6E473B] pb-2">
                Activity Telemetry
              </span>

              <div className="space-y-4">
                <div>
                  <div className="font-mono text-[10px] text-[#A78D78] dark:text-[#BEB5A9] uppercase flex items-center gap-1.5">
                    <AwardBadge className="h-3.5 w-3.5 text-amber-500" />
                    Total XP
                  </div>
                  <div className="font-mono text-2xl font-black text-[#291C0E] dark:text-[#E1D4C2] mt-0.5">
                    {profile?.total_xp ?? 0} <span className="text-xs font-normal text-[#A78D78] dark:text-[#BEB5A9]">XP</span>
                  </div>
                </div>

                <div>
                  <div className="font-mono text-[10px] text-[#A78D78] dark:text-[#BEB5A9] uppercase flex items-center gap-1">
                    <Flame className="h-3 w-3 text-orange-500" />
                    Current Streak
                  </div>
                  <div className="font-mono text-2xl font-black text-[#291C0E] dark:text-[#E1D4C2] mt-0.5">
                    {streakDisplay} <span className="text-xs font-normal text-[#A78D78] dark:text-[#BEB5A9]">DAYS</span>
                  </div>
                </div>

                <div>
                  <div className="font-mono text-[10px] text-[#A78D78] dark:text-[#BEB5A9] uppercase flex items-center gap-1">
                    <Award className="h-3 w-3 text-purple-500" />
                    Longest Streak
                  </div>
                  <div className="font-mono text-2xl font-black text-[#291C0E] dark:text-[#E1D4C2] mt-0.5">
                    {Math.max(streakDisplay, profile?.longest_streak ?? 0)}{' '}
                    <span className="text-xs font-normal text-[#A78D78] dark:text-[#BEB5A9]">DAYS</span>
                  </div>
                </div>

                <div className="border-t border-[#E1D4C2] dark:border-[#6E473B] pt-3">
                  <div className="font-mono text-[10px] text-[#A78D78] dark:text-[#BEB5A9] uppercase flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-[#A78D78]" />
                    Last Read Date
                  </div>
                  <div className="font-mono text-xs font-semibold text-[#291C0E] dark:text-[#E1D4C2] mt-0.5">
                    {profile?.last_read_date ? profile.last_read_date : 'No reading session yet'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Edit Profile Form */}
          <div className="md:col-span-2">
            <div className="rounded-xl border border-[#E1D4C2] dark:border-[#6E473B] bg-white/95 dark:bg-[#362215] p-5 sm:p-7 shadow-2xs">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#A78D78] dark:text-[#BEB5A9] block mb-5 border-b border-[#E1D4C2] dark:border-[#6E473B] pb-2">
                Account Details
              </span>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="block font-mono text-xs uppercase tracking-wider text-[#6E473B] dark:text-[#BEB5A9] mb-1">
                    Account Email (Read-Only)
                  </label>
                  <input
                    type="email"
                    disabled
                    value={email}
                    className="w-full rounded-lg border border-[#E1D4C2] dark:border-[#6E473B] bg-stone-50 dark:bg-[#482D1E]/50 px-3.5 py-2 font-mono text-xs text-stone-500 dark:text-[#BEB5A9] cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block font-mono text-xs uppercase tracking-wider text-[#291C0E] dark:text-[#E1D4C2] mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Alex Turing"
                    className="w-full rounded-lg border border-[#BEB5A9] dark:border-[#6E473B] bg-white dark:bg-[#291C0E] text-[#291C0E] dark:text-[#E1D4C2] px-3.5 py-2 text-xs font-sans focus:border-[#291C0E] dark:focus:border-amber-400 focus:outline-hidden"
                  />
                  <p className="font-mono text-[10px] text-[#A78D78] dark:text-[#BEB5A9] mt-1">
                    Visible on daily dashboard and briefs.
                  </p>
                </div>

                <div>
                  <label className="block font-mono text-xs uppercase tracking-wider text-[#291C0E] dark:text-[#E1D4C2] mb-1">
                    System Handle / Username
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. alex_learner"
                    className="w-full rounded-lg border border-[#BEB5A9] dark:border-[#6E473B] bg-white dark:bg-[#291C0E] text-[#291C0E] dark:text-[#E1D4C2] px-3.5 py-2 text-xs font-mono focus:border-[#291C0E] dark:focus:border-amber-400 focus:outline-hidden"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#291C0E] dark:border-[#A78D78] bg-[#291C0E] dark:bg-[#6E473B] px-4 py-2 font-mono text-xs font-bold text-white shadow-2xs hover:bg-[#6E473B] dark:hover:bg-[#482D1E] disabled:opacity-50 transition uppercase tracking-wider"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>{saving ? 'Updating...' : 'Save Profile'}</span>
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
