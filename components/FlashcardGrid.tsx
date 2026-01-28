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
}

export default function FlashcardGrid({ flashcards, onDelete }: FlashcardGridProps) {
  if (flashcards.length === 0) {
    return (
      <div className="text-center py-16">
        <Image src="/Search.png" alt="No flashcards" width={120} height={120} className="mx-auto mb-6 opacity-50" />
        <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">No Flashcards Yet</h3>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          Add some words above to create your first flashcard!
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-center gap-3 mb-8">
        <div className="h-1 w-12 bg-gradient-to-r from-transparent to-indigo-600 rounded"></div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent text-center">
          Your Flashcards ({flashcards.length})
        </h2>
        <div className="h-1 w-12 bg-gradient-to-l from-transparent to-purple-600 rounded"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {flashcards.map((card) => (
          <Flashcard
            key={card.id}
            id={card.id}
            word={card.word}
            translation={card.translation}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}
