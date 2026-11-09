import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LayoutGrid, Upload, Filter, RefreshCw, Loader2 } from 'lucide-react';
import { MediaItem } from '../types';
import { mediaApi } from '../services/api';
import { MediaGrid } from '../components/MediaGrid';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { EmptyState } from '../components/EmptyState';

interface AllMediaPageProps {
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

type FilterType = 'all' | 'photos' | 'videos' | 'audio' | 'documents';

const CACHE_KEY = 'memopix_cache_all_media_v3';
const AUTO_RETRY_DELAYS = [3000, 5000, 8000, 10000, 15000];

export const AllMediaPage: React.FC<AllMediaPageProps> = ({
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
  // If we already have cached items, do NOT block screen with full-page skeleton loaders
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(CACHE_KEY);
      return saved === null;
    } catch {
      return true;
    }
  });
  const [isLoadError, setIsLoadError] = useState(false);
  const [filterType, setFilterType] = useState<FilterType>('all');
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

  const scheduleAutoRetry = useCallback((loadFn: () => void) => {
    const attempt = retryAttemptRef.current;
    if (attempt >= AUTO_RETRY_DELAYS.length) return;
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
      loadFn();
    }, delay);
  }, []);

  const loadAll = useCallback(async (manual = false) => {
    if (manual) {
      retryAttemptRef.current = 0;
      clearTimers();
    }
    // Only show full skeleton loader if never cached before
    setMedia(prev => {
      if (prev.length === 0 && localStorage.getItem(CACHE_KEY) === null) setIsLoading(true);
      return prev;
    });
    setIsLoadError(false);
    setRetryIn(null);
    try {
      const res = await mediaApi.list({
        view: filterType === 'all' ? undefined : filterType,
        search: searchQuery || undefined,
        limit: 500
      });
      if (res && res.success && res.data) {
        const items = res.data.items || [];
        setMedia(items);
        if (filterType === 'all' && !searchQuery) {
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
      setMedia(prev => {
        if (prev.length === 0) setIsLoadError(true);
        return prev;
      });
      scheduleAutoRetry(() => loadAll());
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, filterType, scheduleAutoRetry]);

  useEffect(() => {
    retryAttemptRef.current = 0;
    clearTimers();
    loadAll();
    return clearTimers;
  }, [searchQuery, reloadTrigger, filterType]);

  const filterButtons: { id: FilterType; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'photos', label: 'Photos' },
    { id: 'videos', label: 'Videos' },
    { id: 'audio', label: 'Audio' },
    { id: 'documents', label: 'Files' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              All Files
            </h2>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-brand-100 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 px-1.5 py-0.5 rounded-full">
              5 TB
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {media.length} item{media.length !== 1 ? 's' : ''} — photos, videos, audio &amp; documents
          </p>
        </div>
        <button
          onClick={onOpenUpload}
          className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-xl shadow-md shadow-brand-500/20 active:scale-95 transition-all"
        >
          <Upload className="w-4 h-4" />
          Upload Files
        </button>
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
        {filterButtons.map(f => (
          <button
            key={f.id}
            onClick={() => setFilterType(f.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
              filterType === f.id
                ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                : 'bg-gray-100 dark:bg-[#1A2234] text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#26334D]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <SkeletonLoader count={12} />
      ) : isLoadError ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center animate-pulse">
            <LayoutGrid className="w-8 h-8 text-cyan-400" />
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
            onClick={() => loadAll(true)}
            className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-brand-500 to-cyan-500 hover:opacity-90 text-white font-bold text-xs rounded-xl shadow-md active:scale-95 transition-all"
          >
            {retryIn !== null ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            <span>{retryIn !== null ? `Retry in ${retryIn}s` : 'Retry Now'}</span>
          </button>
        </div>
      ) : media.length === 0 ? (
        <EmptyState
          icon={LayoutGrid}
          title={searchQuery ? 'No files found' : 'No files uploaded yet'}
          description={
            searchQuery
              ? `No files matching "${searchQuery}"`
              : 'Upload photos, videos, audio and documents to your 5 TB private cloud.'
          }
          actionText="Upload Files"
          onAction={onOpenUpload}
        />
      ) : (
        <MediaGrid
          media={media}
          selectedIds={selectedIds}
          onToggleSelect={onToggleSelect}
          onSelectGroup={onSelectGroup}
          onClickMedia={(item) => onClickMedia(item, media)}
          onFavorite={onFavorite}
          onRename={onRename}
        />
      )}
    </div>
  );
};
