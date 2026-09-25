'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
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
  Compass,
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
          <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-widest text-stone-500 dark:text-[#8BA3C7] animate-pulse">
            <Compass className="h-4 w-4 animate-spin text-amber-500" />
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 border-b border-stone-200 dark:border-[#1A3F75] pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-widest mb-1.5">
              <Compass className="h-3.5 w-3.5" />
              <span>Curated Knowledge Taxonomy</span>
            </div>
            <h1 className="font-mono text-2xl sm:text-3xl font-black text-stone-900 dark:text-[#D4E4EC] uppercase tracking-tight">
              Topic Subscriptions
            </h1>
            <p className="text-xs text-stone-600 dark:text-[#8BA3C7] mt-1 font-sans">
              Choose your focus areas and set priority levels to tune your daily briefing feed.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-900 dark:border-[#3B628A] bg-stone-900 dark:bg-[#1A3F75] px-4 py-2 font-mono text-xs font-bold text-white shadow-2xs hover:bg-stone-800 dark:hover:bg-[#13264D] disabled:opacity-50 transition uppercase tracking-wider"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{saving ? 'Saving...' : 'Save Preferences'}</span>
            </button>
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 dark:border-[#1A3F75] bg-white dark:bg-[#0A1333] px-3.5 py-2 font-mono text-xs font-semibold text-stone-700 dark:text-[#D4E4EC] hover:bg-stone-50 dark:hover:bg-[#13264D] transition uppercase tracking-wider"
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
                ? 'border-emerald-300 dark:border-emerald-500/40 bg-emerald-50/90 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200'
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
                    ? 'border-stone-900 dark:border-[#3B628A] bg-white dark:bg-[#0A1333] shadow-xs ring-1 ring-stone-900 dark:ring-[#3B628A]'
                    : 'border-stone-200 dark:border-[#1A3F75] bg-white/80 dark:bg-[#0A1333]/60 hover:border-stone-400 dark:hover:border-[#3B628A] hover:bg-white dark:hover:bg-[#0A1333]'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${
                          isSelected
                            ? 'border-stone-900 dark:border-[#3B628A] bg-stone-900 dark:bg-[#1A3F75] text-white'
                            : 'border-stone-200 dark:border-[#1A3F75] bg-stone-100 dark:bg-[#13264D] text-stone-600 dark:text-[#8BA3C7]'
                        }`}
                      >
                        {icon}
                      </div>
                      <span className="font-mono text-xs font-bold text-stone-900 dark:text-[#D4E4EC]">
                        {cat.name}
                      </span>
                    </div>

                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded border font-mono text-[10px] transition ${
                        isSelected
                          ? 'border-stone-900 dark:border-[#3B628A] bg-stone-900 dark:bg-[#1A3F75] text-white font-bold'
                          : 'border-stone-300 dark:border-[#1A3F75] bg-white dark:bg-[#0A1333] text-transparent'
                      }`}
                    >
                      <Check className="h-3 w-3" />
                    </div>
                  </div>

                  <p className="text-xs text-stone-500 dark:text-[#8BA3C7] mt-2.5 line-clamp-2 font-sans">
                    {cat.description || `Curated, verified daily nuggets in ${cat.name.toLowerCase()}.`}
                  </p>
                </div>

                {/* Priority Tuning Controls (Step 10 Personalization) */}
                {isSelected && (
                  <div className="mt-3.5 pt-2.5 border-t border-stone-100 dark:border-[#1A3F75] flex items-center justify-between">
                    <span className="font-mono text-[10px] text-stone-400 dark:text-[#8BA3C7]">
                      Weight:
                    </span>
                    <button
                      type="button"
                      onClick={(e) => togglePriority(cat.id, e)}
                      title="Click to toggle priority weighting"
                      className={`inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 rounded border transition ${
                        isHighPriority
                          ? 'border-amber-300 dark:border-amber-500/50 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                          : 'border-stone-200 dark:border-[#1A3F75] bg-stone-100 dark:bg-[#13264D] text-stone-600 dark:text-[#8BA3C7]'
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
        <div className="mt-6 rounded-xl border border-stone-200 dark:border-[#1A3F75] bg-white dark:bg-[#0A1333] p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="font-mono text-xs text-stone-600 dark:text-[#8BA3C7]">
            Active subscriptions: <span className="font-bold text-stone-900 dark:text-[#D4E4EC]">{selectedCategoryIds.size}</span> of{' '}
            <span className="font-bold text-stone-900 dark:text-[#D4E4EC]">{categories.length}</span> topics
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-stone-900 dark:border-[#3B628A] bg-stone-900 dark:bg-[#1A3F75] px-4 py-2 font-mono text-xs font-bold text-white shadow-2xs hover:bg-stone-800 dark:hover:bg-[#13264D] disabled:opacity-50 transition uppercase tracking-wider"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{saving ? 'Saving...' : 'Save Preferences'}</span>
          </button>
        </div>
      </main>
    </div>
  );
}
