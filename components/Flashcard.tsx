'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { Trash2, RotateCw } from 'lucide-react';

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
  showOriginalFirst?: boolean;
  sourceLang?: string;
  targetLang?: string;
}

export default function Flashcard({ id, word, translation, onDelete, showOriginalFirst = true, sourceLang = 'en', targetLang = 'uk' }: FlashcardProps) {
  const { t } = useI18n();
  const [isFlipped, setIsFlipped] = useState(false);

  const frontText = showOriginalFirst ? word : translation;
  const backText = showOriginalFirst ? translation : word;
  const frontFlag = showOriginalFirst ? langFlags[sourceLang] || '🌐' : langFlags[targetLang] || '🌐';
  const backFlag = showOriginalFirst ? langFlags[targetLang] || '🌐' : langFlags[sourceLang] || '🌐';

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

        {/* Delete button - always visible on mobile, hover on desktop */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(id);
          }}
          className="absolute top-3 right-3 p-2.5 bg-red-500/20 hover:bg-red-500/40 rounded-xl transition-all z-10 md:opacity-0 md:group-hover:opacity-100 border border-red-500/30 hover:border-red-500/50 shadow-lg hover:scale-110"
          title="Delete flashcard"
        >
          <Trash2 className="w-4 h-4 text-red-400" />
        </button>
      </div>
    </div>
  );
}
