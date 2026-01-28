'use client';

import { useState } from 'react';
import { translateBulk } from '@/lib/translate';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import FlashcardGrid from './FlashcardGrid';
import Image from 'next/image';

interface Flashcard {
  id: string;
  word: string;
  translation: string;
  source_lang: string;
  target_lang: string;
  user_id: string | null;
}

interface FlashcardsTabProps {
  flashcards: Flashcard[];
  onFlashcardsUpdate: () => void;
}

export default function FlashcardsTab({ flashcards, onFlashcardsUpdate }: FlashcardsTabProps) {
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('ru');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const words = input
        .split('\n')
        .map(w => w.trim())
        .filter(w => w.length > 0);

      if (words.length === 0) {
        setError('Please enter at least one word');
        setLoading(false);
        return;
      }

      const translations = await translateBulk(words, sourceLang, targetLang);

      const flashcardsToInsert = translations.map(({ word, translation }) => ({
        word,
        translation,
        source_lang: sourceLang,
        target_lang: targetLang,
        user_id: user?.id || null,
      }));

      const { error: insertError } = await supabase
        .from('flashcards')
        .insert(flashcardsToInsert as any);

      if (insertError) {
        throw insertError;
      }

      setInput('');
      onFlashcardsUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('flashcards')
      .delete()
      .eq('id', id);

    if (!error) {
      onFlashcardsUpdate();
    }
  };

  return (
    <div className="container mx-auto px-3 md:px-4 py-4 md:py-8">
      <div className="max-w-4xl mx-auto mb-8 md:mb-12">
        <div className="glass-effect rounded-2xl shadow-xl p-4 md:p-8 border border-white/20 backdrop-blur-xl">
          <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
            <Image src="/Loading.png" alt="Add" width={32} height={32} className="w-8 h-8 md:w-10 md:h-10" />
            <h2 className="text-xl md:text-2xl font-bold text-white">
              Add New Words
            </h2>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-200 mb-2">
                  From Language
                </label>
                <select
                  value={sourceLang}
                  onChange={(e) => setSourceLang(e.target.value)}
                  className="w-full px-3 md:px-4 py-2 md:py-3 glass-effect border-2 border-white/20 rounded-xl focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-white transition-all text-sm md:text-base"
                >
                  <option value="en">🇬🇧 English</option>
                  <option value="ru">🇷🇺 Russian</option>
                  <option value="es">🇪🇸 Spanish</option>
                  <option value="fr">🇫🇷 French</option>
                  <option value="de">🇩🇪 German</option>
                  <option value="it">🇮🇹 Italian</option>
                  <option value="pt">🇵🇹 Portuguese</option>
                  <option value="ja">🇯🇵 Japanese</option>
                  <option value="ko">🇰🇷 Korean</option>
                  <option value="zh">🇨🇳 Chinese</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-200 mb-2">
                  To Language
                </label>
                <select
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                  className="w-full px-3 md:px-4 py-2 md:py-3 glass-effect border-2 border-white/20 rounded-xl focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-white transition-all text-sm md:text-base"
                >
                  <option value="ru">🇷🇺 Russian</option>
                  <option value="en">🇬🇧 English</option>
                  <option value="es">🇪🇸 Spanish</option>
                  <option value="fr">🇫🇷 French</option>
                  <option value="de">🇩🇪 German</option>
                  <option value="it">🇮🇹 Italian</option>
                  <option value="pt">🇵🇹 Portuguese</option>
                  <option value="ja">🇯🇵 Japanese</option>
                  <option value="ko">🇰🇷 Korean</option>
                  <option value="zh">🇨🇳 Chinese</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Words (one per line)
              </label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter words, one per line:&#10;hello&#10;world&#10;computer&#10;programming"
                rows={6}
                className="w-full px-3 md:px-4 py-2 md:py-3 glass-effect border-2 border-white/20 rounded-xl focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-white resize-none transition-all text-sm md:text-base"
              />
              <p className="mt-2 text-xs md:text-sm text-gray-300">
                💡 Tip: Paste multiple words at once for bulk translation
              </p>
            </div>

            {error && (
              <div className="glass-effect border-2 border-red-400/50 text-red-300 px-3 md:px-4 py-2 md:py-3 rounded-xl flex items-center gap-2 md:gap-3 text-sm md:text-base">
                <span className="text-xl">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full gradient-cyan-purple hover:opacity-90 disabled:opacity-50 text-white font-semibold py-3 md:py-4 px-4 md:px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 md:gap-3 shadow-lg hover:shadow-2xl text-sm md:text-base"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Translating...
                </>
              ) : (
                <>
                  <span className="text-xl">✨</span>
                  Create Flashcards
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-2 md:px-0">
        <FlashcardGrid flashcards={flashcards} onDelete={handleDelete} />
      </div>
    </div>
  );
}
