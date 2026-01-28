'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'uk';

interface Translations {
  [key: string]: {
    en: string;
    uk: string;
  };
}

const translations: Translations = {
  // Header
  'app.title': {
    en: 'Wordly',
    uk: 'Wordly',
  },
  'app.subtitle': {
    en: 'Learn Words',
    uk: 'Вивчай слова',
  },
  'auth.signOut': {
    en: 'Sign Out',
    uk: 'Вийти',
  },
  
  // Tabs
  'tabs.cards': {
    en: 'Cards',
    uk: 'Картки',
  },
  'tabs.quiz': {
    en: 'Quiz',
    uk: 'Тест',
  },
  'tabs.match': {
    en: 'Match',
    uk: 'Матч',
  },
  'tabs.awards': {
    en: 'Awards',
    uk: 'Нагороди',
  },
  'tabs.friends': {
    en: 'Friends',
    uk: 'Друзі',
  },
  'tabs.stats': {
    en: 'Stats',
    uk: 'Статистика',
  },
  
  // Modules
  'modules.title': {
    en: 'Modules',
    uk: 'Модулі',
  },
  'modules.all': {
    en: 'All',
    uk: 'Всі',
  },
  'modules.new': {
    en: 'New Module',
    uk: 'Новий модуль',
  },
  'modules.create': {
    en: 'Create',
    uk: 'Створити',
  },
  'modules.cancel': {
    en: 'Cancel',
    uk: 'Скасувати',
  },
  'modules.delete.confirm': {
    en: 'Delete this module? Flashcards will not be deleted, just unassigned.',
    uk: 'Видалити цей модуль? Картки не будуть видалені, лише відв\'язані.',
  },
  
  // Flashcards
  'flashcards.addNew': {
    en: 'Add New Words',
    uk: 'Додати нові слова',
  },
  'flashcards.fromLang': {
    en: 'From Language',
    uk: 'З мови',
  },
  'flashcards.toLang': {
    en: 'To Language',
    uk: 'На мову',
  },
  'flashcards.placeholder': {
    en: 'Enter words in any format: hello, world, computer good morning how are you. thank you. programming',
    uk: 'Введіть слова в будь-якому форматі: привіт, світ, комп\'ютер доброго ранку як справи. дякую. програмування',
  },
  'flashcards.translate': {
    en: 'Translate & Add',
    uk: 'Перекласти і додати',
  },
  'flashcards.translating': {
    en: 'Translating...',
    uk: 'Перекладаю...',
  },
  'flashcards.showOriginal': {
    en: 'Show Original First',
    uk: 'Спочатку оригінал',
  },
  'flashcards.showTranslation': {
    en: 'Show Translation First',
    uk: 'Спочатку переклад',
  },
  'flashcards.noCards': {
    en: 'No flashcards yet',
    uk: 'Ще немає карток',
  },
  'flashcards.addFirst': {
    en: 'Add your first words above to get started!',
    uk: 'Додайте свої перші слова вище, щоб почати!',
  },
  'flashcards.yourCards': {
    en: 'Your Flashcards',
    uk: 'Ваші картки',
  },
  'flashcards.clickToFlip': {
    en: 'Click to flip',
    uk: 'Натисніть, щоб перевернути',
  },
  'flashcards.smartInput': {
    en: 'Smart input: Separate by comma, space, dot, or new line. Phrases are auto-detected!',
    uk: 'Розумний ввід: Розділяйте комою, пробілом, крапкою або новим рядком. Фрази визначаються автоматично!',
  },
  'flashcards.flexibleInput': {
    en: 'Flexible input! Try any format:',
    uk: 'Гнучкий ввід! Спробуйте будь-який формат:',
  },
  
  // Quiz
  'quiz.start': {
    en: 'Start Quiz',
    uk: 'Почати тест',
  },
  'quiz.typeAnswer': {
    en: 'Type Answer',
    uk: 'Ввести відповідь',
  },
  'quiz.multipleChoice': {
    en: 'Multiple Choice',
    uk: 'Вибір варіанту',
  },
  'quiz.question': {
    en: 'Question',
    uk: 'Питання',
  },
  'quiz.translateWord': {
    en: 'Translate this word:',
    uk: 'Перекладіть це слово:',
  },
  'quiz.yourAnswer': {
    en: 'Your answer...',
    uk: 'Ваша відповідь...',
  },
  'quiz.checkAnswer': {
    en: 'Check Answer',
    uk: 'Перевірити',
  },
  'quiz.checking': {
    en: 'Checking...',
    uk: 'Перевіряю...',
  },
  'quiz.correct': {
    en: 'Correct!',
    uk: 'Правильно!',
  },
  'quiz.incorrect': {
    en: 'Incorrect',
    uk: 'Неправильно',
  },
  'quiz.correctAnswer': {
    en: 'Correct answer:',
    uk: 'Правильна відповідь:',
  },
  'quiz.next': {
    en: 'Next',
    uk: 'Далі',
  },
  'quiz.complete': {
    en: 'Quiz Complete!',
    uk: 'Тест завершено!',
  },
  'quiz.score': {
    en: 'You got {score} out of {total} correct',
    uk: 'Ви відповіли правильно на {score} з {total}',
  },
  'quiz.retry': {
    en: 'Retry Same Words',
    uk: 'Повторити ці слова',
  },
  'quiz.newQuiz': {
    en: 'New Quiz',
    uk: 'Новий тест',
  },
  'quiz.hint': {
    en: 'Hint',
    uk: 'Підказка',
  },
  'quiz.noCards': {
    en: 'No flashcards available',
    uk: 'Немає доступних карток',
  },
  'quiz.addCardsFirst': {
    en: 'Add some flashcards first to start a quiz!',
    uk: 'Спочатку додайте картки, щоб почати тест!',
  },
  'quiz.ready': {
    en: 'Ready to Test Yourself?',
    uk: 'Готові перевірити себе?',
  },
  'quiz.cardsToPractice': {
    en: 'You have {count} flashcards to practice',
    uk: 'У вас {count} карток для практики',
  },
  'quiz.chooseType': {
    en: 'Choose quiz type:',
    uk: 'Оберіть тип тесту:',
  },
  'quiz.minCards': {
    en: 'Multiple choice requires at least 2 flashcards',
    uk: 'Для вибору варіанту потрібно мінімум 2 картки',
  },
  
  // Match Mode
  'match.title': {
    en: 'Match Mode',
    uk: 'Режим матчу',
  },
  'match.instruction': {
    en: 'Match words with their translations',
    uk: 'З\'єднайте слова з їх перекладами',
  },
  'match.start': {
    en: 'Start Game',
    uk: 'Почати гру',
  },
  'match.time': {
    en: 'Time',
    uk: 'Час',
  },
  'match.moves': {
    en: 'Moves',
    uk: 'Ходи',
  },
  'match.complete': {
    en: 'Great job!',
    uk: 'Чудова робота!',
  },
  'match.playAgain': {
    en: 'Play Again',
    uk: 'Грати знову',
  },
  'match.matchFast': {
    en: 'Match words with their translations as fast as you can!',
    uk: 'З\'єднайте слова з перекладами якнайшвидше!',
  },
  'match.pairsToMatch': {
    en: '{count} pairs to match',
    uk: '{count} пар для з\'єднання',
  },
  'match.notEnough': {
    en: 'Not Enough Cards',
    uk: 'Недостатньо карток',
  },
  'match.needAtLeast': {
    en: 'You need at least 2 flashcards to play Match mode!',
    uk: 'Для режиму матчу потрібно мінімум 2 картки!',
  },
  'match.matched': {
    en: 'matched',
    uk: 'з\'єднано',
  },
  
  // Achievements
  'achievements.title': {
    en: 'Achievements',
    uk: 'Досягнення',
  },
  'achievements.unlocked': {
    en: 'Unlocked',
    uk: 'Розблоковано',
  },
  'achievements.locked': {
    en: 'Locked',
    uk: 'Заблоковано',
  },
  'achievements.progress': {
    en: 'Progress',
    uk: 'Прогрес',
  },
  'achievements.totalWords': {
    en: 'Total Words',
    uk: 'Всього слів',
  },
  'achievements.quizzes': {
    en: 'Quizzes',
    uk: 'Тестів',
  },
  'achievements.streak': {
    en: 'Day Streak',
    uk: 'Днів поспіль',
  },
  
  // Friends
  'friends.title': {
    en: 'Friends',
    uk: 'Друзі',
  },
  'friends.import': {
    en: 'Import Module',
    uk: 'Імпортувати модуль',
  },
  'friends.importDesc': {
    en: 'Enter a share code to import a module from a friend',
    uk: 'Введіть код, щоб імпортувати модуль від друга',
  },
  'friends.shareCode': {
    en: 'Share Code',
    uk: 'Код для поширення',
  },
  'friends.importBtn': {
    en: 'Import',
    uk: 'Імпортувати',
  },
  'friends.importing': {
    en: 'Importing...',
    uk: 'Імпортую...',
  },
  'friends.sharedModules': {
    en: 'Your Shared Modules',
    uk: 'Ваші спільні модулі',
  },
  'friends.noShared': {
    en: 'No shared modules yet',
    uk: 'Ще немає спільних модулів',
  },
  
  // Share Modal
  'share.title': {
    en: 'Share Code',
    uk: 'Код для поширення',
  },
  'share.description': {
    en: 'Share this code with friends to let them import your module',
    uk: 'Поділіться цим кодом з друзями, щоб вони могли імпортувати ваш модуль',
  },
  'share.close': {
    en: 'Close',
    uk: 'Закрити',
  },
  
  // Stats
  'stats.title': {
    en: 'Statistics',
    uk: 'Статистика',
  },
  'stats.wordsLearned': {
    en: 'Words Learned',
    uk: 'Вивчено слів',
  },
  'stats.quizzesCompleted': {
    en: 'Quizzes Completed',
    uk: 'Завершено тестів',
  },
  'stats.avgScore': {
    en: 'Average Score',
    uk: 'Середній відсоток відповідей',
  },
  'stats.questionsAnswered': {
    en: 'Questions Answered',
    uk: 'Відповідей',
  },
  'stats.recentResults': {
    en: 'Recent Quiz Results',
    uk: 'Останні результати',
  },
  'stats.noResults': {
    en: 'No quiz results yet. Take a quiz to see your progress!',
    uk: 'Ще немає результатів. Пройдіть тест, щоб побачити свій прогрес!',
  },
  'stats.correct': {
    en: 'correct',
    uk: 'правильно',
  },
  
  // Languages
  'lang.en': {
    en: 'English',
    uk: 'Англійська',
  },
  'lang.uk': {
    en: 'Ukrainian',
    uk: 'Українська',
  },
  'lang.ru': {
    en: 'Russian',
    uk: 'Російська',
  },
  'lang.de': {
    en: 'German',
    uk: 'Німецька',
  },
  'lang.fr': {
    en: 'French',
    uk: 'Французька',
  },
  'lang.es': {
    en: 'Spanish',
    uk: 'Іспанська',
  },
  'lang.it': {
    en: 'Italian',
    uk: 'Італійська',
  },
  'lang.pt': {
    en: 'Portuguese',
    uk: 'Португальська',
  },
  'lang.pl': {
    en: 'Polish',
    uk: 'Польська',
  },
  'lang.ja': {
    en: 'Japanese',
    uk: 'Японська',
  },
  'lang.zh': {
    en: 'Chinese',
    uk: 'Китайська',
  },
  'lang.ko': {
    en: 'Korean',
    uk: 'Корейська',
  },
  
  // Common
  'common.loading': {
    en: 'Loading...',
    uk: 'Завантаження...',
  },
  'common.error': {
    en: 'An error occurred',
    uk: 'Сталася помилка',
  },
  'common.save': {
    en: 'Save',
    uk: 'Зберегти',
  },
  'common.delete': {
    en: 'Delete',
    uk: 'Видалити',
  },
  'common.edit': {
    en: 'Edit',
    uk: 'Редагувати',
  },
  'common.share': {
    en: 'Share',
    uk: 'Поділитися',
  },
  'common.copy': {
    en: 'Copy',
    uk: 'Копіювати',
  },
  
  // Login
  'login.title': {
    en: 'Welcome to Wordly',
    uk: 'Ласкаво просимо до Wordly',
  },
  'login.subtitle': {
    en: 'Learn languages with flashcards',
    uk: 'Вивчайте мови з картками',
  },
  'login.google': {
    en: 'Continue with Google',
    uk: 'Продовжити з Google',
  },
};

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    // Load saved language preference
    const saved = localStorage.getItem('wordly_language') as Language;
    if (saved && (saved === 'en' || saved === 'uk')) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('wordly_language', lang);
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    const translation = translations[key];
    if (!translation) {
      console.warn(`Missing translation for key: ${key}`);
      return key;
    }
    
    let text = translation[language] || translation.en;
    
    // Replace parameters like {score} with actual values
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        text = text.replace(`{${param}}`, String(value));
      });
    }
    
    return text;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

export type { Language };
