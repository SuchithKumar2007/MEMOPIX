import React from 'react';
import { Image, Video, Music, FolderOpen, FolderArchive, Menu, LayoutGrid } from 'lucide-react';

interface BottomNavigationProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenMobileMenu: () => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  currentTab,
  onSelectTab,
  onOpenMobileMenu
}) => {
  const items = [
    { id: 'all', label: 'All', icon: LayoutGrid },
    { id: 'photos', label: 'Photos', icon: Image },
    { id: 'videos', label: 'Videos', icon: Video },
    { id: 'audio', label: 'Music', icon: Music },
    { id: 'folders', label: 'Folders', icon: FolderOpen },
    { id: 'albums', label: 'Albums', icon: FolderArchive },
    { id: 'more', label: 'More', icon: Menu, isMenu: true },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-[#121824]/90 backdrop-blur-md border-t border-gray-200 dark:border-[#26334D] px-2 py-2 flex items-center justify-around">
      {items.map(item => {
        const Icon = item.icon;
        const isActive = currentTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => {
              if (item.isMenu) {
                onOpenMobileMenu();
              } else {
                onSelectTab(item.id);
              }
            }}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
              isActive
                ? 'text-brand-500 font-bold'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};
