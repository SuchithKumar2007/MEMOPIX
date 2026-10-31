import React from 'react';
import { FolderArchive, MoreVertical, Trash2, Edit2, Share2 } from 'lucide-react';
import { Album } from '../types';

interface AlbumCardProps {
  album: Album;
  onClick: (album: Album) => void;
  onDelete?: (album: Album) => void;
  onShare?: (album: Album) => void;
}

export const AlbumCard: React.FC<AlbumCardProps> = ({
  album,
  onClick,
  onDelete,
  onShare
}) => {
  return (
    <div
      onClick={() => onClick(album)}
      className="group bg-white dark:bg-[#121824] border border-gray-200 dark:border-[#26334D] hover:border-brand-500/50 rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
    >
      {/* Cover Image */}
      <div className="aspect-video w-full bg-gray-100 dark:bg-[#1A2234] relative overflow-hidden flex items-center justify-center">
        {album.coverMedia ? (
          <img
            src={album.coverMedia.thumbnailUrl || album.coverMedia.streamUrl}
            alt={album.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-400 dark:text-gray-500">
            <FolderArchive className="w-10 h-10 stroke-[1.5]" />
            <span className="text-[11px] font-medium">Empty Album</span>
          </div>
        )}

        {/* Quick Action Badges */}
        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onShare && (
            <button
              onClick={e => {
                e.stopPropagation();
                onShare(album);
              }}
              className="p-1.5 bg-black/60 hover:bg-black text-white rounded-lg backdrop-blur-md transition-colors"
              title="Share Album"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={e => {
                e.stopPropagation();
                onDelete(album);
              }}
              className="p-1.5 bg-rose-600/80 hover:bg-rose-600 text-white rounded-lg backdrop-blur-md transition-colors"
              title="Delete Album"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Album Info */}
      <div className="p-4 flex flex-col justify-between flex-1">
        <div>
          <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate group-hover:text-brand-500 transition-colors">
            {album.title}
          </h4>
          {album.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
              {album.description}
            </p>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 font-medium">
          <span>{album.itemCount} {album.itemCount === 1 ? 'item' : 'items'}</span>
          <span>Collection</span>
        </div>
      </div>
    </div>
  );
};
