'use client';

import { useState } from 'react';
import { translateBulk } from '@/lib/translate';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n';
import FlashcardGrid from './FlashcardGrid';
import { parseWords } from '@/lib/wordParser';
import { incrementWordsLearned } from '@/lib/streak';
import { Sparkles, AlertCircle, Info, ChevronDown, ChevronUp } from 'lucide-react';

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
  selectedModuleId: string | null;
}

export default function FlashcardsTab({ flashcards, onFlashcardsUpdate, selectedModuleId }: FlashcardsTabProps) {
  const { user } = useAuth();
  const { t } = useI18n();
  const [input, setInput] = useState('');
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('uk');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showOriginalFirst, setShowOriginalFirst] = useState(true);
  const [isAddWordsOpen, setIsAddWordsOpen] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const words = parseWords(input);

      if (words.length === 0) {
        setError('Please enter at least one word or phrase');
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
        module_id: selectedModuleId,
      }));

      const { error: insertError } = await supabase
        .from('flashcards')
        .insert(flashcardsToInsert as any);

      if (insertError) {
        throw insertError;
      }

      // Update streak and word count
      if (user) {
        await incrementWordsLearned(user.id, flashcardsToInsert.length);
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

  const handleEdit = async (id: string, newWord: string, newTranslation: string) => {
    const { error } = await (supabase
      .from('flashcards') as any)
      .update({
        word: newWord,
        translation: newTranslation,
      })
      .eq('id', id);

    if (!error) {
      onFlashcardsUpdate();
    }
  };

  return (
    <div className="container mx-auto px-3 md:px-4 py-4 md:py-8">
      <div className="max-w-4xl mx-auto mb-8 md:mb-12">
        <div className="glass-effect rounded-2xl shadow-xl border border-white/20 backdrop-blur-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setIsAddWordsOpen(!isAddWordsOpen)}
            className="w-full p-4 md:p-6 flex items-center justify-between hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 gradient-cyan-purple rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-white">
                {t('flashcards.addNew')}
              </h2>
            </div>
            {isAddWordsOpen ? (
              <ChevronUp className="w-6 h-6 text-white/70" />
            ) : (
              <ChevronDown className="w-6 h-6 text-white/70" />
            )}
          </button>
          
          <div className={`transition-all duration-300 ease-in-out ${isAddWordsOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6 p-4 md:p-6 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-200 mb-2">
                  {t('flashcards.fromLang')}
                </label>
                <select
                  value={sourceLang}
                  onChange={(e) => setSourceLang(e.target.value)}
                  className="w-full px-3 md:px-4 py-2 md:py-3 glass-effect border-2 border-white/20 rounded-xl focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-white transition-all text-sm md:text-base"
                >
                  <option value="en">🇬🇧 English</option>
                  <option value="uk">🇺🇦 Ukrainian</option>
                  <option value="ru">🇷🇺 Russian</option>
                  <option value="es">🇪🇸 Spanish</option>
                  <option value="fr">🇫🇷 French</option>
                  <option value="de">🇩🇪 German</option>
                  <option value="it">🇮🇹 Italian</option>
                  <option value="pt">🇵🇹 Portuguese</option>
                  <option value="pl">🇵🇱 Polish</option>
                  <option value="ja">🇯🇵 Japanese</option>
                  <option value="ko">🇰🇷 Korean</option>
                  <option value="zh">🇨🇳 Chinese</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-200 mb-2">
                  {t('flashcards.toLang')}
                </label>
                <select
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                  className="w-full px-3 md:px-4 py-2 md:py-3 glass-effect border-2 border-white/20 rounded-xl focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-white transition-all text-sm md:text-base"
                >
                  <option value="uk">🇺🇦 Ukrainian</option>
                  <option value="ru">🇷🇺 Russian</option>
                  <option value="en">🇬🇧 English</option>
                  <option value="es">🇪🇸 Spanish</option>
                  <option value="fr">🇫🇷 French</option>
                  <option value="de">🇩🇪 German</option>
                  <option value="it">🇮🇹 Italian</option>
                  <option value="pt">🇵🇹 Portuguese</option>
                  <option value="pl">🇵🇱 Polish</option>
                  <option value="ja">🇯🇵 Japanese</option>
                  <option value="ko">🇰🇷 Korean</option>
                  <option value="zh">🇨🇳 Chinese</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-200 mb-2">
                {t('common.wordsOrPhrases')}
              </label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Flexible input! Try any format:&#10;&#10;hello, world, computer&#10;good morning&#10;:go up:, :look after:, word&#10;how are you. thank you."
                rows={6}
                className="w-full px-3 md:px-4 py-2 md:py-3 glass-effect border-2 border-white/20 rounded-xl focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-white resize-none transition-all text-sm md:text-base"
              />
              <div className="mt-2 flex items-start gap-2 text-xs md:text-sm text-gray-300">
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>
                  <strong>Smart input:</strong> Separate by comma, space, dot, or new line. Use <code className="px-1 py-0.5 bg-white/10 rounded text-cyan-400">:phrase:</code> for multi-word expressions (e.g., <code className="px-1 py-0.5 bg-white/10 rounded text-cyan-400">:go up:</code>)
                </p>
              </div>
            </div>

            {error && (
              <div className="glass-effect border-2 border-red-400/50 text-red-300 px-3 md:px-4 py-2 md:py-3 rounded-xl flex items-center gap-2 md:gap-3 text-sm md:text-base">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
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
                  {t('flashcards.translating')}
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  {t('flashcards.translate')}
                </>
              )}
            </button>
            </form>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-2 md:px-0">
        {flashcards.length > 0 && (
        <div className="flex justify-end mb-4">
          <div className="flex items-center gap-3 px-4 py-2 glass-effect rounded-xl border border-white/20">
            <span className={`text-sm ${showOriginalFirst ? 'text-white' : 'text-gray-400'}`}>
              {t('flashcards.showOriginal')}
            </span>
            <button
              onClick={() => setShowOriginalFirst(!showOriginalFirst)}
              className={`relative w-12 h-6 rounded-full transition-all ${
                showOriginalFirst ? 'bg-cyan-500' : 'bg-purple-500'
              }`}
            >
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                  showOriginalFirst ? 'left-1' : 'left-7'
                }`}
              />
            </button>
            <span className={`text-sm ${!showOriginalFirst ? 'text-white' : 'text-gray-400'}`}>
              {t('flashcards.showTranslation')}
            </span>
          </div>
        </div>
      )}
      
      <FlashcardGrid
        flashcards={flashcards}
        onDelete={handleDelete}
        onEdit={handleEdit}
        showOriginalFirst={showOriginalFirst}
      /></div>
    </div>
  );
}
