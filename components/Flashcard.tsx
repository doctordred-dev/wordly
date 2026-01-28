'use client';

import { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import { Trash2, RotateCw, Edit2, Check, X } from 'lucide-react';

const langFlags: Record<string, string> = {
  en: '🇬🇧',
  uk: '🇺🇦',
  ru: '🇷🇺',
  de: '🇩🇪',
  fr: '🇫🇷',
  es: '🇪🇸',
  it: '🇮🇹',
  pt: '🇵🇹',
  pl: '🇵🇱',
  ja: '🇯🇵',
  ko: '🇰🇷',
  zh: '🇨🇳',
};

interface FlashcardProps {
  id: string;
  word: string;
  translation: string;
  onDelete: (id: string) => void;
  onEdit?: (id: string, newWord: string, newTranslation: string) => void;
  showOriginalFirst?: boolean;
  sourceLang?: string;
  targetLang?: string;
}

export default function Flashcard({ id, word, translation, onDelete, onEdit, showOriginalFirst = true, sourceLang = 'en', targetLang = 'uk' }: FlashcardProps) {
  const { t } = useI18n();
  const [isFlipped, setIsFlipped] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editWord, setEditWord] = useState(word);
  const [editTranslation, setEditTranslation] = useState(translation);

  // Sync edit state with props when they change (e.g., from Realtime updates)
  useEffect(() => {
    setEditWord(word);
    setEditTranslation(translation);
  }, [word, translation]);

  const handleSaveEdit = () => {
    if (onEdit && (editWord !== word || editTranslation !== translation)) {
      onEdit(id, editWord, editTranslation);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditWord(word);
    setEditTranslation(translation);
    setIsEditing(false);
  };

  const frontText = showOriginalFirst ? word : translation;
  const backText = showOriginalFirst ? translation : word;
  const frontFlag = showOriginalFirst ? langFlags[sourceLang] || '🌐' : langFlags[targetLang] || '🌐';
  const backFlag = showOriginalFirst ? langFlags[targetLang] || '🌐' : langFlags[sourceLang] || '🌐';

  if (isEditing) {
    return (
      <div className="perspective-1000 group">
        <div className="relative w-full h-52 md:h-60 rounded-2xl p-6 border-2 border-cyan-400/50 flex flex-col justify-center shadow-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(94, 179, 246, 0.15) 0%, rgba(139, 127, 246, 0.15) 100%)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-300 mb-1 block">{frontFlag} {t('common.word')}</label>
              <input
                type="text"
                value={editWord}
                onChange={(e) => setEditWord(e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs text-gray-300 mb-1 block">{backFlag} {t('common.translation')}</label>
              <input
                type="text"
                value={editTranslation}
                onChange={(e) => setEditTranslation(e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSaveEdit}
                className="flex-1 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 hover:border-green-500/50 rounded-lg text-green-400 font-medium transition-all flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                {t('common.save')}
              </button>
              <button
                onClick={handleCancelEdit}
                className="flex-1 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 hover:border-red-500/50 rounded-lg text-red-400 font-medium transition-all flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="perspective-1000 group">
      <div
        className={`relative w-full h-52 md:h-60 transition-all duration-500 cursor-pointer hover:scale-105`}
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        {/* Front */}
        <div 
          className="absolute inset-0 rounded-2xl p-6 md:p-8 border-2 border-cyan-400/30 flex flex-col items-center justify-center shadow-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(94, 179, 246, 0.1) 0%, rgba(139, 127, 246, 0.1) 100%)',
            backdropFilter: 'blur(20px)',
            backfaceVisibility: 'hidden',
          }}
        >
          <div 
            className="absolute top-0 left-0 w-full h-full opacity-10"
            style={{
              background: 'radial-gradient(circle at 20% 50%, rgba(127, 255, 212, 0.3) 0%, transparent 50%)',
            }}
          />
          <div className="relative z-10 text-center">
            <div className="text-lg mb-2">{frontFlag}</div>
            <p className="text-3xl md:text-4xl font-bold text-white mb-2">{frontText}</p>
            <div className="flex items-center gap-2 text-cyan-400/40 text-xs">
              <RotateCw className="w-3 h-3" />
              <span>{t('flashcards.clickToFlip')}</span>
            </div>
          </div>
        </div>

        {/* Back */}
        <div 
          className="absolute inset-0 rounded-2xl p-6 md:p-8 border-2 border-purple-400/30 flex flex-col items-center justify-center shadow-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(139, 127, 246, 0.1) 0%, rgba(255, 158, 216, 0.1) 100%)',
            backdropFilter: 'blur(20px)',
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <div 
            className="absolute top-0 right-0 w-full h-full opacity-10"
            style={{
              background: 'radial-gradient(circle at 80% 50%, rgba(255, 158, 216, 0.3) 0%, transparent 50%)',
            }}
          />
          <div className="relative z-10 text-center">
            <div className="text-lg mb-2">{backFlag}</div>
            <p className="text-3xl md:text-4xl font-bold text-white mb-2">{backText}</p>
            <div className="flex items-center gap-2 text-purple-400/40 text-xs">
              <RotateCw className="w-3 h-3" />
              <span>{t('flashcards.clickToFlip')}</span>
            </div>
          </div>
        </div>

        {/* Action buttons - always visible on mobile, hover on desktop */}
        <div className="absolute top-3 right-3 flex gap-2 z-10 md:opacity-0 md:group-hover:opacity-100">
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              className="p-2.5 bg-blue-500/20 hover:bg-blue-500/40 rounded-xl transition-all border border-blue-500/30 hover:border-blue-500/50 shadow-lg hover:scale-110"
              title={t('flashcard.edit')}
            >
              <Edit2 className="w-4 h-4 text-blue-400" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(id);
            }}
            className="p-2.5 bg-red-500/20 hover:bg-red-500/40 rounded-xl transition-all border border-red-500/30 hover:border-red-500/50 shadow-lg hover:scale-110"
            title={t('flashcard.delete')}
          >
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
