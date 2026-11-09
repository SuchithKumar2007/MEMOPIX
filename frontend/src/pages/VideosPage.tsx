import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Video, RefreshCw, Loader2 } from 'lucide-react';
import { MediaItem } from '../types';
import { mediaApi } from '../services/api';
import { MediaGrid } from '../components/MediaGrid';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { EmptyState } from '../components/EmptyState';

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

const CACHE_KEY = 'memopix_cache_videos_v2';
const AUTO_RETRY_DELAYS = [3000, 5000, 8000, 10000, 15000];

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
  const [videos, setVideos] = useState<MediaItem[]>(() => {
    try {
      const saved = localStorage.getItem(CACHE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(CACHE_KEY);
      return saved === null;
    } catch {
      return true;
    }
  });
  const [isLoadError, setIsLoadError] = useState(false);
  const [retryIn, setRetryIn] = useState<number | null>(null);
  const retryAttemptRef = useRef(0);
  const retryTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimers = () => {
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    retryTimerRef.current = null;
    countdownRef.current = null;
  };

  const loadVideos = useCallback(async (manual = false) => {
    if (manual) {
      retryAttemptRef.current = 0;
      clearTimers();
    }
    setVideos(prev => {
      if (prev.length === 0 && localStorage.getItem(CACHE_KEY) === null) setIsLoading(true);
      return prev;
    });
    setIsLoadError(false);
    setRetryIn(null);
    try {
      const res = await mediaApi.list({
        view: 'videos',
        search: searchQuery || undefined,
        limit: 200
      });
      if (res && res.success && res.data) {
        const items = res.data.items || [];
        setVideos(items);
        if (!searchQuery) {
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(items));
          } catch {}
        }
        setIsLoadError(false);
        retryAttemptRef.current = 0;
      } else {
        throw new Error('API failure');
      }
    } catch {
      setVideos(prev => {
        if (prev.length === 0) setIsLoadError(true);
        return prev;
      });
      const attempt = retryAttemptRef.current;
      if (attempt < AUTO_RETRY_DELAYS.length) {
        const delay = AUTO_RETRY_DELAYS[attempt];
        retryAttemptRef.current = attempt + 1;
        let remaining = Math.round(delay / 1000);
        setRetryIn(remaining);
        countdownRef.current = setInterval(() => {
          remaining -= 1;
          setRetryIn(remaining > 0 ? remaining : null);
          if (remaining <= 0 && countdownRef.current) {
            clearInterval(countdownRef.current);
            countdownRef.current = null;
          }
        }, 1000);
        retryTimerRef.current = setTimeout(() => loadVideos(), delay);
      }
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    retryAttemptRef.current = 0;
    clearTimers();
    loadVideos();
    return clearTimers;
  }, [searchQuery, reloadTrigger]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">Videos</h1>
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
            <p className="text-sm font-bold text-white mb-1">Server is waking up…</p>
            <p className="text-xs text-gray-400 max-w-xs">
              The backend cloud is connecting. {retryIn !== null
                ? `Auto-retrying in ${retryIn}s…`
                : 'Retrying now…'}
            </p>
          </div>
          <button
            onClick={() => loadVideos(true)}
            className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-brand-500 to-cyan-500 hover:opacity-90 text-white font-bold text-xs rounded-xl shadow-md active:scale-95 transition-all"
          >
            {retryIn !== null ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            <span>{retryIn !== null ? `Retry in ${retryIn}s` : 'Retry Now'}</span>
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
