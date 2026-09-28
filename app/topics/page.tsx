'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import AwardBadge from '@/components/AwardBadge';
import {
  Cpu,
  FlaskConical,
  Briefcase,
  Globe,
  Landmark,
  HeartPulse,
  Coins,
  Trophy,
  Film,
  Hourglass,
  Check,
  AlertCircle,
  ArrowRight,
  BookOpen,
  Save,
  Star
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  description?: string;
}

const categoryIcons: Record<string, React.ReactNode> = {
  Technology: <Cpu className="h-4 w-4" />,
  Science: <FlaskConical className="h-4 w-4" />,
  Business: <Briefcase className="h-4 w-4" />,
  World: <Globe className="h-4 w-4" />,
  Politics: <Landmark className="h-4 w-4" />,
  Health: <HeartPulse className="h-4 w-4" />,
  Finance: <Coins className="h-4 w-4" />,
  Sports: <Trophy className="h-4 w-4" />,
  Entertainment: <Film className="h-4 w-4" />,
  History: <Hourglass className="h-4 w-4" />,
};

const defaultCategoryList = [
  'Technology',
  'Science',
  'Business',
  'World',
  'Politics',
  'Health',
  'Finance',
  'Sports',
  'Entertainment',
  'History',
];

export default function TopicsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<string>>(new Set());
  const [interestLevels, setInterestLevels] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      setUserId(user.id);

      // 1. Fetch categories from Supabase
      const { data: catData, error: catError } = await supabase
        .from('categories')
        .select('id, name, description')
        .order('name');

      if (catError) {
        console.error('Error fetching categories:', catError);
      }

      let loadedCategories: Category[] = catData || [];

      if (!catData || catData.length === 0) {
        loadedCategories = defaultCategoryList.map((name, i) => ({
          id: `cat-${i + 1}`,
          name,
        }));
      }

      setCategories(loadedCategories);

      // 2. Fetch existing user selections & interest levels
      const { data: userCats, error: userCatsError } = await supabase
        .from('user_categories')
        .select('category_id, interest_level')
        .eq('user_id', user.id);

      if (userCatsError) {
        console.error('Error fetching user categories:', userCatsError);
      }

      if (userCats && userCats.length > 0) {
        const selectedSet = new Set<string>();
        const levels: Record<string, number> = {};
        userCats.forEach((item) => {
          selectedSet.add(item.category_id);
          levels[item.category_id] = item.interest_level || 1;
        });
        setSelectedCategoryIds(selectedSet);
        setInterestLevels(levels);
      }

      setLoading(false);
    }

    loadData();
  }, [router]);

  const toggleCategory = (catId: string) => {
    setSelectedCategoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) {
        next.delete(catId);
      } else {
        next.add(catId);
        // Default to standard priority if not set
        if (!interestLevels[catId]) {
          setInterestLevels((l) => ({ ...l, [catId]: 1 }));
        }
      }
      return next;
    });
  };

  const togglePriority = (catId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setInterestLevels((prev) => {
      const current = prev[catId] || 1;
      return {
        ...prev,
        [catId]: current === 1 ? 2 : 1,
      };
    });
  };

  const handleSave = async () => {
    if (!userId) return;

    setSaving(true);
    setMessage(null);

    try {
      // 1. Delete old selections
      const { error: deleteError } = await supabase
        .from('user_categories')
        .delete()
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      // 2. Insert new selections with interest levels
      if (selectedCategoryIds.size > 0) {
        const rowsToInsert = Array.from(selectedCategoryIds).map((catId) => ({
          user_id: userId,
          category_id: catId,
          interest_level: interestLevels[catId] || 1,
        }));

        const { error: insertError } = await supabase
          .from('user_categories')
          .insert(rowsToInsert);

        if (insertError) throw insertError;
      }

      setMessage({ type: 'success', text: 'Topic preferences and priorities saved successfully.' });
    } catch (err: unknown) {
      const text = err instanceof Error ? err.message : 'Failed to save preferences.';
      setMessage({ type: 'error', text });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-widest text-[#7A6652] dark:text-[#BEB5A9] animate-pulse">
            <AwardBadge className="h-5 w-5 animate-spin text-amber-500" />
            <span>Loading topic taxonomy and preferences...</span>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 border-b border-[#E1D4C2] dark:border-[#6E473B] pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-widest mb-1.5">
              <AwardBadge className="h-3.5 w-3.5 text-amber-500" />
              <span>Curated Knowledge Taxonomy</span>
            </div>
            <h1 className="font-mono text-2xl sm:text-3xl font-black text-[#291C0E] dark:text-[#E1D4C2] uppercase tracking-tight">
              Topic Subscriptions
            </h1>
            <p className="text-xs text-[#6E473B] dark:text-[#BEB5A9] mt-1 font-sans">
              Choose your focus areas and set priority levels to tune your daily briefing feed.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#291C0E] dark:border-[#A78D78] bg-[#291C0E] dark:bg-[#6E473B] px-4 py-2 font-mono text-xs font-bold text-white shadow-2xs hover:bg-[#6E473B] dark:hover:bg-[#482D1E] disabled:opacity-50 transition uppercase tracking-wider"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{saving ? 'Saving...' : 'Save Preferences'}</span>
            </button>
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#E1D4C2] dark:border-[#6E473B] bg-white dark:bg-[#362215] px-3.5 py-2 font-mono text-xs font-semibold text-[#291C0E] dark:text-[#E1D4C2] hover:bg-[#E1D4C2]/40 dark:hover:bg-[#482D1E] transition uppercase tracking-wider"
            >
              <span>Dashboard</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {message && (
          <div
            className={`mb-6 flex items-center gap-2 rounded-xl border p-3.5 font-mono text-xs ${
              message.type === 'success'
                ? 'border-emerald-300 dark:border-emerald-500/40 bg-emerald-50/90 dark:bg-[#482D1E] text-emerald-800 dark:text-emerald-300'
                : 'border-rose-300 dark:border-rose-500/40 bg-rose-50/90 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200'
            }`}
          >
            {message.type === 'success' ? (
              <Check className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {categories.map((cat) => {
            const isSelected = selectedCategoryIds.has(cat.id);
            const isHighPriority = interestLevels[cat.id] === 2;
            const icon = categoryIcons[cat.name] || <BookOpen className="h-4 w-4" />;

            return (
              <div
                key={cat.id}
                onClick={() => toggleCategory(cat.id)}
                className={`relative cursor-pointer rounded-xl p-4 border transition-all select-none flex flex-col justify-between ${
                  isSelected
                    ? 'border-[#291C0E] dark:border-[#A78D78] bg-white dark:bg-[#362215] shadow-xs ring-1 ring-[#291C0E] dark:ring-[#A78D78]'
                    : 'border-[#E1D4C2] dark:border-[#6E473B] bg-white/80 dark:bg-[#362215]/60 hover:border-[#BEB5A9] dark:hover:border-[#A78D78] hover:bg-white dark:hover:bg-[#362215]'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${
                          isSelected
                            ? 'border-[#291C0E] dark:border-[#A78D78] bg-[#291C0E] dark:bg-[#6E473B] text-white'
                            : 'border-[#E1D4C2] dark:border-[#6E473B] bg-[#F5EFEB] dark:bg-[#482D1E] text-[#6E473B] dark:text-[#BEB5A9]'
                        }`}
                      >
                        {icon}
                      </div>
                      <span className="font-mono text-xs font-bold text-[#291C0E] dark:text-[#E1D4C2]">
                        {cat.name}
                      </span>
                    </div>

                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded border font-mono text-[10px] transition ${
                        isSelected
                          ? 'border-[#291C0E] dark:border-[#A78D78] bg-[#291C0E] dark:bg-[#6E473B] text-white font-bold'
                          : 'border-[#E1D4C2] dark:border-[#6E473B] bg-white dark:bg-[#362215] text-transparent'
                      }`}
                    >
                      <Check className="h-3 w-3" />
                    </div>
                  </div>

                  <p className="text-xs text-[#6E473B] dark:text-[#BEB5A9] mt-2.5 line-clamp-2 font-sans">
                    {cat.description || `Curated, verified daily nuggets in ${cat.name.toLowerCase()}.`}
                  </p>
                </div>

                {/* Priority Tuning Controls */}
                {isSelected && (
                  <div className="mt-3.5 pt-2.5 border-t border-[#E1D4C2] dark:border-[#6E473B] flex items-center justify-between">
                    <span className="font-mono text-[10px] text-[#A78D78] dark:text-[#BEB5A9]">
                      Weight:
                    </span>
                    <button
                      type="button"
                      onClick={(e) => togglePriority(cat.id, e)}
                      title="Click to toggle priority weighting"
                      className={`inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 rounded border transition ${
                        isHighPriority
                          ? 'border-amber-300 dark:border-amber-500/50 bg-amber-50 dark:bg-[#482D1E] text-amber-700 dark:text-amber-300'
                          : 'border-[#E1D4C2] dark:border-[#6E473B] bg-[#F5EFEB] dark:bg-[#482D1E] text-[#6E473B] dark:text-[#BEB5A9]'
                      }`}
                    >
                      <Star className={`h-2.5 w-2.5 ${isHighPriority ? 'fill-amber-400 text-amber-500' : ''}`} />
                      <span>{isHighPriority ? 'High Priority (2x)' : 'Standard (1x)'}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Summary Bar */}
        <div className="mt-6 rounded-xl border border-[#E1D4C2] dark:border-[#6E473B] bg-white dark:bg-[#362215] p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="font-mono text-xs text-[#6E473B] dark:text-[#BEB5A9]">
            Active subscriptions: <span className="font-bold text-[#291C0E] dark:text-[#E1D4C2]">{selectedCategoryIds.size}</span> of{' '}
            <span className="font-bold text-[#291C0E] dark:text-[#E1D4C2]">{categories.length}</span> topics
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#291C0E] dark:border-[#A78D78] bg-[#291C0E] dark:bg-[#6E473B] px-4 py-2 font-mono text-xs font-bold text-white shadow-2xs hover:bg-[#6E473B] dark:hover:bg-[#482D1E] disabled:opacity-50 transition uppercase tracking-wider"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{saving ? 'Saving...' : 'Save Preferences'}</span>
          </button>
        </div>
      </main>
    </div>
  );
}
