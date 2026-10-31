import React, { useState, useRef, useEffect } from 'react';
import { User, LogOut, Settings, HardDrive, Moon, Sun, Monitor, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface ProfileMenuProps {
  onNavigate: (tab: string) => void;
}

export const ProfileMenu: React.FC<ProfileMenuProps> = ({ onNavigate }) => {
  const { user, logout, storage } = useAuth();
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initials = user?.name
    ? user.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2)
    : 'U';

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(prev => !prev)}
        aria-label="User Profile Menu"
        className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-500 to-brand-700 text-white font-bold text-sm flex items-center justify-center shadow-md hover:ring-2 hover:ring-brand-400 hover:ring-offset-2 dark:hover:ring-offset-[#121824] transition-all focus:outline-none"
      >
        {user?.avatarUrl ? (
          <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover rounded-full" />
        ) : (
          initials
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-72 bg-white dark:bg-[#121824] border border-gray-200 dark:border-[#26334D] rounded-2xl shadow-2xl p-2 z-50 animate-slide-up">
          {/* User Info Header */}
          <div className="p-3 border-b border-gray-100 dark:border-[#26334D] mb-1">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-brand-500 text-white font-bold text-base flex items-center justify-center shrink-0">
                {initials}
              </div>
              <div className="overflow-hidden">
                <p className="font-bold text-sm text-gray-900 dark:text-white truncate">
                  {user?.name || 'User Account'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user?.email}
                </p>
              </div>
            </div>

            <div className="mt-3 py-1.5 px-2.5 bg-gray-50 dark:bg-[#1A2234] rounded-xl flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-300">
              <span>Quota: 5 TB</span>
              <span className="text-brand-600 dark:text-brand-400">{storage?.formattedUsed || '0 B'} used</span>
            </div>
          </div>

          {/* Menu Items */}
          <div className="space-y-1">
            <button
              onClick={() => {
                setIsOpen(false);
                onNavigate('settings');
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1A2234] rounded-xl transition-colors"
            >
              <Settings className="w-4 h-4 text-gray-400" />
              <span>Account & Settings</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                onNavigate('storage');
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1A2234] rounded-xl transition-colors"
            >
              <HardDrive className="w-4 h-4 text-gray-400" />
              <span>Storage Dashboard</span>
            </button>

            {/* Theme Selector */}
            <div className="px-3 py-2 border-t border-b border-gray-100 dark:border-[#26334D] my-1">
              <div className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                Appearance
              </div>
              <div className="grid grid-cols-3 gap-1 bg-gray-100 dark:bg-[#1A2234] p-1 rounded-xl">
                <button
                  onClick={() => setTheme('light')}
                  className={`flex items-center justify-center gap-1.5 py-1 text-xs rounded-lg font-medium transition-all ${
                    theme === 'light' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" /> Light
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`flex items-center justify-center gap-1.5 py-1 text-xs rounded-lg font-medium transition-all ${
                    theme === 'dark' ? 'bg-brand-500 text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" /> Dark
                </button>
                <button
                  onClick={() => setTheme('system')}
                  className={`flex items-center justify-center gap-1.5 py-1 text-xs rounded-lg font-medium transition-all ${
                    theme === 'system' ? 'bg-white dark:bg-[#26334D] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" /> Auto
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors font-semibold"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
