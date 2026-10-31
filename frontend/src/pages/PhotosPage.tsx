import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Upload, Filter, Calendar } from 'lucide-react';
import { MediaItem } from '../types';
import { mediaApi } from '../services/api';
import { MediaGrid } from '../components/MediaGrid';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { EmptyState } from '../components/EmptyState';
import { useToast } from '../context/ToastContext';

interface PhotosPageProps {
  searchQuery: string;
  selectedIds: string[];
  onToggleSelect: (id: string, e: React.MouseEvent) => void;
  onSelectGroup: (ids: string[]) => void;
  onClickMedia: (media: MediaItem, list: MediaItem[]) => void;
  onOpenUpload: () => void;
  onFavorite: (id: string, isFav: boolean) => void;
  reloadTrigger: number;
}

export const PhotosPage: React.FC<PhotosPageProps> = ({
  searchQuery,
  selectedIds,
  onToggleSelect,
  onSelectGroup,
  onClickMedia,
  onOpenUpload,
  onFavorite,
  reloadTrigger
}) => {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { error } = useToast();

  const loadPhotos = async () => {
    setIsLoading(true);
    try {
      const res = await mediaApi.list({
        view: 'photos',
        search: searchQuery || undefined,
        limit: 200
      });
      if (res.success && res.data) {
        setMedia(res.data.items);
      }
    } catch (err: any) {
      error('Failed to load photos gallery.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPhotos();
  }, [searchQuery, reloadTrigger]);

  return (
    <div className="space-y-6">
      {/* Top Header info */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Photos
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {media.length} {media.length === 1 ? 'memory' : 'memories'} in timeline
          </p>
        </div>
      </div>

      {isLoading ? (
        <SkeletonLoader count={18} />
      ) : media.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title="Your memories start here."
          description="Upload your first photo or video to begin organizing your 5 TB private gallery."
          actionText="Upload Memories"
          onAction={onOpenUpload}
        />
      ) : (
        <MediaGrid
          media={media}
          selectedIds={selectedIds}
          onToggleSelect={onToggleSelect}
          onSelectGroup={onSelectGroup}
          onClickMedia={item => onClickMedia(item, media)}
          onFavorite={onFavorite}
        />
      )}
    </div>
  );
};
