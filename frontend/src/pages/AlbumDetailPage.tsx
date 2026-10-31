import React, { useState, useEffect } from 'react';
import { ArrowLeft, Share2, Trash2, Plus, Image as ImageIcon } from 'lucide-react';
import { Album, MediaItem } from '../types';
import { albumApi } from '../services/api';
import { MediaGrid } from '../components/MediaGrid';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { EmptyState } from '../components/EmptyState';
import { useToast } from '../context/ToastContext';

interface AlbumDetailPageProps {
  album: Album;
  onBack: () => void;
  selectedIds: string[];
  onToggleSelect: (id: string, e: React.MouseEvent) => void;
  onSelectGroup: (ids: string[]) => void;
  onClickMedia: (media: MediaItem, list: MediaItem[]) => void;
  onShareAlbum: (album: Album) => void;
  onOpenUpload: () => void;
  onFavorite: (id: string, isFav: boolean) => void;
  reloadTrigger: number;
}

export const AlbumDetailPage: React.FC<AlbumDetailPageProps> = ({
  album,
  onBack,
  selectedIds,
  onToggleSelect,
  onSelectGroup,
  onClickMedia,
  onShareAlbum,
  onOpenUpload,
  onFavorite,
  reloadTrigger
}) => {
  const [albumDetails, setAlbumDetails] = useState<Album | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { success, error } = useToast();

  const loadDetails = async () => {
    setIsLoading(true);
    try {
      const res = await albumApi.getById(album.id);
      if (res.success && res.data) {
        setAlbumDetails(res.data);
      }
    } catch {
      error('Failed to load album details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [album.id, reloadTrigger]);

  const mediaList = albumDetails?.media || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#1A2234] rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              {albumDetails?.title || album.title}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {mediaList.length} {mediaList.length === 1 ? 'item' : 'items'} in album
              {albumDetails?.description && ` • ${albumDetails.description}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onShareAlbum(albumDetails || album)}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-gray-100 dark:bg-[#1A2234] hover:bg-gray-200 dark:hover:bg-[#26334D] text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-xl transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share Album</span>
          </button>
          <button
            onClick={onOpenUpload}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Photos</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <SkeletonLoader count={12} />
      ) : mediaList.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title="Album is empty"
          description="Add existing photos or upload new ones to this album."
          actionText="Upload to Album"
          onAction={onOpenUpload}
        />
      ) : (
        <MediaGrid
          media={mediaList}
          selectedIds={selectedIds}
          onToggleSelect={onToggleSelect}
          onSelectGroup={onSelectGroup}
          onClickMedia={item => onClickMedia(item, mediaList)}
          onFavorite={onFavorite}
        />
      )}
    </div>
  );
};
