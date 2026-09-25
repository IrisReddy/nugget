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
  Terminal,
  Save
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
        console.warn('No categories found from Supabase, using standard categories list.');
        loadedCategories = defaultCategoryList.map((name, i) => ({
          id: `cat-${i + 1}`,
          name,
        }));
      }

      setCategories(loadedCategories);

      // 2. Fetch existing user selections
      const { data: userCats, error: userCatsError } = await supabase
        .from('user_categories')
        .select('category_id, interest_level')
        .eq('user_id', user.id);

      if (userCatsError) {
        console.error('Error fetching user categories:', userCatsError);
      }

      if (userCats && userCats.length > 0) {
        const selectedSet = new Set<string>(userCats.map((item) => item.category_id));
        setSelectedCategoryIds(selectedSet);
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
      }
      return next;
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

      // 2. Insert new selections
      if (selectedCategoryIds.size > 0) {
        const rowsToInsert = Array.from(selectedCategoryIds).map((catId) => ({
          user_id: userId,
          category_id: catId,
          interest_level: 1,
        }));

        const { error: insertError } = await supabase
          .from('user_categories')
          .insert(rowsToInsert);

        if (insertError) throw insertError;
      }

      setMessage({ type: 'success', text: 'TOPIC_PREFERENCES_SAVED_SUCCESSFULLY' });
    } catch (err: unknown) {
      const text = err instanceof Error ? err.message : 'FAILED_TO_SAVE_PREFERENCES';
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
          <div className="font-mono text-xs uppercase tracking-widest text-stone-500 animate-pulse">
            [SYS_QUERY] Fetching taxonomy & user interests...
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 border-b border-stone-300 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 font-mono text-[10px] text-stone-500 uppercase tracking-widest mb-1.5">
              <Terminal className="h-3 w-3" />
              <span>STEP: 05 // TAXONOMY_SUBSCRIPTIONS</span>
            </div>
            <h1 className="font-mono text-2xl sm:text-3xl font-black text-stone-900 uppercase tracking-tight">
              INTEREST_SELECTION
            </h1>
            <p className="text-xs text-stone-500 mt-1 font-sans">
              Select primary categories to route daily multi-source briefing nuggets to your ledger.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded border border-stone-900 bg-stone-900 px-4 py-2 font-mono text-xs font-bold text-white shadow-2xs hover:bg-stone-800 disabled:opacity-50 transition uppercase tracking-wider"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{saving ? 'SAVING...' : 'SAVE_SELECTION'}</span>
            </button>
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center gap-1.5 rounded border border-stone-300 bg-white px-3 py-2 font-mono text-xs font-semibold text-stone-700 hover:bg-stone-50 transition uppercase tracking-wider"
            >
              <span>DASHBOARD</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {message && (
          <div
            className={`mb-6 flex items-center gap-2 rounded border p-3 font-mono text-xs ${
              message.type === 'success'
                ? 'border-emerald-300 bg-emerald-50/80 text-emerald-800'
                : 'border-rose-300 bg-rose-50/80 text-rose-800'
            }`}
          >
            {message.type === 'success' ? (
              <Check className="h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            )}
            <span>[{message.text}]</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {categories.map((cat, index) => {
            const isSelected = selectedCategoryIds.has(cat.id);
            const icon = categoryIcons[cat.name] || <BookOpen className="h-4 w-4" />;
            const indexStr = String(index + 1).padStart(2, '0');

            return (
              <div
                key={cat.id}
                onClick={() => toggleCategory(cat.id)}
                className={`relative cursor-pointer rounded-xl p-4 border transition-all select-none ${
                  isSelected
                    ? 'border-stone-900 bg-white shadow-xs ring-1 ring-stone-900'
                    : 'border-stone-200 bg-white/80 hover:border-stone-400 hover:bg-white'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded border transition ${
                        isSelected
                          ? 'border-stone-900 bg-stone-900 text-white'
                          : 'border-stone-200 bg-stone-100 text-stone-600'
                      }`}
                    >
                      {icon}
                    </div>
                    <span className="font-mono text-[11px] text-stone-600">[{indexStr}]</span>
                  </div>

                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded border font-mono text-[10px] transition ${
                      isSelected
                        ? 'border-stone-900 bg-stone-900 text-white font-bold'
                        : 'border-stone-300 bg-white text-transparent'
                    }`}
                  >
                    <Check className="h-3 w-3" />
                  </div>
                </div>

                <div className="mt-3">
                  <h3 className="font-mono text-sm font-bold text-stone-900 uppercase tracking-tight">
                    {cat.name}
                  </h3>
                  <p className="text-[11px] text-stone-500 mt-1 line-clamp-2 font-sans">
                    {cat.description || `Curated, verified daily nuggets in ${cat.name.toLowerCase()}.`}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Ledger Bottom Summary */}
        <div className="mt-6 rounded-xl border border-stone-200 bg-white p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="font-mono text-xs text-stone-600">
            TOTAL_SELECTED: <span className="font-bold text-stone-900">{selectedCategoryIds.size}</span> OF{' '}
            <span className="font-bold text-stone-900">{categories.length}</span> TOPICS
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center justify-center gap-1.5 rounded border border-stone-900 bg-stone-900 px-4 py-2 font-mono text-xs font-bold text-white shadow-2xs hover:bg-stone-800 disabled:opacity-50 transition uppercase tracking-wider"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{saving ? 'SAVING...' : 'COMMIT_SELECTION'}</span>
          </button>
        </div>
      </main>
    </div>
  );
}
