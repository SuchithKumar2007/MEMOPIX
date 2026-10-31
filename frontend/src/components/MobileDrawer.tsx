import React from 'react';
import {
  X,
  LayoutGrid,
  Image,
  Video,
  Music,
  FolderOpen,
  FolderArchive,
  Heart,
  Archive,
  Share2,
  Trash2,
  HardDrive,
  Settings,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  currentTab,
  onSelectTab
}) => {
  const { storage } = useAuth();
  const { isDark, setTheme } = useTheme();

  if (!isOpen) return null;

  const navItems = [
    { id: 'all', label: 'All Files', icon: LayoutGrid },
    { id: 'photos', label: 'Photos', icon: Image },
    { id: 'videos', label: 'Videos', icon: Video },
    { id: 'audio', label: 'Music & Audio', icon: Music },
    { id: 'folders', label: 'Folders & Files', icon: FolderOpen },
    { id: 'albums', label: 'Albums', icon: FolderArchive },
    { id: 'favorites', label: 'Favorites', icon: Heart },
    { id: 'archive', label: 'Archive', icon: Archive },
    { id: 'shared', label: 'Shared', icon: Share2 },
    { id: 'trash', label: 'Trash', icon: Trash2 },
  ];

  const secondaryItems = [
    { id: 'storage', label: 'Storage (5 TB)', icon: HardDrive },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleItemClick = (id: string) => {
    onSelectTab(id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 md:hidden animate-fade-in">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
      />

      {/* Slide-out Drawer Panel */}
      <div className="relative w-4/5 max-w-xs h-full bg-white dark:bg-[#121824] shadow-2xl flex flex-col p-4 border-r border-gray-200 dark:border-[#26334D] animate-slide-right select-none">
        {/* Drawer Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-[#26334D] mb-4">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="MEMOPIX Logo" className="w-9 h-9 object-contain rounded-xl" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-gray-900 dark:text-white">
                  MEMOPIX
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wider bg-brand-100 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 px-1.5 py-0.5 rounded-full">
                  5 TB
                </span>
              </div>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">
                Private Cloud Gallery
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-[#1A2234] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items (Scrollable) */}
        <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
          <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-3 mb-1.5">
            Library
          </div>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-brand-500 text-white shadow-md font-semibold'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1A2234]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="pt-4 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-3 mb-1.5">
            System &amp; Settings
          </div>
          {secondaryItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-brand-500 text-white shadow-md font-semibold'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1A2234]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}

          {/* Theme Toggle Button */}
          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1A2234] transition-all mt-2"
          >
            <div className="flex items-center gap-3">
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-brand-600" />}
              <span>{isDark ? 'Light Theme' : 'Dark Theme'}</span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Toggle
            </span>
          </button>
        </nav>

        {/* 5 TB Storage Quota Widget */}
        <div className="mt-auto pt-3 border-t border-gray-200 dark:border-[#26334D]">
          <div
            onClick={() => handleItemClick('storage')}
            className="p-3 bg-gray-50 dark:bg-[#1A2234] border border-gray-200 dark:border-[#26334D] rounded-2xl cursor-pointer hover:border-brand-500/50 transition-all"
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-brand-500" />
                <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
                  5 TB Storage
                </span>
              </div>
              <span className="text-[11px] font-bold text-brand-600 dark:text-brand-400">
                {storage?.percentageUsed || 0}%
              </span>
            </div>

            <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden mb-1.5">
              <div
                className="bg-gradient-to-r from-brand-400 to-brand-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.max(storage?.percentageUsed || 0, 1)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] text-gray-500 dark:text-gray-400 font-medium">
              <span>{storage?.formattedUsed || '0 B'} used</span>
              <span>of 5 TB</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
