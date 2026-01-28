'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import Image from 'next/image';

interface QuizResult {
  id: string;
  score: number;
  total_questions: number;
  completed_at: string;
}

export default function StatsTab() {
  const { user } = useAuth();
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuizResults();
  }, [user]);

  const loadQuizResults = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('quiz_results')
      .select('*')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false })
      .limit(10);

    if (!error && data) {
      setQuizResults(data);
    }
    setLoading(false);
  };

  const totalQuizzes = quizResults.length;
  const averageScore = totalQuizzes > 0
    ? Math.round(quizResults.reduce((acc, r) => acc + (r.score / r.total_questions) * 100, 0) / totalQuizzes)
    : 0;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="animate-spin w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <Image src="/Success.png" alt="Success" width={48} height={48} />
              <span className="text-3xl font-bold">{totalQuizzes}</span>
            </div>
            <p className="text-indigo-100 font-medium">Total Quizzes</p>
          </div>

          <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <Image src="/Improve.png" alt="Improve" width={48} height={48} />
              <span className="text-3xl font-bold">{averageScore}%</span>
            </div>
            <p className="text-pink-100 font-medium">Average Score</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <Image src="/Idea.png" alt="Idea" width={48} height={48} />
              <span className="text-3xl font-bold">
                {quizResults.reduce((acc, r) => acc + r.total_questions, 0)}
              </span>
            </div>
            <p className="text-blue-100 font-medium">Questions Answered</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-6">
            <Image src="/Feedback.png" alt="History" width={40} height={40} />
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Recent Quiz Results</h2>
          </div>

          {quizResults.length === 0 ? (
            <div className="text-center py-12">
              <Image src="/Search.png" alt="No data" width={80} height={80} className="mx-auto mb-4 opacity-50" />
              <p className="text-gray-500 dark:text-gray-400">
                No quiz results yet. Take a quiz to see your progress!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {quizResults.map((result) => {
                const percentage = Math.round((result.score / result.total_questions) * 100);
                const date = new Date(result.completed_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={result.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white ${
                        percentage >= 80 ? 'bg-green-500' :
                        percentage >= 60 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}>
                        {percentage}%
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 dark:text-white">
                          {result.score} / {result.total_questions} correct
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{date}</p>
                      </div>
                    </div>
                    <div className="text-2xl">
                      {percentage >= 80 ? '🎉' : percentage >= 60 ? '👍' : '💪'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
