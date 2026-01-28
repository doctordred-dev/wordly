'use client';

import { useState } from 'react';

interface FlashcardProps {
  id: string;
  word: string;
  translation: string;
  onDelete: (id: string) => void;
}

export default function Flashcard({ id, word, translation, onDelete }: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div className="relative group">
      <div
        className="relative h-48 md:h-56 cursor-pointer"
        onClick={() => setIsFlipped(!isFlipped)}
        style={{ perspective: '1000px' }}
      >
        <div
          className={`absolute w-full h-full transition-all duration-500 transform-style-3d ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          <div
            className="absolute w-full h-full glass-effect rounded-2xl shadow-xl flex items-center justify-center p-4 md:p-8 backface-hidden border-2 border-white/20 hover:shadow-2xl transition-all hover:border-cyan-400/50"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className="text-center">
              <div className="text-[10px] md:text-xs font-medium text-cyan-400 mb-1 md:mb-2 uppercase tracking-wide">
                Word
              </div>
              <p 
                className="text-2xl md:text-3xl font-bold text-center break-words"
                style={{
                  background: 'linear-gradient(135deg, #5eb3f6 0%, #8b7ff6 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {word}
              </p>
            </div>
          </div>

          <div
            className="absolute w-full h-full gradient-full rounded-2xl shadow-xl flex items-center justify-center p-4 md:p-8 backface-hidden hover:shadow-2xl transition-shadow"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <div className="text-center">
              <div className="text-[10px] md:text-xs font-medium text-white/80 mb-1 md:mb-2 uppercase tracking-wide">
                Translation
              </div>
              <p className="text-2xl md:text-3xl font-bold text-white text-center break-words">
                {translation}
              </p>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          if (confirm('Delete this flashcard?')) {
            onDelete(id);
          }
        }}
        className="absolute top-2 right-2 md:top-3 md:right-3 bg-red-500/80 hover:bg-red-600 backdrop-blur-sm text-white rounded-full w-7 h-7 md:w-9 md:h-9 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 shadow-lg hover:scale-110 font-bold text-base md:text-lg"
        title="Delete flashcard"
      >
        ×
      </button>
    </div>
  );
}
