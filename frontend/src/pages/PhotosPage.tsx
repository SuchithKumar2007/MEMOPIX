import React, { useState, useEffect, useRef } from 'react';
import { Image as ImageIcon, Upload, Filter, Calendar, RefreshCw } from 'lucide-react';
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
  onRename?: (media: MediaItem) => void;
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
  onRename,
  reloadTrigger
}) => {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadError, setIsLoadError] = useState(false);
  const errorShownRef = useRef(false);
  const { error } = useToast();

  const [retryCountdown, setRetryCountdown] = useState<number | null>(null);

  const loadPhotos = async (isManual = false) => {
    setIsLoading(true);
    setIsLoadError(false);
    setRetryCountdown(null);
    try {
      const res = await mediaApi.list({
        view: 'photos',
        search: searchQuery || undefined,
        limit: 200
      });
      if (res.success && res.data) {
        // Enforce strict photo filtering: only image files belong in Photos
        const photoOnly = res.data.items.filter((item: MediaItem) => {
          const mime = (item.mimeType || '').toLowerCase();
          const name = (item.originalName || item.fileName || '').toLowerCase();

          // Explicit exclusion of audio, video, documents, archives
          if (
            mime.startsWith('audio/') ||
            mime.startsWith('video/') ||
            mime.startsWith('application/') ||
            mime.startsWith('text/') ||
            /\.(mp3|wav|ogg|m4a|aac|flac|wma|opus|mid|midi|mp4|webm|mkv|mov|avi|wmv|3gp|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|zip|rar|tar|gz|7z)$/i.test(name)
          ) {
            return false;
          }

          // Inclusion of images only
          return (
            mime.startsWith('image/') ||
            /\.(jpe?g|png|gif|webp|svg|bmp|heic|heif|tiff?|raw|cr2|nef|arw|dng)$/i.test(name)
          );
        });
        setMedia(photoOnly);
        setIsLoadError(false);
      } else if (!res?.success) {
        setIsLoadError(true);
      }
    } catch (err: any) {
      setIsLoadError(true);
      if (!errorShownRef.current) {
        errorShownRef.current = true;
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-retry when server is waking up
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLoadError) {
      timer = setTimeout(() => {
        loadPhotos();
      }, 6500);
    }
    return () => clearTimeout(timer);
  }, [isLoadError]);

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
      ) : isLoadError ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
            <ImageIcon className="w-8 h-8 text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-white mb-1">Server is waking up…</p>
            <p className="text-xs text-gray-400 max-w-xs">
              The backend cloud is connecting. Please wait a moment and tap retry.
            </p>
          </div>
          <button
            onClick={() => { errorShownRef.current = false; loadPhotos(); }}
            className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-brand-500 to-cyan-500 hover:opacity-90 text-white font-bold text-xs rounded-xl shadow-md active:scale-95 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
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
          onRename={onRename}
        />
      )}
    </div>
  );
};
