import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Image as ImageIcon, RefreshCw, Loader2 } from 'lucide-react';
import { MediaItem } from '../types';
import { mediaApi } from '../services/api';
import { MediaGrid } from '../components/MediaGrid';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { EmptyState } from '../components/EmptyState';

interface PhotosPageProps {
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

const CACHE_KEY = 'memopix_cache_photos_v3';
const AUTO_RETRY_DELAYS = [3000, 5000, 8000, 10000, 15000];

export const PhotosPage: React.FC<PhotosPageProps> = ({
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
  const [media, setMedia] = useState<MediaItem[]>(() => {
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

  const loadPhotos = useCallback(async (manual = false) => {
    if (manual) {
      retryAttemptRef.current = 0;
      clearTimers();
    }
    setMedia(prev => {
      if (prev.length === 0 && localStorage.getItem(CACHE_KEY) === null) setIsLoading(true);
      return prev;
    });
    setIsLoadError(false);
    setRetryIn(null);
    try {
      const res = await mediaApi.list({
        view: 'photos',
        search: searchQuery || undefined,
        limit: 200
      });
      if (res.success && res.data) {
        const photoOnly = res.data.items.filter((item: MediaItem) => {
          const mime = (item.mimeType || '').toLowerCase();
          const name = (item.originalName || item.fileName || '').toLowerCase();
          if (
            mime.startsWith('audio/') ||
            mime.startsWith('video/') ||
            mime.startsWith('application/') ||
            mime.startsWith('text/') ||
            /\.(mp3|wav|ogg|m4a|aac|flac|wma|opus|mp4|webm|mkv|mov|avi|wmv|3gp|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|zip|rar|tar|gz|7z)$/i.test(name)
          ) return false;
          return (
            mime.startsWith('image/') ||
            /\.(jpe?g|png|gif|webp|svg|bmp|heic|heif|tiff?|raw|cr2|nef|arw|dng)$/i.test(name)
          );
        });
        setMedia(photoOnly);
        if (!searchQuery) {
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(photoOnly));
          } catch {}
        }
        setIsLoadError(false);
        retryAttemptRef.current = 0;
      } else {
        throw new Error('API returned failure');
      }
    } catch {
      setMedia(prev => {
        if (prev.length === 0) setIsLoadError(true);
        return prev;
      });
      scheduleAutoRetry();
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  const scheduleAutoRetry = useCallback(() => {
    const attempt = retryAttemptRef.current;
    if (attempt >= AUTO_RETRY_DELAYS.length) return; // give up after max retries
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

    retryTimerRef.current = setTimeout(() => {
      loadPhotos();
    }, delay);
  }, [loadPhotos]);

  useEffect(() => {
    retryAttemptRef.current = 0;
    clearTimers();
    loadPhotos();
    return clearTimers;
  }, [searchQuery, reloadTrigger]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">Photos</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {media.length} {media.length === 1 ? 'memory' : 'memories'} in timeline
          </p>
        </div>
      </div>

      {isLoading ? (
        <SkeletonLoader count={18} />
      ) : isLoadError ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
            <ImageIcon className="w-8 h-8 text-amber-400" />
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
            onClick={() => loadPhotos(true)}
            className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-brand-500 to-cyan-500 hover:opacity-90 text-white font-bold text-xs rounded-xl shadow-md active:scale-95 transition-all"
          >
            {retryIn !== null ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            <span>{retryIn !== null ? `Retry in ${retryIn}s` : 'Retry Now'}</span>
          </button>
        </div>
      ) : media.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title="Your memories start here."
          description="Upload your first photo to begin organizing your 5 TB private gallery."
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
          onRename={onRename}
        />
      )}
    </div>
  );
};
