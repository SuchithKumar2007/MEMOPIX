import React, { useState, useEffect } from 'react';
import { Archive } from 'lucide-react';
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
  reloadTrigger: number;
}

export const ArchivePage: React.FC<ArchivePageProps> = ({
  selectedIds,
  onToggleSelect,
  onSelectGroup,
  onClickMedia,
  onFavorite,
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
        />
      )}
    </div>
  );
};
