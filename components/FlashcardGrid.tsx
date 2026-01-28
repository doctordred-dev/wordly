'use client';

import Flashcard from './Flashcard';

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
        <div className="text-6xl mb-4">📝</div>
        <p className="text-gray-500 dark:text-gray-400 text-lg">
          No flashcards yet. Add some words to get started!
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-8 text-center">
        Your Flashcards ({flashcards.length})
      </h2>
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
