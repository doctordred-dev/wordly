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
        className="relative h-48 cursor-pointer"
        onClick={() => setIsFlipped(!isFlipped)}
        style={{ perspective: '1000px' }}
      >
        <div
          className={`absolute w-full h-full transition-transform duration-500 transform-style-3d ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          <div
            className="absolute w-full h-full bg-white dark:bg-gray-800 rounded-xl shadow-lg flex items-center justify-center p-6 backface-hidden border-2 border-indigo-200 dark:border-indigo-700"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <p className="text-2xl font-bold text-gray-800 dark:text-white text-center break-words">
              {word}
            </p>
          </div>

          <div
            className="absolute w-full h-full bg-indigo-600 dark:bg-indigo-700 rounded-xl shadow-lg flex items-center justify-center p-6 backface-hidden"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <p className="text-2xl font-bold text-white text-center break-words">
              {translation}
            </p>
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
        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
        title="Delete flashcard"
      >
        ×
      </button>
    </div>
  );
}
