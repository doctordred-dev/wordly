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
import ModuleSelector from '@/components/ModuleSelector';
import { BookOpen, PenTool, TrendingUp } from 'lucide-react';

interface Flashcard {
  id: string;
  word: string;
  translation: string;
  source_lang: string;
  target_lang: string;
  user_id: string | null;
}

const tabs = [
  { id: 'flashcards', label: 'Flashcards', icon: BookOpen },
  { id: 'quiz', label: 'Quiz', icon: PenTool },
  { id: 'stats', label: 'Progress', icon: TrendingUp },
];

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('flashcards');
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadFlashcards();
    } else {
      setFlashcards([]);
    }
  }, [user, selectedModuleId]);

  const loadFlashcards = async () => {
    if (!user) return;

    setLoading(true);
    let query = supabase
      .from('flashcards')
      .select('*')
      .eq('user_id', user.id);

    // Filter by module if selected
    if (selectedModuleId) {
      query = query.eq('module_id', selectedModuleId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading flashcards:', error);
    } else if (data) {
      setFlashcards(data);
    }
    setLoading(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen relative flex items-center justify-center" style={{ background: '#1a1a2e' }}>
        <div 
          className="fixed inset-0 z-0 opacity-40"
          style={{
            backgroundImage: 'url(/Propery-bgr.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />
        <div className="text-center relative z-10">
          <div className="animate-spin w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen relative" style={{ background: '#1a1a2e' }}>
      <div 
        className="fixed inset-0 z-0 opacity-40"
        style={{
          backgroundImage: 'url(/Propery-bgr.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />
      <div className="relative z-10">
        <Header />
        <TabNavigation tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
        
        <main className="py-4 md:py-8 px-2 md:px-4">
          <div className="container mx-auto max-w-7xl">
            <ModuleSelector 
              selectedModuleId={selectedModuleId} 
              onModuleChange={setSelectedModuleId}
              showAll={true}
            />
            
            {activeTab === 'flashcards' && (
              <FlashcardsTab 
                flashcards={flashcards} 
                onFlashcardsUpdate={loadFlashcards}
                selectedModuleId={selectedModuleId}
              />
            )}
            {activeTab === 'quiz' && (
              <QuizMode 
                flashcards={flashcards}
                selectedModuleId={selectedModuleId}
              />
            )}
            {activeTab === 'stats' && <StatsTab />}
          </div>
        </main>
      </div>
    </div>
  );
}
