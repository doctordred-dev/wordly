'use client';

interface Tab {
  id: string;
  label: string;
  icon: string;
}

interface TabNavigationProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export default function TabNavigation({ tabs, activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div className="glass-effect border-b border-white/10">
      <div className="container mx-auto px-2 md:px-4">
        <div className="flex gap-1 md:gap-2 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-6 py-3 md:py-4 text-sm md:text-base font-medium transition-all duration-200 border-b-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-cyan-400 text-white'
                  : 'border-transparent text-white/60 hover:text-white/90'
              }`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
