'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { validateAnswer } from '@/lib/answerValidator';
import { getAllValidTranslations } from '@/lib/synonyms';
import { incrementQuizzesCompleted } from '@/lib/streak';
import { Play, RotateCcw, CheckCircle, XCircle, TrendingUp, Search, Lightbulb, Loader2, PenLine, ListChecks } from 'lucide-react';

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

type QuizType = 'text' | 'multiple';

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
  const [isChecking, setIsChecking] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [quizType, setQuizType] = useState<QuizType>('text');
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const currentCard = flashcards[currentIndex];

  // Generate multiple choice options (1 correct + 3 wrong from other flashcards)
  const multipleChoiceOptions = useMemo(() => {
    if (!currentCard || flashcards.length < 2) return [];
    
    // Get wrong answers from other flashcards
    const otherCards = flashcards.filter(f => f.id !== currentCard.id);
    const shuffledOthers = [...otherCards].sort(() => Math.random() - 0.5);
    const wrongAnswers = shuffledOthers.slice(0, Math.min(3, shuffledOthers.length)).map(f => f.translation);
    
    // Add correct answer and shuffle
    const options = [currentCard.translation, ...wrongAnswers];
    return options.sort(() => Math.random() - 0.5);
  }, [currentCard, currentIndex, flashcards]);

  const checkAnswer = async () => {
    setIsChecking(true);
    
    try {
      if (quizType === 'multiple') {
        // Multiple choice - direct comparison
        const isAnswerCorrect = selectedOption !== null && 
          multipleChoiceOptions[selectedOption]?.toLowerCase().trim() === currentCard.translation.toLowerCase().trim();
        
        setIsCorrect(isAnswerCorrect);
        setFeedback(isAnswerCorrect ? 'Great job!' : undefined);
        setShowResult(true);
        if (isAnswerCorrect) {
          setScore(score + 1);
        }
      } else {
        // Text input - use synonym validation
        const validTranslations = await getAllValidTranslations(
          currentCard.word,
          currentCard.translation,
          currentCard.source_lang,
          currentCard.target_lang
        );
        
        const validation = validateAnswer(userAnswer, validTranslations);
        
        setIsCorrect(validation.isCorrect);
        setFeedback(validation.feedback);
        setShowResult(true);
        if (validation.isCorrect) {
          setScore(score + 1);
        }
      }
    } finally {
      setIsChecking(false);
    }
  };

  const nextQuestion = () => {
    if (currentIndex + 1 < flashcards.length) {
      setCurrentIndex(currentIndex + 1);
      setUserAnswer('');
      setShowResult(false);
      setShowHint(false);
      setSelectedOption(null);
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

    // Update streak and quiz count
    await incrementQuizzesCompleted(user.id);
  };

  const restartQuiz = () => {
    setCurrentIndex(0);
    setScore(0);
    setUserAnswer('');
    setShowResult(false);
    setQuizComplete(false);
    setQuizStarted(false);
    setShowHint(false);
    setSelectedOption(null);
  };

  const retryQuiz = () => {
    setCurrentIndex(0);
    setScore(0);
    setUserAnswer('');
    setShowResult(false);
    setQuizComplete(false);
    setShowHint(false);
    setSelectedOption(null);
    // Keep quizStarted as true to immediately start
  };

  const startQuiz = (type: QuizType) => {
    setQuizType(type);
    setQuizStarted(true);
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
          <p className="text-gray-300 mb-6 text-sm md:text-base">
            You have {flashcards.length} flashcard{flashcards.length !== 1 ? 's' : ''} to practice
          </p>
          
          <p className="text-gray-400 mb-4 text-sm">Choose quiz type:</p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => startQuiz('text')}
              className="gradient-cyan-purple hover:opacity-90 text-white font-semibold py-3 md:py-4 px-6 md:px-8 rounded-xl transition-all duration-200 shadow-lg hover:shadow-2xl inline-flex items-center justify-center gap-2"
            >
              <PenLine className="w-5 h-5" />
              Type Answer
            </button>
            <button
              onClick={() => startQuiz('multiple')}
              disabled={flashcards.length < 2}
              className="gradient-purple-pink hover:opacity-90 disabled:opacity-50 text-white font-semibold py-3 md:py-4 px-6 md:px-8 rounded-xl transition-all duration-200 shadow-lg hover:shadow-2xl inline-flex items-center justify-center gap-2"
            >
              <ListChecks className="w-5 h-5" />
              Multiple Choice
            </button>
          </div>
          
          {flashcards.length < 2 && (
            <p className="text-yellow-400/70 text-xs mt-4">
              Multiple choice requires at least 2 flashcards
            </p>
          )}
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
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Quiz Complete!
          </h2>
          <div className="flex items-center justify-center gap-2 mb-4">
            {quizType === 'text' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                <PenLine className="w-3 h-3" />
                Type Answer
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">
                <ListChecks className="w-3 h-3" />
                Multiple Choice
              </span>
            )}
          </div>
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
        
        {/* Hint button */}
        {!showResult && (
          <div className="mb-4 flex justify-center">
            <button
              onClick={() => setShowHint(!showHint)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all text-sm ${
                showHint 
                  ? 'bg-yellow-500/20 border-2 border-yellow-400/50 text-yellow-400' 
                  : 'glass-effect border border-white/20 text-white/70 hover:text-yellow-400 hover:border-yellow-400/30'
              }`}
            >
              <Lightbulb className="w-4 h-4" />
              {showHint ? 'Hide Hint' : 'Show Hint'}
            </button>
          </div>
        )}
        
        {/* Hint display */}
        {showHint && !showResult && (
          <div className="mb-4 p-3 glass-effect rounded-xl border border-yellow-400/30 text-center">
            <p className="text-yellow-400 text-sm">💡 Translation: <span className="font-semibold">{currentCard.translation}</span></p>
          </div>
        )}

        {!showResult ? (
          <div className="space-y-4">
            {quizType === 'text' ? (
              /* Text input mode */
              <>
                <input
                  type="text"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !showResult && userAnswer.trim() && !isChecking) {
                      checkAnswer();
                    }
                  }}
                  placeholder="Type your answer..."
                  disabled={showResult || isChecking}
                  className="w-full px-3 md:px-4 py-2 md:py-3 glass-effect border-2 border-white/20 rounded-xl focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-white disabled:opacity-50 text-sm md:text-base"
                />
                <button
                  onClick={() => checkAnswer()}
                  disabled={!userAnswer.trim() || isChecking}
                  className="w-full gradient-cyan-purple hover:opacity-90 disabled:opacity-50 text-white font-semibold py-3 md:py-4 px-4 md:px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-2xl disabled:cursor-not-allowed text-sm md:text-base flex items-center justify-center gap-2"
                >
                  {isChecking ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    'Check Answer'
                  )}
                </button>
              </>
            ) : (
              /* Multiple choice mode */
              <>
                <div className="space-y-3">
                  {multipleChoiceOptions.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedOption(index)}
                      disabled={isChecking}
                      className={`w-full px-4 py-3 rounded-xl text-left transition-all text-sm md:text-base ${
                        selectedOption === index
                          ? 'bg-cyan-500/20 border-2 border-cyan-400 text-white'
                          : 'glass-effect border-2 border-white/20 text-white/80 hover:border-white/40 hover:text-white'
                      }`}
                    >
                      <span className="font-semibold mr-2">{String.fromCharCode(65 + index)}.</span>
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => checkAnswer()}
                  disabled={selectedOption === null || isChecking}
                  className="w-full gradient-cyan-purple hover:opacity-90 disabled:opacity-50 text-white font-semibold py-3 md:py-4 px-4 md:px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-2xl disabled:cursor-not-allowed text-sm md:text-base flex items-center justify-center gap-2"
                >
                  {isChecking ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    'Check Answer'
                  )}
                </button>
              </>
            )}
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
