import { supabase } from './supabase';

interface UserProfile {
  id: string;
  user_id: string;
  streak_days: number;
  last_activity_date: string | null;
  total_words_learned: number;
  total_quizzes_completed: number;
}

export async function updateUserActivity(userId: string) {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  // Get or create user profile
  let { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single() as { data: UserProfile | null };

  if (!profile) {
    // Create new profile
    const { data: newProfile } = await supabase
      .from('user_profiles')
      .insert({
        user_id: userId,
        streak_days: 1,
        last_activity_date: today,
        total_words_learned: 0,
        total_quizzes_completed: 0,
      } as any)
      .select()
      .single() as { data: UserProfile | null };
    
    return newProfile;
  }

  const lastActivity = profile.last_activity_date;
  
  // If already active today, no update needed
  if (lastActivity === today) {
    return profile;
  }

  // Calculate streak
  let newStreak = profile.streak_days;
  
  if (lastActivity) {
    const lastDate = new Date(lastActivity);
    const todayDate = new Date(today);
    const diffTime = todayDate.getTime() - lastDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      // Consecutive day - increment streak
      newStreak = profile.streak_days + 1;
    } else if (diffDays > 1) {
      // Streak broken - reset to 1
      newStreak = 1;
    }
  } else {
    // First activity
    newStreak = 1;
  }

  // Update profile
  const { data: updatedProfile } = await (supabase
    .from('user_profiles') as any)
    .update({
      streak_days: newStreak,
      last_activity_date: today,
    })
    .eq('user_id', userId)
    .select()
    .single() as { data: UserProfile | null };

  return updatedProfile;
}

export async function incrementWordsLearned(userId: string, count: number = 1) {
  await updateUserActivity(userId);
  
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('total_words_learned')
    .eq('user_id', userId)
    .single() as { data: { total_words_learned: number } | null };

  if (profile) {
    await (supabase
      .from('user_profiles') as any)
      .update({ total_words_learned: profile.total_words_learned + count })
      .eq('user_id', userId);
  }
}

export async function incrementQuizzesCompleted(userId: string) {
  await updateUserActivity(userId);
  
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('total_quizzes_completed')
    .eq('user_id', userId)
    .single() as { data: { total_quizzes_completed: number } | null };

  if (profile) {
    await (supabase
      .from('user_profiles') as any)
      .update({ total_quizzes_completed: profile.total_quizzes_completed + 1 })
      .eq('user_id', userId);
  }
}

export async function getUserStreak(userId: string): Promise<number> {
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('streak_days, last_activity_date')
    .eq('user_id', userId)
    .single() as { data: { streak_days: number; last_activity_date: string | null } | null };

  if (!profile) return 0;

  // Check if streak is still valid (activity was today or yesterday)
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  
  if (profile.last_activity_date === today || profile.last_activity_date === yesterday) {
    return profile.streak_days;
  }

  // Streak is broken
  return 0;
}
