import React from 'react';
import { Check, Calendar } from 'lucide-react';
import { MediaItem } from '../types';
import { MediaCard } from './MediaCard';
import { groupMediaByDate } from '../utils/formatters';

interface MediaGridProps {
  media: MediaItem[];
  selectedIds: string[];
  onToggleSelect: (id: string, e: React.MouseEvent) => void;
  onSelectGroup: (ids: string[]) => void;
  onClickMedia: (media: MediaItem) => void;
  onFavorite?: (id: string, isFav: boolean) => void;
}

export const MediaGrid: React.FC<MediaGridProps> = ({
  media,
  selectedIds,
  onToggleSelect,
  onSelectGroup,
  onClickMedia,
  onFavorite
}) => {
  const groups = groupMediaByDate(media);

  return (
    <div className="space-y-8 pb-24">
      {groups.map(group => {
        const groupMediaIds = group.items.map(i => i.id);
        const allGroupSelected = groupMediaIds.every(id => selectedIds.includes(id));

        return (
          <section key={group.dateKey} className="space-y-3">
            {/* Date Group Header */}
            <div className="flex items-center justify-between sticky top-16 z-20 bg-gray-50/90 dark:bg-[#0B0F17]/90 backdrop-blur-md py-2.5 px-1">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-500" />
                <h2 className="text-base font-bold text-gray-900 dark:text-white tracking-tight">
                  {group.label}
                </h2>
                <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                  • {group.items.length} {group.items.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              {/* Select All in Group Button */}
              <button
                type="button"
                onClick={() => onSelectGroup(groupMediaIds)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  allGroupSelected
                    ? 'bg-brand-500 text-white'
                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-[#1A2234]'
                }`}
              >
                <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                  allGroupSelected ? 'border-white bg-white/20' : 'border-gray-400 dark:border-gray-500'
                }`}>
                  {allGroupSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <span>{allGroupSelected ? 'Selected' : 'Select'}</span>
              </button>
            </div>

            {/* Media Items Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
              {group.items.map(item => (
                <MediaCard
                  key={item.id}
                  media={item}
                  isSelected={selectedIds.includes(item.id)}
                  onToggleSelect={onToggleSelect}
                  onClick={onClickMedia}
                  onFavorite={onFavorite}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
};
