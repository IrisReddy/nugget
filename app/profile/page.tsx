'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import { Save, CheckCircle, AlertCircle, Award, Flame, Calendar } from 'lucide-react';

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
        // Fallback if record does not yet exist
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

      setStatusMessage({ type: 'success', text: 'Profile saved successfully!' });
      setProfile((prev) => (prev ? { ...prev, username, display_name: displayName } : null));
    } catch (err: unknown) {
      const text = err instanceof Error ? err.message : 'Failed to update profile.';
      setStatusMessage({ type: 'error', text });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="text-slate-500 font-medium animate-pulse">Loading profile...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Your Profile</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your account identity and view your learning stats</p>
        </div>

        {statusMessage && (
          <div
            className={`mb-6 flex items-center gap-2 rounded-xl p-4 text-sm ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Stats Column */}
          <div className="space-y-4">
            <div className="rounded-2xl bg-white p-6 border border-slate-100 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">
                Learning Overview
              </h2>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
                    <Award className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Total XP</div>
                    <div className="text-lg font-bold text-slate-900">{profile?.total_xp ?? 0} XP</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600 border border-orange-200">
                    <Flame className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Current Streak</div>
                    <div className="text-lg font-bold text-slate-900">{profile?.current_streak ?? 0} Days</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 border border-purple-200">
                    <Flame className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Longest Streak</div>
                    <div className="text-lg font-bold text-slate-900">{profile?.longest_streak ?? 0} Days</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-600 border border-slate-200">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Last Read Date</div>
                    <div className="text-sm font-semibold text-slate-800">
                      {profile?.last_read_date ? profile.last_read_date : 'No sessions yet'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Edit Profile Form */}
          <div className="md:col-span-2">
            <div className="rounded-2xl bg-white p-6 sm:p-8 border border-slate-100 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-6">Profile Settings</h2>

              <form onSubmit={handleSaveProfile} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Account Email (Read-Only)
                  </label>
                  <input
                    type="email"
                    disabled
                    value={email}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-500 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your visible name"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                  <p className="text-xs text-slate-400 mt-1">This name appears on your dashboard greeting.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. alex_learner"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                  <p className="text-xs text-slate-400 mt-1">Unique handle for your NUGGET account.</p>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 disabled:opacity-50 transition"
                  >
                    <Save className="h-4 w-4" />
                    <span>{saving ? 'Saving...' : 'Save Profile'}</span>
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
