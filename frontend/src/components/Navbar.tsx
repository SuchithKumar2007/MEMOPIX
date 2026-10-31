import React from 'react';
import { Search, Plus, HardDrive, Moon, Sun, Menu } from 'lucide-react';
import { ProfileMenu } from './ProfileMenu';
import { InstallAppButton } from './InstallAppButton';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface NavbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenUpload: () => void;
  onNavigate: (tab: string) => void;
  onOpenMobileDrawer?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  searchQuery,
  onSearchChange,
  onOpenUpload,
  onNavigate,
  onOpenMobileDrawer
}) => {
  const { storage } = useAuth();
  const { isDark, setTheme } = useTheme();

  return (
    <header className="h-16 px-3 sm:px-4 md:px-6 bg-white/80 dark:bg-[#121824]/80 backdrop-blur-md border-b border-gray-200 dark:border-[#26334D] flex items-center justify-between gap-2 sm:gap-4 sticky top-0 z-30 transition-colors">
      {/* Mobile Top-Left Controls: Hamburger Menu & Brand */}
      <div className="flex md:hidden items-center gap-1.5 sm:gap-2 flex-shrink-0">
        <button
          onClick={onOpenMobileDrawer}
          className="p-2 -ml-1 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-[#1A2234] transition-colors"
          title="Open Menu"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <img
          src="/logo.png"
          alt="MEMOPIX Logo"
          className="w-7 h-7 sm:w-8 sm:h-8 object-contain rounded-lg cursor-pointer"
          onClick={onOpenMobileDrawer}
        />
        <span className="hidden sm:inline font-extrabold text-base tracking-tight text-gray-900 dark:text-white">
          MEMOPIX
        </span>
      </div>

      {/* Global Search Bar (Spacious and responsive) */}
      <div className="flex-1 min-w-[130px] max-w-xl mx-1 sm:mx-2">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-gray-400 dark:text-gray-500 absolute left-3 pointer-events-none flex-shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search memories, files..."
            className="w-full pl-9 pr-3 py-2 bg-gray-100 dark:bg-[#1A2234] border border-transparent focus:border-brand-500/50 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all shadow-inner"
          />
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
        {/* Quick 5 TB Quota Pill (desktop) */}
        <div
          onClick={() => onNavigate('storage')}
          className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-[#1A2234] border border-gray-200 dark:border-[#26334D] rounded-xl cursor-pointer hover:border-brand-500 transition-colors text-xs font-semibold"
        >
          <HardDrive className="w-3.5 h-3.5 text-brand-500" />
          <span className="text-gray-600 dark:text-gray-300">
            {storage?.formattedUsed || '0 B'}
          </span>
          <span className="text-gray-400">/ 5 TB</span>
        </div>

        {/* Install Native App (PWA) Button */}
        <InstallAppButton />

        {/* Quick Theme Toggle button (desktop / tablet) */}
        <button
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          aria-label="Toggle dark/light theme"
          className="hidden sm:flex p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#1A2234] rounded-xl transition-colors"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-brand-600" />}
        </button>

        {/* + Upload Button */}
        <button
          onClick={onOpenUpload}
          className="inline-flex items-center gap-1.5 px-3 py-2 sm:px-4 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 active:scale-95 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-brand-500/25 transition-all"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span className="hidden md:inline">Upload</span>
        </button>

        {/* User Profile Menu */}
        <ProfileMenu onNavigate={onNavigate} />
      </div>
    </header>
  );
};
