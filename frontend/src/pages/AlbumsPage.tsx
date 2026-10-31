import React, { useState, useEffect } from 'react';
import { FolderArchive, Plus } from 'lucide-react';
import { Album } from '../types';
import { albumApi } from '../services/api';
import { AlbumCard } from '../components/AlbumCard';
import { EmptyState } from '../components/EmptyState';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { useToast } from '../context/ToastContext';

interface AlbumsPageProps {
  onSelectAlbum: (album: Album) => void;
  onOpenCreateAlbum: () => void;
  onShareAlbum: (album: Album) => void;
  reloadTrigger: number;
}

export const AlbumsPage: React.FC<AlbumsPageProps> = ({
  onSelectAlbum,
  onOpenCreateAlbum,
  onShareAlbum,
  reloadTrigger
}) => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { success, error } = useToast();

  const loadAlbums = async () => {
    setIsLoading(true);
    try {
      const res = await albumApi.list();
      if (res.success && res.data) {
        setAlbums(res.data);
      }
    } catch {
      error('Failed to load albums.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAlbums();
  }, [reloadTrigger]);

  const handleDeleteAlbum = async (album: Album) => {
    if (!window.confirm(`Delete album "${album.title}"? (Your original photos remain safe)`)) return;
    try {
      await albumApi.delete(album.id);
      success('Album deleted.');
      loadAlbums();
    } catch {
      error('Failed to delete album.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Albums
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {albums.length} {albums.length === 1 ? 'album' : 'albums'} created
          </p>
        </div>

        <button
          onClick={onOpenCreateAlbum}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Album</span>
        </button>
      </div>

      {isLoading ? (
        <SkeletonLoader count={8} />
      ) : albums.length === 0 ? (
        <EmptyState
          icon={FolderArchive}
          title="No albums yet."
          description="Create albums to group your trips, family events, and favorite moments together."
          actionText="Create Album"
          onAction={onOpenCreateAlbum}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {albums.map(album => (
            <AlbumCard
              key={album.id}
              album={album}
              onClick={onSelectAlbum}
              onDelete={handleDeleteAlbum}
              onShare={onShareAlbum}
            />
          ))}
        </div>
      )}
    </div>
  );
};
