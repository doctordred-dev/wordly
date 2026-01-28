'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import Header from '@/components/Header';
import LoginPage from '@/components/LoginPage';
import TabNavigation from '@/components/TabNavigation';
import FlashcardsTab from '@/components/FlashcardsTab';
import QuizMode from '@/components/QuizMode';
import StatsTab from '@/components/StatsTab';

interface Flashcard {
  id: string;
  word: string;
  translation: string;
  source_lang: string;
  target_lang: string;
  user_id: string | null;
}

const tabs = [
  { id: 'flashcards', label: 'Flashcards', icon: '🃏' },
  { id: 'quiz', label: 'Quiz', icon: '📝' },
  { id: 'stats', label: 'Progress', icon: '📊' },
];

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('flashcards');
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadFlashcards();
    }
  }, [user]);

  const loadFlashcards = async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('flashcards')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading flashcards:', error);
    } else if (data) {
      setFlashcards(data);
    }
    setLoading(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Header />
      <TabNavigation tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="py-8">
        {activeTab === 'flashcards' && (
          <FlashcardsTab flashcards={flashcards} onFlashcardsUpdate={loadFlashcards} />
        )}
        {activeTab === 'quiz' && <QuizMode flashcards={flashcards} />}
        {activeTab === 'stats' && <StatsTab />}
      </main>
    </div>
  );
}
