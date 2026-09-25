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
  CheckCircle,
  AlertCircle,
  Sparkles,
  ArrowRight,
  BookOpen
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  description?: string;
}

// Map category names to icons for rich visual UI
const categoryIcons: Record<string, React.ReactNode> = {
  Technology: <Cpu className="h-5 w-5" />,
  Science: <FlaskConical className="h-5 w-5" />,
  Business: <Briefcase className="h-5 w-5" />,
  World: <Globe className="h-5 w-5" />,
  Politics: <Landmark className="h-5 w-5" />,
  Health: <HeartPulse className="h-5 w-5" />,
  Finance: <Coins className="h-5 w-5" />,
  Sports: <Trophy className="h-5 w-5" />,
  Entertainment: <Film className="h-5 w-5" />,
  History: <Hourglass className="h-5 w-5" />,
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

      // If categories table is empty or error, use standard categories list
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
      // 1. Delete removed categories
      const { error: deleteError } = await supabase
        .from('user_categories')
        .delete()
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      // 2. Insert new selected categories
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

      setMessage({ type: 'success', text: 'Interests saved successfully!' });
    } catch (err: unknown) {
      const text = err instanceof Error ? err.message : 'Failed to save interests.';
      setMessage({ type: 'error', text });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="text-slate-500 font-medium animate-pulse">Loading topics & interests...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-100/70 px-2.5 py-1 rounded-full mb-2">
              <BookOpen className="h-3.5 w-3.5" />
              <span>Step 5: Topic System</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Choose Your Topics</h1>
            <p className="text-sm text-slate-500 mt-1">
              Select the subjects you want NUGGET to turn into your daily verified learning feed.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 disabled:opacity-50 transition"
            >
              <Sparkles className="h-4 w-4" />
              <span>{saving ? 'Saving...' : 'Save Interests'}</span>
            </button>
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              <span>Done</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {message && (
          <div
            className={`mb-6 flex items-center gap-2 rounded-xl p-4 text-sm ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => {
            const isSelected = selectedCategoryIds.has(cat.id);
            const icon = categoryIcons[cat.name] || <BookOpen className="h-5 w-5" />;

            return (
              <div
                key={cat.id}
                onClick={() => toggleCategory(cat.id)}
                className={`relative cursor-pointer rounded-2xl p-5 border transition-all select-none ${
                  isSelected
                    ? 'bg-amber-50/60 border-amber-300 ring-2 ring-amber-400/30 shadow-sm'
                    : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${
                      isSelected
                        ? 'bg-amber-500 text-white shadow-sm shadow-amber-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {icon}
                  </div>
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-full border transition ${
                      isSelected
                        ? 'bg-amber-500 border-amber-500 text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isSelected && <CheckCircle className="h-4 w-4" />}
                  </div>
                </div>

                <div className="mt-4">
                  <h3 className="font-semibold text-slate-900 text-base">{cat.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {cat.description || `Curated, verified nuggets in ${cat.name.toLowerCase()}.`}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-slate-900">
                Selected {selectedCategoryIds.size} of {categories.length} Topics
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                We use these topics to populate &quot;Today&apos;s Nuggets&quot; on your daily feed.
              </p>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 disabled:opacity-50 transition"
            >
              <Sparkles className="h-4 w-4" />
              <span>{saving ? 'Saving...' : 'Save Interests'}</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
