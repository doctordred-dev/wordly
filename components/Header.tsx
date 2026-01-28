'use client';

import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n';
import Image from 'next/image';
import { BookMarked, LogOut, Globe } from 'lucide-react';

export default function Header() {
  const { user, signOut } = useAuth();
  const { language, setLanguage, t } = useI18n();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'uk' : 'en');
  };

  return (
    <header className="glass-effect sticky top-0 z-50 backdrop-blur-xl border-b border-white/10">
      <div className="container mx-auto px-3 md:px-6 py-3 md:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 gradient-cyan-purple rounded-xl flex items-center justify-center shadow-lg">
              <BookMarked className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <h1 
                className="text-xl md:text-2xl font-bold"
                style={{
                  background: 'linear-gradient(135deg, #7fffd4 0%, #5eb3f6 25%, #8b7ff6 50%, #ff9ed8 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {t('app.title')}
              </h1>
              <p className="text-[10px] md:text-xs text-gray-300 hidden sm:block">{t('app.subtitle')}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm font-medium text-white/80 hover:text-white glass-effect rounded-lg transition-all hover:bg-white/10 flex items-center gap-1.5"
              title={language === 'en' ? 'Switch to Ukrainian' : 'Перемкнути на англійську'}
            >
              <Globe className="w-4 h-4" />
              <span className="uppercase font-bold">{language}</span>
            </button>

            {user && (
              <>
                <div className="flex items-center gap-2 md:gap-3">
                  {user.user_metadata?.avatar_url && (
                    <Image
                      src={user.user_metadata.avatar_url}
                      alt="Avatar"
                      width={32}
                      height={32}
                      className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-cyan-400/50 shadow-lg"
                    />
                  )}
                  <div className="hidden lg:block">
                    <p className="text-sm font-medium text-white">
                      {user.user_metadata?.full_name || user.email}
                    </p>
                    <p className="text-xs text-gray-300">
                      {user.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={signOut}
                  className="px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium text-white/80 hover:text-white glass-effect rounded-lg transition-all hover:bg-white/10 flex items-center gap-1.5"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('auth.signOut')}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
