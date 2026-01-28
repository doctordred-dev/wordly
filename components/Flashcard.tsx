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
        className="relative h-56 cursor-pointer"
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
            className="absolute w-full h-full bg-gradient-to-br from-white to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-xl flex items-center justify-center p-8 backface-hidden border-2 border-indigo-100 dark:border-indigo-900 hover:shadow-2xl transition-shadow"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className="text-center">
              <div className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mb-2 uppercase tracking-wide">
                Word
              </div>
              <p className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent text-center break-words">
                {word}
              </p>
            </div>
          </div>

          <div
            className="absolute w-full h-full bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl shadow-xl flex items-center justify-center p-8 backface-hidden hover:shadow-2xl transition-shadow"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <div className="text-center">
              <div className="text-xs font-medium text-indigo-100 mb-2 uppercase tracking-wide">
                Translation
              </div>
              <p className="text-3xl font-bold text-white text-center break-words">
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
        className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white rounded-full w-9 h-9 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 shadow-lg hover:scale-110 font-bold text-lg"
        title="Delete flashcard"
      >
        ×
      </button>
    </div>
  );
}
