import React, { useState, useEffect } from 'react';
import { Video, Play } from 'lucide-react';
import { MediaItem } from '../types';
import { mediaApi } from '../services/api';
import { MediaGrid } from '../components/MediaGrid';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { EmptyState } from '../components/EmptyState';
import { useToast } from '../context/ToastContext';

interface VideosPageProps {
  searchQuery: string;
  selectedIds: string[];
  onToggleSelect: (id: string, e: React.MouseEvent) => void;
  onSelectGroup: (ids: string[]) => void;
  onClickMedia: (media: MediaItem, list: MediaItem[]) => void;
  onOpenUpload: () => void;
  onFavorite: (id: string, isFav: boolean) => void;
  reloadTrigger: number;
}

export const VideosPage: React.FC<VideosPageProps> = ({
  searchQuery,
  selectedIds,
  onToggleSelect,
  onSelectGroup,
  onClickMedia,
  onOpenUpload,
  onFavorite,
  reloadTrigger
}) => {
  const [videos, setVideos] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { error } = useToast();

  const loadVideos = async () => {
    setIsLoading(true);
    try {
      const res = await mediaApi.list({
        view: 'videos',
        search: searchQuery || undefined,
        limit: 200
      });
      if (res.success && res.data) {
        setVideos(res.data.items);
      }
    } catch {
      error('Failed to load videos.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadVideos();
  }, [searchQuery, reloadTrigger]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Videos
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {videos.length} {videos.length === 1 ? 'video' : 'videos'} in library
          </p>
        </div>
      </div>

      {isLoading ? (
        <SkeletonLoader count={12} />
      ) : videos.length === 0 ? (
        <EmptyState
          icon={Video}
          title="No videos yet."
          description="Upload your high-resolution MP4, MOV, or WEBM home videos to stream anywhere."
          actionText="Upload Video"
          onAction={onOpenUpload}
        />
      ) : (
        <MediaGrid
          media={videos}
          selectedIds={selectedIds}
          onToggleSelect={onToggleSelect}
          onSelectGroup={onSelectGroup}
          onClickMedia={item => onClickMedia(item, videos)}
          onFavorite={onFavorite}
        />
      )}
    </div>
  );
};
