import React from 'react';
import {
  X,
  Download,
  Heart,
  Archive,
  Trash2,
  FolderPlus,
  CheckSquare
} from 'lucide-react';

interface MultiSelectBarProps {
  selectedCount: number;
  onClear: () => void;
  onDownloadZip: () => void;
  onFavorite: () => void;
  onArchive: () => void;
  onAddToAlbum: () => void;
  onTrash: () => void;
}

export const MultiSelectBar: React.FC<MultiSelectBarProps> = ({
  selectedCount,
  onClear,
  onDownloadZip,
  onFavorite,
  onArchive,
  onAddToAlbum,
  onTrash
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-40 bg-gray-900/95 dark:bg-[#121824]/95 text-white backdrop-blur-md px-5 py-3 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-4 sm:gap-6 animate-slide-up max-w-[95vw]">
      {/* Left: Count & Deselect */}
      <div className="flex items-center gap-3 border-r border-white/20 pr-4">
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
      <div className="flex items-center gap-1.5 sm:gap-2">
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

        <button
          onClick={onAddToAlbum}
          title="Add to Album"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-semibold transition-all active:scale-95"
        >
          <FolderPlus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Add to Album</span>
        </button>

        <button
          onClick={onArchive}
          title="Archive"
          className="p-2 bg-white/10 hover:bg-white/20 text-amber-400 rounded-xl text-xs font-semibold transition-all active:scale-95"
        >
          <Archive className="w-4 h-4" />
        </button>

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
