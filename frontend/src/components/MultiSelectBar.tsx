import React from 'react';
import {
  X,
  Download,
  Heart,
  Archive,
  ArchiveRestore,
  Trash2,
  FolderPlus,
  Pencil,
  ListMusic
} from 'lucide-react';

interface MultiSelectBarProps {
  selectedCount: number;
  currentTab?: string;
  onClear: () => void;
  onDownloadZip: () => void;
  onFavorite: () => void;
  onArchive: () => void;
  onUnarchive?: () => void;
  onAddToAlbum: () => void;
  onAddToPlaylist?: () => void;
  onTrash: () => void;
  onRename?: () => void;
}

export const MultiSelectBar: React.FC<MultiSelectBarProps> = ({
  selectedCount,
  currentTab,
  onClear,
  onDownloadZip,
  onFavorite,
  onArchive,
  onUnarchive,
  onAddToAlbum,
  onAddToPlaylist,
  onTrash,
  onRename
}) => {
  if (selectedCount === 0) return null;

  const isArchiveView = currentTab === 'archive';

  return (
    <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-40 bg-gray-900/95 dark:bg-[#121824]/95 text-white backdrop-blur-md px-4 sm:px-5 py-3 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-3 sm:gap-6 animate-slide-up max-w-[95vw] overflow-x-auto">
      {/* Left: Count & Deselect */}
      <div className="flex items-center gap-2 sm:gap-3 border-r border-white/20 pr-3 sm:pr-4 flex-shrink-0">
        <button
          onClick={onClear}
          className="p-1 text-white/70 hover:text-white rounded-lg transition-colors"
          title="Deselect All"
        >
          <X className="w-4 h-4" />
        </button>
        <span className="text-xs font-bold whitespace-nowrap">
          {selectedCount} selected
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
        {/* Rename option when exactly 1 item is selected */}
        {selectedCount === 1 && onRename && (
          <button
            onClick={onRename}
            title="Rename file"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-500 hover:bg-brand-600 rounded-xl text-xs font-semibold transition-all active:scale-95 shadow-md shadow-brand-500/25"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>Rename</span>
          </button>
        )}

        <button
          onClick={onDownloadZip}
          title="Download as ZIP"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-semibold transition-all active:scale-95"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Download ZIP</span>
        </button>

        <button
          onClick={onFavorite}
          title="Favorite"
          className="p-2 bg-white/10 hover:bg-white/20 text-rose-400 rounded-xl text-xs font-semibold transition-all active:scale-95"
        >
          <Heart className="w-4 h-4" />
        </button>

        {currentTab === 'audio' ? (
          <button
            onClick={onAddToPlaylist || onAddToAlbum}
            title="Add to Playlist"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold transition-all active:scale-95 shadow-md shadow-purple-500/25"
          >
            <ListMusic className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add to Playlist</span>
          </button>
        ) : (
          <button
            onClick={onAddToAlbum}
            title="Add to Album"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-semibold transition-all active:scale-95"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add to Album</span>
          </button>
        )}

        {/* Unarchive vs Archive Button */}
        {isArchiveView ? (
          <button
            onClick={onUnarchive || onArchive}
            title="Unarchive & Restore to Library"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold transition-all active:scale-95 shadow-md shadow-amber-500/25"
          >
            <ArchiveRestore className="w-3.5 h-3.5" />
            <span>Unarchive</span>
          </button>
        ) : (
          <button
            onClick={onArchive}
            title="Archive"
            className="p-2 bg-white/10 hover:bg-white/20 text-amber-400 rounded-xl text-xs font-semibold transition-all active:scale-95"
          >
            <Archive className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={onTrash}
          title="Delete"
          className="p-2 bg-rose-600/80 hover:bg-rose-600 text-white rounded-xl text-xs font-semibold transition-all active:scale-95 shadow-sm"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
