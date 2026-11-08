import React, { useState, useEffect } from 'react';
import { Video, Play, RefreshCw } from 'lucide-react';
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
  onRename?: (media: MediaItem) => void;
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
  onRename,
  reloadTrigger
}) => {
  const [videos, setVideos] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadError, setIsLoadError] = useState(false);
  const { error } = useToast();

  const loadVideos = async () => {
    setIsLoading(true);
    setIsLoadError(false);
    try {
      const res = await mediaApi.list({
        view: 'videos',
        search: searchQuery || undefined,
        limit: 200
      });
      if (res && res.success && res.data) {
        setVideos(res.data.items || []);
        setIsLoadError(false);
      } else if (!res?.success) {
        setIsLoadError(true);
      }
    } catch {
      setIsLoadError(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-retry when server is waking up
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLoadError) {
      timer = setTimeout(() => {
        loadVideos();
      }, 5500);
    }
    return () => clearTimeout(timer);
  }, [isLoadError]);

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
      ) : isLoadError ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center animate-pulse">
            <Video className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-white mb-1">Connecting to 5 TB Video Vault…</p>
            <p className="text-xs text-gray-400 max-w-xs">
              Backend is waking up. Synchronizing your video library in a moment…
            </p>
          </div>
          <button
            onClick={() => loadVideos()}
            className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-brand-500 to-cyan-500 hover:opacity-90 text-white font-bold text-xs rounded-xl shadow-md active:scale-95 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
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
          onRename={onRename}
        />
      )}
    </div>
  );
};
