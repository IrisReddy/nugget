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
  Lock,
  Terminal
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
        setLoading(false);
      }
    }

    loadAchievements();
  }, [isOpen, userId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-2xl border border-stone-300 bg-white/98 shadow-2xl graph-paper-bg my-8 overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-3 bg-stone-50/90">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-stone-600 flex items-center gap-1.5">
              <Terminal className="h-3 w-3 text-stone-800" />
              SCHOLAR_ACCOLADES // BADGES
            </span>
            <span className="font-mono text-[10px] text-amber-700 border border-amber-300 bg-amber-50 px-1.5 py-0.2 rounded uppercase">
              STEP 09: XP_STREAKS
            </span>
          </div>

          <button
            onClick={onClose}
            className="rounded p-1 text-stone-400 hover:bg-stone-200 hover:text-stone-700 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Level Progression Banner */}
        <div className="border-b border-stone-200 bg-stone-100/80 p-5">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-stone-500 block">
                SCHOLAR_RANK // TIER {levelInfo.level}
              </span>
              <h3 className="font-mono text-base font-black text-stone-900 uppercase">
                {levelInfo.title}
              </h3>
            </div>
            <div className="text-right">
              <span className="font-mono text-xs font-bold text-amber-700">
                {levelInfo.currentXp} / {levelInfo.maxXp} XP
              </span>
              <span className="font-mono text-[10px] text-stone-400 block uppercase">
                {levelInfo.maxXp - levelInfo.currentXp} XP TO NEXT TIER
              </span>
            </div>
          </div>

          <div className="h-2 w-full bg-stone-200 rounded-full overflow-hidden mt-3">
            <div
              className="h-full bg-amber-500 transition-all duration-500"
              style={{ width: `${levelInfo.progressPercent}%` }}
            />
          </div>
        </div>

        {/* Badges Grid */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="py-12 text-center font-mono text-xs text-stone-500 animate-pulse">
              [FETCHING_ACCOLADES_LEDGER...]
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
                        ? 'border-stone-900 bg-white shadow-2xs'
                        : 'border-stone-200 bg-stone-50/60 opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded border ${
                          ach.isUnlocked
                            ? 'border-amber-300 bg-amber-50 text-amber-600'
                            : 'border-stone-200 bg-stone-100 text-stone-400'
                        }`}
                      >
                        {icon}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-mono text-xs font-bold text-stone-900 uppercase">
                            {ach.name}
                          </h4>
                          <span className="font-mono text-[10px] font-semibold text-amber-600 border border-amber-200 bg-amber-50 px-1.5 py-0.2 rounded">
                            +{ach.xp_reward} XP
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 mt-1 font-sans">
                          {ach.description}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      {ach.isUnlocked ? (
                        <div className="inline-flex items-center gap-1 font-mono text-[10px] text-emerald-700 font-bold border border-emerald-300 bg-emerald-50 px-2 py-0.5 rounded uppercase">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>UNLOCKED</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 font-mono text-[10px] text-stone-400 border border-stone-200 bg-stone-100 px-2 py-0.5 rounded uppercase">
                          <Lock className="h-3 w-3" />
                          <span>LOCKED</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-stone-500 font-mono">
              [NO_ACHIEVEMENTS_REGISTERED]
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
