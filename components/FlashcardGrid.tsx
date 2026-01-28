'use client';

import Flashcard from './Flashcard';
import Image from 'next/image';

interface FlashcardData {
  id: string;
  word: string;
  translation: string;
  source_lang: string;
  target_lang: string;
}

interface FlashcardGridProps {
  flashcards: FlashcardData[];
  onDelete: (id: string) => void;
  showOriginalFirst?: boolean;
}

export default function FlashcardGrid({ flashcards, onDelete, showOriginalFirst = true }: FlashcardGridProps) {
  if (flashcards.length === 0) {
    return (
      <div className="text-center py-12 md:py-16">
        <Image src="/Search.png" alt="No flashcards" width={100} height={100} className="mx-auto mb-4 md:mb-6 opacity-50 w-20 h-20 md:w-24 md:h-24" />
        <h3 className="text-xl md:text-2xl font-bold text-white mb-2">No Flashcards Yet</h3>
        <p className="text-gray-300 text-base md:text-lg">
          Add some words above to create your first flashcard!
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-center gap-2 md:gap-3 mb-6 md:mb-8">
        <div className="h-0.5 md:h-1 w-8 md:w-12 rounded" style={{ background: 'linear-gradient(135deg, #7fffd4 0%, #5eb3f6 100%)' }}></div>
        <h2 
          className="text-2xl md:text-3xl font-bold text-center"
          style={{
            background: 'linear-gradient(135deg, #7fffd4 0%, #5eb3f6 25%, #8b7ff6 50%, #ff9ed8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Your Flashcards ({flashcards.length})
        </h2>
        <div className="h-0.5 md:h-1 w-8 md:w-12 rounded" style={{ background: 'linear-gradient(135deg, #8b7ff6 0%, #ff9ed8 100%)' }}></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {flashcards.map((card) => (
          <Flashcard
            key={card.id}
            id={card.id}
            word={card.word}
            translation={card.translation}
            onDelete={onDelete}
            showOriginalFirst={showOriginalFirst}
          />
        ))}
      </div>
    </div>
  );
}
