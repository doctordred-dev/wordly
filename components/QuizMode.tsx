'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import Image from 'next/image';

interface Flashcard {
  id: string;
  word: string;
  translation: string;
  source_lang: string;
  target_lang: string;
}

interface QuizModeProps {
  flashcards: Flashcard[];
}

export default function QuizMode({ flashcards }: QuizModeProps) {
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);

  const currentCard = flashcards[currentIndex];

  const checkAnswer = () => {
    const correct = userAnswer.trim().toLowerCase() === currentCard.translation.toLowerCase();
    setIsCorrect(correct);
    setShowResult(true);
    if (correct) {
      setScore(score + 1);
    }
  };

  const nextQuestion = () => {
    if (currentIndex + 1 < flashcards.length) {
      setCurrentIndex(currentIndex + 1);
      setUserAnswer('');
      setShowResult(false);
    } else {
      setQuizComplete(true);
      saveQuizResult();
    }
  };

  const saveQuizResult = async () => {
    if (!user) return;

    await supabase.from('quiz_results').insert({
      user_id: user.id,
      score,
      total_questions: flashcards.length,
    } as any);
  };

  const restartQuiz = () => {
    setCurrentIndex(0);
    setScore(0);
    setUserAnswer('');
    setShowResult(false);
    setQuizComplete(false);
    setQuizStarted(false);
  };

  if (flashcards.length === 0) {
    return (
      <div className="text-center py-16">
        <Image src="/Search.png" alt="Search" width={120} height={120} className="mx-auto mb-6 opacity-50" />
        <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">No Flashcards Yet</h3>
        <p className="text-gray-600 dark:text-gray-400">
          Create some flashcards first to start testing yourself!
        </p>
      </div>
    );
  }

  if (!quizStarted) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <Image src="/Idea.png" alt="Quiz" width={120} height={120} className="mx-auto mb-6" />
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">Ready to Test Yourself?</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          You have {flashcards.length} flashcard{flashcards.length !== 1 ? 's' : ''} to practice
        </p>
        <button
          onClick={() => setQuizStarted(true)}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          Start Quiz
        </button>
      </div>
    );
  }

  if (quizComplete) {
    const percentage = Math.round((score / flashcards.length) * 100);
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <Image 
          src={percentage >= 70 ? "/Success.png" : "/Feedback.png"} 
          alt="Result" 
          width={120} 
          height={120} 
          className="mx-auto mb-6" 
        />
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">Quiz Complete!</h2>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 mb-8 shadow-lg">
          <div className="text-6xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            {percentage}%
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            You got {score} out of {flashcards.length} correct
          </p>
        </div>
        <button
          onClick={restartQuiz}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Question {currentIndex + 1} of {flashcards.length}
          </span>
          <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
            Score: {score}/{flashcards.length}
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-indigo-600 to-purple-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-6">
        <div className="text-center mb-8">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Translate this word:</p>
          <h3 className="text-4xl font-bold text-gray-800 dark:text-white">{currentCard.word}</h3>
        </div>

        {!showResult ? (
          <div className="space-y-4">
            <input
              type="text"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && checkAnswer()}
              placeholder="Type your answer..."
              className="w-full px-6 py-4 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white text-lg"
              autoFocus
            />
            <button
              onClick={checkAnswer}
              disabled={!userAnswer.trim()}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200"
            >
              Check Answer
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div
              className={`p-6 rounded-xl ${
                isCorrect
                  ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-500'
                  : 'bg-red-50 dark:bg-red-900/20 border-2 border-red-500'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{isCorrect ? '✅' : '❌'}</span>
                <span className={`text-xl font-bold ${isCorrect ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                  {isCorrect ? 'Correct!' : 'Incorrect'}
                </span>
              </div>
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-medium">Correct answer:</span> {currentCard.translation}
              </p>
              {!isCorrect && (
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  <span className="font-medium">Your answer:</span> {userAnswer}
                </p>
              )}
            </div>
            <button
              onClick={nextQuestion}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200"
            >
              {currentIndex + 1 < flashcards.length ? 'Next Question' : 'Finish Quiz'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
