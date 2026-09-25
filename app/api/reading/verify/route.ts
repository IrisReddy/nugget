import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, category, durationSeconds = 15 } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required.' }, { status: 400 });
    }

    // 1. Look up category to find matching topic
    let topicId: string | null = null;
    if (category) {
      const { data: catData } = await supabase
        .from('categories')
        .select('id')
        .ilike('name', category)
        .maybeSingle();

      if (catData?.id) {
        const { data: topicData } = await supabase
          .from('topics')
          .select('id')
          .eq('category_id', catData.id)
          .limit(1)
          .maybeSingle();

        if (topicData?.id) {
          topicId = topicData.id;
        }
      }
    }

    // Fallback topic if no specific category match
    if (!topicId) {
      const { data: anyTopic } = await supabase.from('topics').select('id').limit(1).maybeSingle();
      topicId = anyTopic?.id || null;
    }

    // 2. Insert into reading_sessions (if topicId is available)
    if (topicId) {
      await supabase.from('reading_sessions').insert({
        user_id: userId,
        topic_id: topicId,
        duration_seconds: Math.round(durationSeconds),
        completed: true,
      });

      // 3. Insert into reading_history
      await supabase.from('reading_history').insert({
        user_id: userId,
        topic_id: topicId,
        completed_at: new Date().toISOString(),
        xp_earned: 10,
      });
    }

    // 4. Record in xp_events
    await supabase.from('xp_events').insert({
      user_id: userId,
      xp_amount: 10,
      event_type: 'nugget_completed',
    });

    // 5. Calculate and update streak + XP in profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('total_xp, current_streak, longest_streak, last_read_date')
      .eq('id', userId)
      .maybeSingle();

    const currentXp = profile?.total_xp || 0;
    const newTotalXp = currentXp + 10;
    const today = new Date().toISOString().split('T')[0];

    let newStreak = profile?.current_streak || 0;
    if (!profile?.last_read_date) {
      newStreak = 1;
    } else if (profile.last_read_date !== today) {
      const lastDate = new Date(profile.last_read_date);
      const currDate = new Date(today);
      const diffDays = Math.round((currDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
      if (diffDays === 1) {
        newStreak += 1;
      } else if (diffDays > 1) {
        newStreak = 1;
      }
    }

    const newLongest = Math.max(profile?.longest_streak || 0, newStreak);

    await supabase
      .from('profiles')
      .update({
        total_xp: newTotalXp,
        current_streak: newStreak,
        longest_streak: newLongest,
        last_read_date: today,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    return NextResponse.json({
      success: true,
      xpEarned: 10,
      newTotalXp,
      newStreak,
      readingVerified: true,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Reading verification failed';
    console.error('[READING_VERIFICATION_ERROR]', err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
