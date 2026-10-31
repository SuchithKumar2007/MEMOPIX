import React, { useState, useEffect } from 'react';
import { Archive, ArchiveRestore } from 'lucide-react';
import { MediaItem } from '../types';
import { mediaApi } from '../services/api';
import { MediaGrid } from '../components/MediaGrid';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { EmptyState } from '../components/EmptyState';
import { useToast } from '../context/ToastContext';

interface ArchivePageProps {
  selectedIds: string[];
  onToggleSelect: (id: string, e: React.MouseEvent) => void;
  onSelectGroup: (ids: string[]) => void;
  onClickMedia: (media: MediaItem, list: MediaItem[]) => void;
  onFavorite: (id: string, isFav: boolean) => void;
  onUnarchive?: (ids: string[]) => void;
  onRename?: (media: MediaItem) => void;
  reloadTrigger: number;
}

export const ArchivePage: React.FC<ArchivePageProps> = ({
  selectedIds,
  onToggleSelect,
  onSelectGroup,
  onClickMedia,
  onFavorite,
  onUnarchive,
  onRename,
  reloadTrigger
}) => {
  const [archived, setArchived] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { error } = useToast();

  const loadArchive = async () => {
    setIsLoading(true);
    try {
      const res = await mediaApi.list({ view: 'archive', limit: 200 });
      if (res.success && res.data) {
        setArchived(res.data.items);
      }
    } catch {
      error('Failed to load archived media.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadArchive();
  }, [reloadTrigger]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Archive
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {archived.length} archived {archived.length === 1 ? 'item' : 'items'} • Hidden from main photos view
          </p>
        </div>

        {selectedIds.length > 0 && onUnarchive && (
          <button
            onClick={() => onUnarchive(selectedIds)}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-500/25 active:scale-95 transition-all"
          >
            <ArchiveRestore className="w-4 h-4" />
            <span>Unarchive ({selectedIds.length})</span>
          </button>
        )}
      </div>

      {isLoading ? (
        <SkeletonLoader count={12} />
      ) : archived.length === 0 ? (
        <EmptyState
          icon={Archive}
          title="Archive is empty."
          description="Archived photos and videos remain safely stored in your 5 TB quota and searchable, but won't clutter your main gallery."
        />
      ) : (
        <MediaGrid
          media={archived}
          selectedIds={selectedIds}
          onToggleSelect={onToggleSelect}
          onSelectGroup={onSelectGroup}
          onClickMedia={item => onClickMedia(item, archived)}
          onFavorite={onFavorite}
          onRename={onRename}
        />
      )}
    </div>
  );
};
