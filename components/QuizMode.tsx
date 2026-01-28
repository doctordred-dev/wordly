'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { validateAnswer } from '@/lib/answerValidator';
import { Play, RotateCcw, CheckCircle, XCircle, TrendingUp, Search } from 'lucide-react';

interface Flashcard {
  id: string;
  word: string;
  translation: string;
  source_lang: string;
  target_lang: string;
}

interface QuizModeProps {
  flashcards: Flashcard[];
  selectedModuleId: string | null;
}

export default function QuizMode({ flashcards, selectedModuleId }: QuizModeProps) {
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [feedback, setFeedback] = useState<string | undefined>();

  const currentCard = flashcards[currentIndex];

  const checkAnswer = async () => {
    const validation = await validateAnswer(
      userAnswer, 
      currentCard.translation,
      currentCard.source_lang,
      currentCard.target_lang
    );
    setIsCorrect(validation.isCorrect);
    setFeedback(validation.feedback);
    setShowResult(true);
    if (validation.isCorrect) {
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

  const retryQuiz = () => {
    setCurrentIndex(0);
    setScore(0);
    setUserAnswer('');
    setShowResult(false);
    setQuizComplete(false);
    // Keep quizStarted as true to immediately start
  };

  if (flashcards.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <Search className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-6 text-white/30" />
          <h3 className="text-xl md:text-2xl font-bold text-white mb-2">No Flashcards Yet</h3>
          <p className="text-gray-300">
            Create some flashcards first to start testing yourself!
          </p>
        </div>
      </div>
    );
  }

  if (!quizStarted) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto glass-effect rounded-3xl shadow-2xl p-6 md:p-8 text-center border border-white/20">
          <div className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-6 gradient-purple-pink rounded-2xl flex items-center justify-center">
            <Play className="w-12 h-12 md:w-14 md:h-14 text-white" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Ready to Test Yourself?
          </h2>
          <p className="text-gray-300 mb-8 text-sm md:text-base">
            You have {flashcards.length} flashcard{flashcards.length !== 1 ? 's' : ''} to practice
          </p>
          <button
            onClick={() => setQuizStarted(true)}
            className="gradient-cyan-purple hover:opacity-90 text-white font-semibold py-3 md:py-4 px-6 md:px-8 rounded-xl transition-all duration-200 shadow-lg hover:shadow-2xl inline-flex items-center gap-2"
          >
            <Play className="w-5 h-5" />
            Start Quiz
          </button>
        </div>
      </div>
    );
  }

  if (quizComplete) {
    const percentage = Math.round((score / flashcards.length) * 100);
    const isPerfect = percentage === 100;
    const isGood = percentage >= 80;
    const isOk = percentage >= 60;

    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto glass-effect rounded-3xl shadow-2xl p-6 md:p-8 text-center border border-white/20">
          <div className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-6 rounded-2xl flex items-center justify-center" style={{
            background: isPerfect ? 'linear-gradient(135deg, #7fffd4 0%, #5eb3f6 100%)' : 
                       isGood ? 'linear-gradient(135deg, #5eb3f6 0%, #8b7ff6 100%)' : 
                       'linear-gradient(135deg, #8b7ff6 0%, #ff9ed8 100%)'
          }}>
            <TrendingUp className="w-12 h-12 md:w-14 md:h-14 text-white" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Quiz Complete!
          </h2>
          <div className="mb-8">
            <div className="text-4xl md:text-5xl font-bold mb-2" style={{
              background: 'linear-gradient(135deg, #7fffd4 0%, #5eb3f6 25%, #8b7ff6 50%, #ff9ed8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              {percentage}%
            </div>
            <p className="text-gray-300 text-sm md:text-base">
              You got {score} out of {flashcards.length} correct
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
            <button
              onClick={retryQuiz}
              className="gradient-purple-pink hover:opacity-90 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-2xl inline-flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              Retry Same Words
            </button>
            <button
              onClick={restartQuiz}
              className="glass-effect border-2 border-white/20 hover:bg-white/10 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 inline-flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5" />
              New Quiz
            </button>
          </div>
        </div>
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

      <div className="glass-effect rounded-2xl shadow-xl p-4 md:p-8 mb-6 border border-white/20">
        <h3 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6 text-center">
          Translate this word:
        </h3>
        <div className="glass-effect rounded-xl p-4 md:p-6 mb-4 md:mb-6 border border-cyan-400/30">
          <p className="text-2xl md:text-3xl font-bold text-cyan-400 text-center">
            {currentCard.word}
          </p>
        </div>

        {!showResult ? (
          <div className="space-y-4">
            <input
              type="text"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !showResult && userAnswer.trim()) {
                  checkAnswer();
                }
              }}
              placeholder="Type your answer..."
              disabled={showResult}
              className="w-full px-3 md:px-4 py-2 md:py-3 glass-effect border-2 border-white/20 rounded-xl focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-white disabled:opacity-50 text-sm md:text-base"
            />
            <button
              onClick={showResult ? nextQuestion : () => checkAnswer()}
              disabled={!showResult && !userAnswer.trim()}
              className="w-full gradient-cyan-purple hover:opacity-90 disabled:opacity-50 text-white font-semibold py-3 md:py-4 px-4 md:px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-2xl disabled:cursor-not-allowed text-sm md:text-base"
            >
              {showResult ? 'Next Question' : 'Check Answer'}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {showResult && (
              <div className={`mt-4 p-3 md:p-4 glass-effect rounded-xl border-2 ${
                isCorrect 
                  ? 'border-green-400/50' 
                  : 'border-red-400/50'
              }`}>
                <div className="flex items-center gap-2 md:gap-3">
                  {isCorrect ? (
                    <CheckCircle className="w-6 h-6 md:w-8 md:h-8 text-green-400 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-6 h-6 md:w-8 md:h-8 text-red-400 flex-shrink-0" />
                  )}
                  <div>
                    <p className={`font-semibold text-sm md:text-base ${
                      isCorrect ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {isCorrect ? 'Correct!' : 'Incorrect'}
                    </p>
                    {feedback && (
                      <p className="text-cyan-300 text-xs md:text-sm italic">
                        {feedback}
                      </p>
                    )}
                    {!isCorrect && (
                      <p className="text-gray-300 text-xs md:text-sm">
                        Correct answer: <span className="font-semibold">{currentCard.translation}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
            <button
              onClick={nextQuestion}
              className="w-full gradient-cyan-purple hover:opacity-90 text-white font-semibold py-3 md:py-4 px-4 md:px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-2xl text-sm md:text-base"
            >
              {currentIndex + 1 < flashcards.length ? 'Next Question' : 'Finish Quiz'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
