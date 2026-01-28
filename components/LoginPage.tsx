'use client';

import { useAuth } from '@/lib/auth-context';
import Image from 'next/image';

export default function LoginPage() {
  const { signInWithGoogle } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 space-y-8">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-5xl">📚</span>
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Welcome to Wordly
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Master new languages with smart flashcards
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
              <Image src="/Success.png" alt="Success" width={48} height={48} className="mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Smart Learning</p>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
              <Image src="/Idea.png" alt="Idea" width={48} height={48} className="mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Quick Tests</p>
            </div>
            <div className="text-center p-4 bg-pink-50 dark:bg-pink-900/20 rounded-xl">
              <Image src="/Improve.png" alt="Improve" width={48} height={48} className="mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Track Progress</p>
            </div>
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <Image src="/Help.png" alt="Help" width={48} height={48} className="mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Auto Translate</p>
            </div>
          </div>

          <button
            onClick={signInWithGoogle}
            className="w-full bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 hover:border-indigo-500 dark:hover:border-indigo-500 text-gray-700 dark:text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-3 shadow-md hover:shadow-lg"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>

          <p className="text-center text-xs text-gray-500 dark:text-gray-400">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
