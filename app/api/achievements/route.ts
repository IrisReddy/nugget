import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { checkEligibleAchievements } from '@/lib/xp';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  try {
    const { data: allAchievements, error: aErr } = await supabase
      .from('achievements')
      .select('*')
      .order('xp_reward');

    if (aErr) throw aErr;

    const unlockedMap = new Map<string, string>();
    if (userId) {
      const { data: userAchs } = await supabase
        .from('user_achievements')
        .select('achievement_id, earned_at')
        .eq('user_id', userId);

      (userAchs || []).forEach((u) => {
        unlockedMap.set(u.achievement_id, u.earned_at);
      });
    }

    const achievements = (allAchievements || []).map((a) => ({
      ...a,
      isUnlocked: unlockedMap.has(a.id),
      earnedAt: unlockedMap.get(a.id) || null,
    }));

    return NextResponse.json({ success: true, achievements });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch achievements';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required.' }, { status: 400 });
    }

    const newlyUnlocked = await checkEligibleAchievements(userId);
    return NextResponse.json({ success: true, newlyUnlocked });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Evaluation failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
