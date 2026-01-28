'use client';

import { useAuth } from '@/lib/auth-context';
import Image from 'next/image';

export default function LoginPage() {
  const { signInWithGoogle } = useAuth();

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4" style={{ background: '#1a1a2e' }}>
      <div 
        className="fixed inset-0 z-0 opacity-40"
        style={{
          backgroundImage: 'url(/Propery-bgr.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />
      <div className="max-w-md w-full relative z-10">
        <div className="glass-effect rounded-3xl shadow-2xl p-6 md:p-8 space-y-6 md:space-y-8 backdrop-blur-2xl">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 md:w-20 md:h-20 gradient-cyan-purple rounded-2xl flex items-center justify-center shadow-2xl">
                <span className="text-4xl md:text-5xl">📚</span>
              </div>
            </div>
            <div>
              <h1 
                className="text-3xl md:text-4xl font-bold"
                style={{
                  background: 'linear-gradient(135deg, #7fffd4 0%, #5eb3f6 25%, #8b7ff6 50%, #ff9ed8 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Welcome to Wordly
              </h1>
              <p className="text-gray-300 mt-2 text-sm md:text-base">
                Master new languages with smart flashcards
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <div className="text-center p-3 md:p-4 glass-effect rounded-xl hover:bg-white/10 transition-all">
              <Image src="/Success.png" alt="Success" width={40} height={40} className="mx-auto mb-2 w-8 h-8 md:w-10 md:h-10" />
              <p className="text-xs md:text-sm font-medium text-white">Smart Learning</p>
            </div>
            <div className="text-center p-3 md:p-4 glass-effect rounded-xl hover:bg-white/10 transition-all">
              <Image src="/Idea.png" alt="Idea" width={40} height={40} className="mx-auto mb-2 w-8 h-8 md:w-10 md:h-10" />
              <p className="text-xs md:text-sm font-medium text-white">Quick Tests</p>
            </div>
            <div className="text-center p-3 md:p-4 glass-effect rounded-xl hover:bg-white/10 transition-all">
              <Image src="/Improve.png" alt="Improve" width={40} height={40} className="mx-auto mb-2 w-8 h-8 md:w-10 md:h-10" />
              <p className="text-xs md:text-sm font-medium text-white">Track Progress</p>
            </div>
            <div className="text-center p-3 md:p-4 glass-effect rounded-xl hover:bg-white/10 transition-all">
              <Image src="/Help.png" alt="Help" width={40} height={40} className="mx-auto mb-2 w-8 h-8 md:w-10 md:h-10" />
              <p className="text-xs md:text-sm font-medium text-white">Auto Translate</p>
            </div>
          </div>

          <button
            onClick={signInWithGoogle}
            className="w-full glass-effect border-2 border-white/20 hover:border-cyan-400/50 text-white font-semibold py-3 md:py-4 px-4 md:px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 md:gap-3 shadow-lg hover:shadow-2xl hover:bg-white/10 text-sm md:text-base"
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

          <p className="text-center text-xs text-gray-400">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
