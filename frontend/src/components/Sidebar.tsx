import {
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
  Settings
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const { storage } = useAuth();

  const navItems = [
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

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen bg-white dark:bg-[#121824] border-r border-gray-200 dark:border-[#26334D] p-4 shrink-0 select-none transition-colors">
      {/* Brand & Logo */}
      <div className="flex items-center gap-3 px-3 py-3 mb-6">
        <img
          src="/logo.png"
          alt="MEMOPIX Logo"
          className="w-12 h-12 object-contain rounded-xl"
        />
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="font-extrabold text-xl tracking-tight text-gray-900 dark:text-white">
              MEMOPIX
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-brand-100 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 px-1.5 py-0.5 rounded-full">
              5 TB
            </span>
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
            Every Picture Becomes Your Memories
          </p>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
        <div className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-3 mb-2">
          Library
        </div>
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/25 font-semibold'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1A2234] hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400 dark:text-gray-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}

        <div className="pt-5 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-3 mb-2">
          System & Settings
        </div>
        {secondaryItems.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/25 font-semibold'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1A2234] hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400 dark:text-gray-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* 5 TB Storage Quota Widget */}
      <div className="mt-auto pt-4">
        <div
          onClick={() => onSelectTab('storage')}
          className="p-3.5 bg-gray-50 dark:bg-[#1A2234] border border-gray-200 dark:border-[#26334D] rounded-2xl cursor-pointer hover:border-brand-500/50 transition-all group shadow-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-brand-500" />
              <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
                5 TB Storage
              </span>
            </div>
            <span className="text-[11px] font-bold text-brand-600 dark:text-brand-400">
              {storage?.percentageUsed || 0}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden mb-2">
            <div
              className="bg-gradient-to-r from-brand-400 to-brand-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.max(storage?.percentageUsed || 0, 1)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 font-medium">
            <span>{storage?.formattedUsed || '0 B'} used</span>
            <span>of 5 TB</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
