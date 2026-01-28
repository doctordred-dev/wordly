'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n';
import { getUserStreak } from '@/lib/streak';
import { Trophy, Lock, Star, Flame, Users, Zap, BookOpen, Target, Crown } from 'lucide-react';

interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  requirement_value: number;
  xp_reward: number;
}

interface UserAchievement {
  achievement_id: string;
  unlocked_at: string;
}

interface UserStats {
  totalWords: number;
  totalQuizzes: number;
  perfectQuizzes: number;
  streakDays: number;
  friendsCount: number;
  sharedModules: number;
}

export default function AchievementsTab() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [stats, setStats] = useState<UserStats>({
    totalWords: 0,
    totalQuizzes: 0,
    perfectQuizzes: 0,
    streakDays: 0,
    friendsCount: 0,
    sharedModules: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Load all achievements
      const { data: achievementsData } = await supabase
        .from('achievements')
        .select('*')
        .order('category', { ascending: true });

      // Load user's unlocked achievements
      const { data: userAchievementsData } = await supabase
        .from('user_achievements')
        .select('achievement_id, unlocked_at')
        .eq('user_id', user.id);

      // Load user stats
      const { count: wordsCount } = await supabase
        .from('flashcards')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      const { data: quizResults } = await supabase
        .from('quiz_results')
        .select('score, total_questions')
        .eq('user_id', user.id) as { data: { score: number; total_questions: number }[] | null };

      const perfectQuizzes = quizResults?.filter(
        (q: { score: number; total_questions: number }) => q.score === q.total_questions
      ).length || 0;

      // Get streak from user_profiles
      const streakDays = await getUserStreak(user.id);

      // Get friends count
      const { count: friendsCount } = await supabase
        .from('friends')
        .select('*', { count: 'exact', head: true })
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
        .eq('status', 'accepted');

      // Get shared modules count
      const { count: sharedCount } = await supabase
        .from('shared_modules')
        .select('*', { count: 'exact', head: true })
        .eq('shared_by', user.id);

      setAchievements(achievementsData || []);
      setUserAchievements(userAchievementsData || []);
      setStats({
        totalWords: wordsCount || 0,
        totalQuizzes: quizResults?.length || 0,
        perfectQuizzes,
        streakDays,
        friendsCount: friendsCount || 0,
        sharedModules: sharedCount || 0,
      });

      // Check and unlock new achievements
      await checkAndUnlockAchievements(
        achievementsData || [],
        userAchievementsData || [],
        {
          totalWords: wordsCount || 0,
          totalQuizzes: quizResults?.length || 0,
          perfectQuizzes,
          streakDays,
          friendsCount: friendsCount || 0,
          sharedModules: sharedCount || 0,
        }
      );
    } finally {
      setLoading(false);
    }
  };

  const checkAndUnlockAchievements = async (
    allAchievements: Achievement[],
    unlockedAchievements: UserAchievement[],
    currentStats: UserStats
  ) => {
    if (!user) return;

    const unlockedIds = new Set(unlockedAchievements.map(a => a.achievement_id));
    const toUnlock: string[] = [];

    for (const achievement of allAchievements) {
      if (unlockedIds.has(achievement.id)) continue;

      let shouldUnlock = false;

      switch (achievement.code) {
        case 'first_word':
          shouldUnlock = currentStats.totalWords >= 1;
          break;
        case 'words_10':
          shouldUnlock = currentStats.totalWords >= 10;
          break;
        case 'words_50':
          shouldUnlock = currentStats.totalWords >= 50;
          break;
        case 'words_100':
          shouldUnlock = currentStats.totalWords >= 100;
          break;
        case 'words_500':
          shouldUnlock = currentStats.totalWords >= 500;
          break;
        case 'perfect_quiz':
          shouldUnlock = currentStats.perfectQuizzes >= 1;
          break;
        case 'quiz_10':
          shouldUnlock = currentStats.totalQuizzes >= 10;
          break;
        case 'quiz_50':
          shouldUnlock = currentStats.totalQuizzes >= 50;
          break;
        case 'streak_3':
          shouldUnlock = currentStats.streakDays >= 3;
          break;
        case 'streak_7':
          shouldUnlock = currentStats.streakDays >= 7;
          break;
        case 'streak_30':
          shouldUnlock = currentStats.streakDays >= 30;
          break;
        case 'streak_100':
          shouldUnlock = currentStats.streakDays >= 100;
          break;
        case 'first_friend':
          shouldUnlock = currentStats.friendsCount >= 1;
          break;
        case 'share_module':
          shouldUnlock = currentStats.sharedModules >= 1;
          break;
      }

      if (shouldUnlock) {
        toUnlock.push(achievement.id);
      }
    }

    // Unlock new achievements
    if (toUnlock.length > 0) {
      const inserts = toUnlock.map(id => ({
        user_id: user.id,
        achievement_id: id,
      }));

      await supabase.from('user_achievements').insert(inserts as any);
      
      // Reload achievements
      const { data: updatedUserAchievements } = await supabase
        .from('user_achievements')
        .select('achievement_id, unlocked_at')
        .eq('user_id', user.id);
      
      setUserAchievements(updatedUserAchievements || []);
    }
  };

  const isUnlocked = (achievementId: string) => {
    return userAchievements.some(ua => ua.achievement_id === achievementId);
  };

  const getProgress = (achievement: Achievement): number => {
    switch (achievement.category) {
      case 'words':
        return Math.min(100, (stats.totalWords / achievement.requirement_value) * 100);
      case 'quiz':
        if (achievement.code === 'perfect_quiz') {
          return stats.perfectQuizzes >= 1 ? 100 : 0;
        }
        return Math.min(100, (stats.totalQuizzes / achievement.requirement_value) * 100);
      case 'streak':
        return Math.min(100, (stats.streakDays / achievement.requirement_value) * 100);
      case 'social':
        if (achievement.code === 'first_friend') {
          return stats.friendsCount >= 1 ? 100 : 0;
        }
        return stats.sharedModules >= 1 ? 100 : 0;
      default:
        return 0;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'words':
        return <BookOpen className="w-4 h-4" />;
      case 'quiz':
        return <Target className="w-4 h-4" />;
      case 'streak':
        return <Flame className="w-4 h-4" />;
      case 'social':
        return <Users className="w-4 h-4" />;
      case 'special':
        return <Star className="w-4 h-4" />;
      default:
        return <Zap className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'words':
        return 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30';
      case 'quiz':
        return 'text-purple-400 bg-purple-500/20 border-purple-500/30';
      case 'streak':
        return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
      case 'social':
        return 'text-pink-400 bg-pink-500/20 border-pink-500/30';
      case 'special':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const unlockedCount = userAchievements.length;
  const totalCount = achievements.length;
  const totalXP = achievements
    .filter(a => isUnlocked(a.id))
    .reduce((sum, a) => sum + a.xp_reward, 0);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="animate-spin w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full mx-auto" />
        <p className="text-gray-400 mt-4">Loading achievements...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Stats header */}
        <div className="glass-effect rounded-2xl p-6 mb-8 border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 gradient-cyan-purple rounded-xl flex items-center justify-center">
                <Trophy className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{t('achievements.title')}</h2>
                <p className="text-gray-400 text-sm">
                  {unlockedCount} of {totalCount} unlocked
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-yellow-400">
                <Star className="w-5 h-5 fill-current" />
                <span className="text-2xl font-bold">{totalXP}</span>
              </div>
              <p className="text-gray-400 text-sm">Total XP</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div
              className="h-3 rounded-full transition-all duration-500"
              style={{
                width: `${(unlockedCount / totalCount) * 100}%`,
                background: 'linear-gradient(90deg, #06b6d4, #8b5cf6, #ec4899)',
              }}
            />
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="glass-effect rounded-xl p-4 border border-white/20 text-center">
            <BookOpen className="w-6 h-6 mx-auto mb-2 text-cyan-400" />
            <p className="text-2xl font-bold text-white">{stats.totalWords}</p>
            <p className="text-gray-400 text-xs">{t('achievements.totalWords')}</p>
          </div>
          <div className="glass-effect rounded-xl p-4 border border-white/20 text-center">
            <Target className="w-6 h-6 mx-auto mb-2 text-purple-400" />
            <p className="text-2xl font-bold text-white">{stats.totalQuizzes}</p>
            <p className="text-gray-400 text-xs">{t('achievements.quizzes')}</p>
          </div>
          <div className="glass-effect rounded-xl p-4 border border-white/20 text-center">
            <Crown className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
            <p className="text-2xl font-bold text-white">{stats.perfectQuizzes}</p>
            <p className="text-gray-400 text-xs">Perfect Scores</p>
          </div>
          <div className="glass-effect rounded-xl p-4 border border-white/20 text-center">
            <Flame className="w-6 h-6 mx-auto mb-2 text-orange-400" />
            <p className="text-2xl font-bold text-white">{stats.streakDays}</p>
            <p className="text-gray-400 text-xs">{t('achievements.streak')}</p>
          </div>
        </div>

        {/* Achievements grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {achievements.map(achievement => {
            const unlocked = isUnlocked(achievement.id);
            const progress = getProgress(achievement);

            return (
              <div
                key={achievement.id}
                className={`glass-effect rounded-xl p-4 border transition-all ${
                  unlocked
                    ? 'border-yellow-400/50 bg-yellow-500/5'
                    : 'border-white/10 opacity-70'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${
                      unlocked
                        ? 'bg-gradient-to-br from-yellow-400 to-orange-500'
                        : 'bg-gray-700'
                    }`}
                  >
                    {unlocked ? achievement.icon : <Lock className="w-6 h-6 text-gray-500" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-bold ${unlocked ? 'text-white' : 'text-gray-400'}`}>
                        {achievement.name}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs border ${getCategoryColor(achievement.category)}`}>
                        {getCategoryIcon(achievement.category)}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm mb-2">{achievement.description}</p>
                    
                    {!unlocked && (
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">
                        +{achievement.xp_reward} XP
                      </span>
                      {unlocked && (
                        <span className="text-xs text-green-400">✓ Unlocked</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
