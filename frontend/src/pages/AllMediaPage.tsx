import React, { useState, useEffect } from 'react';
import { LayoutGrid, Upload, Filter } from 'lucide-react';
import { MediaItem } from '../types';
import { mediaApi } from '../services/api';
import { MediaGrid } from '../components/MediaGrid';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { EmptyState } from '../components/EmptyState';
import { useToast } from '../context/ToastContext';

interface AllMediaPageProps {
  searchQuery: string;
  selectedIds: string[];
  onToggleSelect: (id: string, e: React.MouseEvent) => void;
  onSelectGroup: (ids: string[]) => void;
  onClickMedia: (media: MediaItem, list: MediaItem[]) => void;
  onOpenUpload: () => void;
  onFavorite: (id: string, isFav: boolean) => void;
  reloadTrigger: number;
}

type FilterType = 'all' | 'photos' | 'videos' | 'audio' | 'documents';

export const AllMediaPage: React.FC<AllMediaPageProps> = ({
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
  const [filterType, setFilterType] = useState<FilterType>('all');
  const { error } = useToast();

  const loadAll = async () => {
    setIsLoading(true);
    try {
      const res = await mediaApi.list({
        view: filterType === 'all' ? undefined : filterType,
        search: searchQuery || undefined,
        limit: 500
      });
      if (res.success && res.data) {
        setMedia(res.data.items);
      }
    } catch {
      error('Failed to load media library.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
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
        />
      )}
    </div>
  );
};
