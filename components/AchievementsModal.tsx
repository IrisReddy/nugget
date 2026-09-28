'use client';

import { useEffect, useState } from 'react';
import { calculateLevel } from '@/lib/xp';
import AwardBadge from '@/components/AwardBadge';
import {
  X,
  Award,
  Flame,
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
  AwardBadge: <AwardBadge className="h-4 w-4 text-amber-500" />,
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

    let isMounted = true;
    async function loadAchievements() {
      setLoading(true);
      try {
        const url = userId ? `/api/achievements?userId=${userId}` : '/api/achievements';
        const res = await fetch(url);
        const data = await res.json();
        if (data.success && data.achievements && isMounted) {
          setAchievements(data.achievements);
        }
      } catch (err: unknown) {
        console.error('Failed to load achievements:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadAchievements();

    return () => {
      isMounted = false;
    };
  }, [isOpen, userId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/75 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-2xl border border-[#E1D4C2] dark:border-[#6E473B] bg-[#FAF7F2] dark:bg-[#362215] shadow-2xl graph-paper-bg my-8 overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-[#E1D4C2] dark:border-[#6E473B] px-5 py-3.5 bg-[#F3EDE2]/80 dark:bg-[#291C0E]/95">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#291C0E] dark:text-[#E1D4C2] flex items-center gap-1.5">
              <AwardBadge className="h-4 w-4 text-amber-500 fill-amber-500/20" />
              Scholar Accolades & Badges
            </span>
            <span className="font-mono text-[10px] text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-[#482D1E] px-2 py-0.5 rounded uppercase">
              XP & Rank
            </span>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#6E473B] dark:text-[#BEB5A9] hover:bg-[#E1D4C2]/40 dark:hover:bg-[#482D1E] hover:text-[#291C0E] dark:hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Level Progression Banner */}
        <div className="border-b border-[#E1D4C2] dark:border-[#6E473B] bg-[#F5EFEB]/60 dark:bg-[#482D1E]/60 p-5">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#A78D78] dark:text-[#BEB5A9] block">
                Scholar Tier {levelInfo.level}
              </span>
              <h3 className="font-mono text-base font-black text-[#291C0E] dark:text-[#E1D4C2] uppercase">
                {levelInfo.title}
              </h3>
            </div>
            <div className="text-right">
              <span className="font-mono text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center justify-end gap-1">
                <AwardBadge className="h-3.5 w-3.5 text-amber-500" />
                {levelInfo.currentXp} / {levelInfo.maxXp} XP
              </span>
              <span className="font-mono text-[10px] text-[#A78D78] dark:text-[#BEB5A9] block uppercase mt-0.5">
                {levelInfo.maxXp - levelInfo.currentXp} XP to next tier
              </span>
            </div>
          </div>

          <div className="h-2 w-full bg-[#E1D4C2] dark:bg-[#291C0E] rounded-full overflow-hidden mt-3">
            <div
              className="h-full bg-amber-500 transition-all duration-500"
              style={{ width: `${levelInfo.progressPercent}%` }}
            />
          </div>
        </div>

        {/* Badges Grid */}
        <div className="p-6 space-y-3.5 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="py-12 text-center font-mono text-xs text-[#7A6652] dark:text-[#BEB5A9] animate-pulse">
              Loading badges and accolades...
            </div>
          ) : achievements.length > 0 ? (
            <div className="space-y-3">
              {achievements.map((ach) => {
                const icon = iconMap[ach.icon] || <AwardBadge className="h-4 w-4 text-amber-500" />;
                return (
                  <div
                    key={ach.id}
                    className={`rounded-xl border p-4 transition-all flex items-start justify-between gap-3 ${
                      ach.isUnlocked
                        ? 'border-[#291C0E] dark:border-[#A78D78] bg-white dark:bg-[#482D1E]/60 shadow-2xs'
                        : 'border-[#E1D4C2] dark:border-[#6E473B] bg-[#F5EFEB]/50 dark:bg-[#291C0E]/40 opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
                          ach.isUnlocked
                            ? 'border-amber-300 dark:border-amber-500/50 bg-amber-50 dark:bg-[#482D1E] text-amber-600 dark:text-amber-300'
                            : 'border-[#E1D4C2] dark:border-[#6E473B] bg-stone-100 dark:bg-[#362215] text-[#A78D78] dark:text-[#BEB5A9]'
                        }`}
                      >
                        {icon}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-mono text-xs font-bold text-[#291C0E] dark:text-[#E1D4C2] uppercase">
                            {ach.name}
                          </h4>
                          <span className="inline-flex items-center gap-0.5 font-mono text-[10px] font-semibold text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/40 bg-amber-50 dark:bg-[#482D1E] px-1.5 py-0.2 rounded">
                            <AwardBadge className="h-3 w-3 text-amber-500" />
                            +{ach.xp_reward} XP
                          </span>
                        </div>
                        <p className="text-xs text-[#6E473B] dark:text-[#BEB5A9] mt-1 font-sans">
                          {ach.description}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      {ach.isUnlocked ? (
                        <div className="inline-flex items-center gap-1 font-mono text-[10px] text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-500/40 bg-emerald-50 dark:bg-[#482D1E] px-2 py-0.5 rounded uppercase">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Unlocked</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 font-mono text-[10px] text-[#A78D78] dark:text-[#BEB5A9] border border-[#E1D4C2] dark:border-[#6E473B] bg-stone-100 dark:bg-[#362215] px-2 py-0.5 rounded uppercase">
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
            <div className="py-8 text-center text-xs text-[#6E473B] dark:text-[#BEB5A9] font-mono">
              No accolades registered yet. Read verified nuggets to unlock achievements!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
