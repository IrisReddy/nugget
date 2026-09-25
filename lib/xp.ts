import { supabase } from './supabase';

export interface LevelInfo {
  level: number;
  title: string;
  currentXp: number;
  minXp: number;
  maxXp: number;
  progressPercent: number;
}

export const SCHOLAR_TIERS = [
  { level: 1, title: 'Novice Inquirer', minXp: 0, maxXp: 50 },
  { level: 2, title: 'Curious Scholar', minXp: 50, maxXp: 150 },
  { level: 3, title: 'Verified Synthesizer', minXp: 150, maxXp: 300 },
  { level: 4, title: 'Senior Analyst', minXp: 300, maxXp: 600 },
  { level: 5, title: 'Polymath Fellow', minXp: 600, maxXp: 1200 },
];

/**
 * Calculates current level, title, and progress toward next tier
 */
export function calculateLevel(totalXp: number): LevelInfo {
  const currentTier = SCHOLAR_TIERS.find((t) => totalXp >= t.minXp && totalXp < t.maxXp) || {
    level: 5,
    title: 'Polymath Fellow',
    minXp: 600,
    maxXp: 1200,
  };

  const range = currentTier.maxXp - currentTier.minXp;
  const progress = Math.min(100, Math.max(0, Math.round(((totalXp - currentTier.minXp) / range) * 100)));

  return {
    level: currentTier.level,
    title: currentTier.title,
    currentXp: totalXp,
    minXp: currentTier.minXp,
    maxXp: currentTier.maxXp,
    progressPercent: progress,
  };
}

/**
 * Checks for eligible achievement unlocks based on user telemetry
 */
export async function checkEligibleAchievements(userId: string) {
  try {
    // 1. Fetch user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('total_xp, current_streak')
      .eq('id', userId)
      .maybeSingle();

    if (!profile) return [];

    // 2. Fetch all achievements
    const { data: allAchievements } = await supabase
      .from('achievements')
      .select('*');

    if (!allAchievements || allAchievements.length === 0) return [];

    // 3. Fetch already unlocked achievements for user
    const { data: unlocked } = await supabase
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', userId);

    const unlockedIds = new Set((unlocked || []).map((u) => u.achievement_id));
    const newlyUnlocked = [];

    for (const ach of allAchievements) {
      if (unlockedIds.has(ach.id)) continue;

      let isEligible = false;
      if (ach.name === 'First Nugget' && (profile.total_xp || 0) >= 10) {
        isEligible = true;
      } else if (ach.name === 'Curiosity Rekindled' && (profile.current_streak || 0) >= 3) {
        isEligible = true;
      } else if (ach.name === 'Unbroken Habit' && (profile.current_streak || 0) >= 7) {
        isEligible = true;
      } else if (ach.name === 'Centurion Scholar' && (profile.total_xp || 0) >= 100) {
        isEligible = true;
      }

      if (isEligible) {
        // Award achievement
        await supabase.from('user_achievements').insert({
          user_id: userId,
          achievement_id: ach.id,
          earned_at: new Date().toISOString(),
        });

        // Award bonus XP
        if (ach.xp_reward) {
          await supabase.from('xp_events').insert({
            user_id: userId,
            xp_amount: ach.xp_reward,
            event_type: `achievement_${ach.name.toLowerCase().replace(/\s+/g, '_')}`,
          });

          await supabase
            .from('profiles')
            .update({
              total_xp: (profile.total_xp || 0) + ach.xp_reward,
            })
            .eq('id', userId);
        }

        newlyUnlocked.push(ach);
      }
    }

    return newlyUnlocked;
  } catch (err: unknown) {
    console.error('Error evaluating achievements:', err);
    return [];
  }
}
