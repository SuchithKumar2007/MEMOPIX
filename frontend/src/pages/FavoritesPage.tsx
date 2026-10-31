import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { MediaItem } from '../types';
import { mediaApi } from '../services/api';
import { MediaGrid } from '../components/MediaGrid';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { EmptyState } from '../components/EmptyState';
import { useToast } from '../context/ToastContext';

interface FavoritesPageProps {
  selectedIds: string[];
  onToggleSelect: (id: string, e: React.MouseEvent) => void;
  onSelectGroup: (ids: string[]) => void;
  onClickMedia: (media: MediaItem, list: MediaItem[]) => void;
  onFavorite: (id: string, isFav: boolean) => void;
  reloadTrigger: number;
}

export const FavoritesPage: React.FC<FavoritesPageProps> = ({
  selectedIds,
  onToggleSelect,
  onSelectGroup,
  onClickMedia,
  onFavorite,
  reloadTrigger
}) => {
  const [favorites, setFavorites] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { error } = useToast();

  const loadFavorites = async () => {
    setIsLoading(true);
    try {
      const res = await mediaApi.list({ view: 'favorites', limit: 200 });
      if (res.success && res.data) {
        setFavorites(res.data.items);
      }
    } catch {
      error('Failed to load favorites.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, [reloadTrigger]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Favorites
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {favorites.length} {favorites.length === 1 ? 'favorite item' : 'favorite items'}
          </p>
        </div>
      </div>

      {isLoading ? (
        <SkeletonLoader count={12} />
      ) : favorites.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="No favorite memories yet."
          description="Click the heart icon on any photo or video to add it to your favorite collection."
        />
      ) : (
        <MediaGrid
          media={favorites}
          selectedIds={selectedIds}
          onToggleSelect={onToggleSelect}
          onSelectGroup={onSelectGroup}
          onClickMedia={item => onClickMedia(item, favorites)}
          onFavorite={onFavorite}
        />
      )}
    </div>
  );
};
