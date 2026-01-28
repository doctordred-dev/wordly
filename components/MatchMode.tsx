'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Play, RotateCcw, Trophy, Clock, Shuffle, CheckCircle } from 'lucide-react';

interface Flashcard {
  id: string;
  word: string;
  translation: string;
}

interface MatchModeProps {
  flashcards: Flashcard[];
}

interface MatchItem {
  id: string;
  text: string;
  type: 'word' | 'translation';
  originalId: string;
  matched: boolean;
}

export default function MatchMode({ flashcards }: MatchModeProps) {
  const { user } = useAuth();
  const [gameStarted, setGameStarted] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MatchItem | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<Set<string>>(new Set());
  const [wrongMatch, setWrongMatch] = useState<string | null>(null);
  const [timer, setTimer] = useState(0);
  const [moves, setMoves] = useState(0);
  const [items, setItems] = useState<MatchItem[]>([]);

  // Take up to 6 cards for the game (12 items total)
  const gameCards = useMemo(() => {
    const shuffled = [...flashcards].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(6, flashcards.length));
  }, [flashcards]);

  // Generate shuffled items
  const generateItems = () => {
    const words: MatchItem[] = gameCards.map(card => ({
      id: `word-${card.id}`,
      text: card.word,
      type: 'word',
      originalId: card.id,
      matched: false,
    }));

    const translations: MatchItem[] = gameCards.map(card => ({
      id: `trans-${card.id}`,
      text: card.translation.charAt(0).toUpperCase() + card.translation.slice(1),
      type: 'translation',
      originalId: card.id,
      matched: false,
    }));

    // Shuffle both arrays separately
    const shuffledWords = [...words].sort(() => Math.random() - 0.5);
    const shuffledTranslations = [...translations].sort(() => Math.random() - 0.5);

    setItems([...shuffledWords, ...shuffledTranslations]);
  };

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameStarted && !gameComplete) {
      interval = setInterval(() => {
        setTimer(t => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameStarted, gameComplete]);

  // Check for game completion
  useEffect(() => {
    if (gameStarted && matchedPairs.size === gameCards.length && gameCards.length > 0) {
      setGameComplete(true);
      saveResult();
    }
  }, [matchedPairs, gameCards.length, gameStarted]);

  const startGame = () => {
    generateItems();
    setGameStarted(true);
    setGameComplete(false);
    setMatchedPairs(new Set());
    setSelectedItem(null);
    setTimer(0);
    setMoves(0);
    setWrongMatch(null);
  };

  const handleItemClick = (item: MatchItem) => {
    if (item.matched || wrongMatch) return;

    if (!selectedItem) {
      setSelectedItem(item);
    } else {
      setMoves(m => m + 1);

      // Check if same type - can't match word with word
      if (selectedItem.type === item.type) {
        setSelectedItem(item);
        return;
      }

      // Check if match
      if (selectedItem.originalId === item.originalId) {
        // Correct match!
        setMatchedPairs(prev => new Set([...prev, item.originalId]));
        setItems(prev => prev.map(i => 
          i.originalId === item.originalId ? { ...i, matched: true } : i
        ));
        setSelectedItem(null);
      } else {
        // Wrong match
        setWrongMatch(item.id);
        setTimeout(() => {
          setWrongMatch(null);
          setSelectedItem(null);
        }, 500);
      }
    }
  };

  const saveResult = async () => {
    if (!user) return;
    await supabase.from('quiz_results').insert({
      user_id: user.id,
      score: gameCards.length,
      total_questions: gameCards.length,
      quiz_type: 'match',
    } as any);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (flashcards.length < 2) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <Shuffle className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-6 text-white/30" />
          <h3 className="text-xl md:text-2xl font-bold text-white mb-2">Not Enough Cards</h3>
          <p className="text-gray-300">
            You need at least 2 flashcards to play Match mode!
          </p>
        </div>
      </div>
    );
  }

  if (!gameStarted) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto glass-effect rounded-3xl shadow-2xl p-6 md:p-8 text-center border border-white/20">
          <div className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-6 gradient-cyan-purple rounded-2xl flex items-center justify-center">
            <Shuffle className="w-12 h-12 md:w-14 md:h-14 text-white" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Match Mode
          </h2>
          <p className="text-gray-300 mb-6 text-sm md:text-base">
            Match words with their translations as fast as you can!
          </p>
          <p className="text-gray-400 mb-8 text-sm">
            {Math.min(6, flashcards.length)} pairs to match
          </p>
          <button
            onClick={startGame}
            className="gradient-cyan-purple hover:opacity-90 text-white font-semibold py-3 md:py-4 px-6 md:px-8 rounded-xl transition-all duration-200 shadow-lg hover:shadow-2xl inline-flex items-center gap-2"
          >
            <Play className="w-5 h-5" />
            Start Game
          </button>
        </div>
      </div>
    );
  }

  if (gameComplete) {
    const isPerfect = moves === gameCards.length;
    
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto glass-effect rounded-3xl shadow-2xl p-6 md:p-8 text-center border border-white/20">
          <div className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-6 gradient-cyan-purple rounded-2xl flex items-center justify-center">
            <Trophy className="w-12 h-12 md:w-14 md:h-14 text-white" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            {isPerfect ? '🎉 Perfect!' : 'Great Job!'}
          </h2>
          
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="glass-effect rounded-xl p-4 border border-white/20">
              <Clock className="w-6 h-6 mx-auto mb-2 text-cyan-400" />
              <p className="text-2xl font-bold text-white">{formatTime(timer)}</p>
              <p className="text-gray-400 text-sm">Time</p>
            </div>
            <div className="glass-effect rounded-xl p-4 border border-white/20">
              <Shuffle className="w-6 h-6 mx-auto mb-2 text-purple-400" />
              <p className="text-2xl font-bold text-white">{moves}</p>
              <p className="text-gray-400 text-sm">Moves</p>
            </div>
          </div>

          <button
            onClick={startGame}
            className="gradient-cyan-purple hover:opacity-90 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-2xl inline-flex items-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            Play Again
          </button>
        </div>
      </div>
    );
  }

  // Split items into words and translations
  const words = items.filter(i => i.type === 'word');
  const translations = items.filter(i => i.type === 'translation');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Stats bar */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2 text-white">
            <Clock className="w-5 h-5 text-cyan-400" />
            <span className="font-mono text-lg">{formatTime(timer)}</span>
          </div>
          <div className="text-white">
            <span className="text-cyan-400 font-bold">{matchedPairs.size}</span>
            <span className="text-gray-400">/{gameCards.length} matched</span>
          </div>
          <div className="flex items-center gap-2 text-white">
            <span className="font-mono text-lg">{moves}</span>
            <span className="text-gray-400 text-sm">moves</span>
          </div>
        </div>

        {/* Game grid */}
        <div className="grid grid-cols-2 gap-4 md:gap-6">
          {/* Words column */}
          <div className="space-y-3">
            <p className="text-center text-gray-400 text-sm mb-2">Words</p>
            {words.map(item => (
              <button
                key={item.id}
                onClick={() => handleItemClick(item)}
                disabled={item.matched}
                className={`w-full p-4 rounded-xl text-center transition-all duration-200 ${
                  item.matched
                    ? 'bg-green-500/20 border-2 border-green-400 text-green-400'
                    : selectedItem?.id === item.id
                    ? 'bg-cyan-500/20 border-2 border-cyan-400 text-white scale-105'
                    : wrongMatch === item.id
                    ? 'bg-red-500/20 border-2 border-red-400 text-red-400 animate-shake'
                    : 'glass-effect border-2 border-white/20 text-white hover:border-cyan-400/50'
                }`}
              >
                {item.matched && <CheckCircle className="w-4 h-4 inline mr-2 text-green-400" />}
                {item.text}
              </button>
            ))}
          </div>

          {/* Translations column */}
          <div className="space-y-3">
            <p className="text-center text-gray-400 text-sm mb-2">Translations</p>
            {translations.map(item => (
              <button
                key={item.id}
                onClick={() => handleItemClick(item)}
                disabled={item.matched}
                className={`w-full p-4 rounded-xl text-center transition-all duration-200 ${
                  item.matched
                    ? 'bg-green-500/20 border-2 border-green-400 text-green-400'
                    : selectedItem?.id === item.id
                    ? 'bg-purple-500/20 border-2 border-purple-400 text-white scale-105'
                    : wrongMatch === item.id
                    ? 'bg-red-500/20 border-2 border-red-400 text-red-400 animate-shake'
                    : 'glass-effect border-2 border-white/20 text-white hover:border-purple-400/50'
                }`}
              >
                {item.matched && <CheckCircle className="w-4 h-4 inline mr-2 text-green-400" />}
                {item.text}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
