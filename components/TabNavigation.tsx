'use client';

import { useState, useRef, useEffect } from 'react';
import { LucideIcon, ChevronRight } from 'lucide-react';

interface Tab {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface TabNavigationProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export default function TabNavigation({ tabs, activeTab, onTabChange }: TabNavigationProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showRightFade, setShowRightFade] = useState(true);
  const [showLeftFade, setShowLeftFade] = useState(false);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftFade(scrollLeft > 10);
      setShowRightFade(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  return (
    <div className="glass-effect border-b border-white/10 relative">
      <div className="container mx-auto px-2 md:px-4">
        <div 
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-1 md:gap-2 overflow-x-auto scrollbar-hide"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-6 py-3 md:py-4 text-sm md:text-base font-medium transition-all duration-200 border-b-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-cyan-400 text-white'
                    : 'border-transparent text-white/60 hover:text-white/90'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Left fade indicator */}
      {showLeftFade && (
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-slate-900/90 to-transparent pointer-events-none md:hidden" />
      )}
      
      {/* Right fade indicator with arrow */}
      {showRightFade && (
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-slate-900/90 to-transparent pointer-events-none flex items-center justify-end pr-1 md:hidden">
          <ChevronRight className="w-5 h-5 text-white/50 animate-pulse" />
        </div>
      )}
    </div>
  );
}
