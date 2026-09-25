'use client';

import { useEffect, useState } from 'react';
import { calculateLevel } from '@/lib/xp';
import {
  X,
  Award,
  Flame,
  Sparkles,
  ShieldCheck,
  Compass,
  CheckCircle2,
  Lock
} from 'lucide-react';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  xp_reward: number;
  isUnlocked: boolean;
  earnedAt: string | null;
}

interface AchievementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  totalXp: number;
}

const iconMap: Record<string, React.ReactNode> = {
  Sparkles: <Sparkles className="h-4 w-4" />,
  Flame: <Flame className="h-4 w-4" />,
  Award: <Award className="h-4 w-4" />,
  Compass: <Compass className="h-4 w-4" />,
  ShieldCheck: <ShieldCheck className="h-4 w-4" />,
};

export default function AchievementsModal({
  isOpen,
  onClose,
  userId,
  totalXp,
}: AchievementsModalProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(false);

  const levelInfo = calculateLevel(totalXp);

  useEffect(() => {
    if (!isOpen) return;

    async function loadAchievements() {
      setLoading(true);
      try {
        const url = userId ? `/api/achievements?userId=${userId}` : '/api/achievements';
        const res = await fetch(url);
        const data = await res.json();
        if (data.success && data.achievements) {
          setAchievements(data.achievements);
        }
      } catch (err: unknown) {
        console.error('Failed to load achievements:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    let isMounted = true;
    loadAchievements();

    return () => {
      isMounted = false;
    };
  }, [isOpen, userId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-2xl border border-stone-200 dark:border-[#1A3F75] bg-[#FAF7F2] dark:bg-[#0A1333] shadow-2xl graph-paper-bg my-8 overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-[#1A3F75] px-5 py-3.5 bg-[#F3EDE2]/80 dark:bg-[#00002A]/90">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-stone-700 dark:text-[#D4E4EC] flex items-center gap-1.5">
              <Award className="h-4 w-4 text-amber-500" />
              Scholar Accolades & Badges
            </span>
            <span className="font-mono text-[10px] text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded uppercase">
              XP & Rank
            </span>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-500 dark:text-[#8BA3C7] hover:bg-stone-200/60 dark:hover:bg-[#13264D] hover:text-stone-900 dark:hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Level Progression Banner */}
        <div className="border-b border-stone-200 dark:border-[#1A3F75] bg-[#F3EDE2]/50 dark:bg-[#13264D]/60 p-5">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-stone-500 dark:text-[#8BA3C7] block">
                Scholar Tier {levelInfo.level}
              </span>
              <h3 className="font-mono text-base font-black text-stone-900 dark:text-[#D4E4EC] uppercase">
                {levelInfo.title}
              </h3>
            </div>
            <div className="text-right">
              <span className="font-mono text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center justify-end gap-1">
                <Sparkles className="h-3 w-3 text-amber-500" />
                {levelInfo.currentXp} / {levelInfo.maxXp} XP
              </span>
              <span className="font-mono text-[10px] text-stone-400 dark:text-[#8BA3C7] block uppercase mt-0.5">
                {levelInfo.maxXp - levelInfo.currentXp} XP to next tier
              </span>
            </div>
          </div>

          <div className="h-2 w-full bg-stone-200 dark:bg-[#1A3F75] rounded-full overflow-hidden mt-3">
            <div
              className="h-full bg-amber-500 transition-all duration-500"
              style={{ width: `${levelInfo.progressPercent}%` }}
            />
          </div>
        </div>

        {/* Badges Grid */}
        <div className="p-6 space-y-3.5 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="py-12 text-center font-mono text-xs text-stone-500 dark:text-[#8BA3C7] animate-pulse">
              Loading badges and accolades...
            </div>
          ) : achievements.length > 0 ? (
            <div className="space-y-3">
              {achievements.map((ach) => {
                const icon = iconMap[ach.icon] || <Award className="h-4 w-4" />;
                return (
                  <div
                    key={ach.id}
                    className={`rounded-xl border p-4 transition-all flex items-start justify-between gap-3 ${
                      ach.isUnlocked
                        ? 'border-stone-900 dark:border-[#3B628A] bg-white dark:bg-[#13264D]/80 shadow-2xs'
                        : 'border-stone-200 dark:border-[#1A3F75] bg-stone-50/60 dark:bg-[#00002A]/40 opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
                          ach.isUnlocked
                            ? 'border-amber-300 dark:border-amber-500/50 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                            : 'border-stone-200 dark:border-[#1A3F75] bg-stone-100 dark:bg-[#13264D] text-stone-400 dark:text-[#8BA3C7]'
                        }`}
                      >
                        {icon}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-mono text-xs font-bold text-stone-900 dark:text-[#D4E4EC] uppercase">
                            {ach.name}
                          </h4>
                          <span className="inline-flex items-center gap-0.5 font-mono text-[10px] font-semibold text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.2 rounded">
                            <Sparkles className="h-2.5 w-2.5 text-amber-500" />
                            +{ach.xp_reward} XP
                          </span>
                        </div>
                        <p className="text-xs text-stone-600 dark:text-[#8BA3C7] mt-1 font-sans">
                          {ach.description}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      {ach.isUnlocked ? (
                        <div className="inline-flex items-center gap-1 font-mono text-[10px] text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded uppercase">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Unlocked</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 font-mono text-[10px] text-stone-400 dark:text-[#8BA3C7] border border-stone-200 dark:border-[#1A3F75] bg-stone-100 dark:bg-[#13264D] px-2 py-0.5 rounded uppercase">
                          <Lock className="h-3 w-3" />
                          <span>Locked</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-stone-500 dark:text-[#8BA3C7] font-mono">
              No accolades registered yet. Read verified nuggets to unlock achievements!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
