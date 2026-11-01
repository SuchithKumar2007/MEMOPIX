import React, { useState } from 'react';
import { Play, Heart, Check, Trash2, Archive, Share2, Download, Music, Pencil, FileText, Film, Image as ImageIcon } from 'lucide-react';
import { MediaItem } from '../types';
import { formatDuration, formatBytes } from '../utils/formatters';

interface MediaCardProps {
  media: MediaItem;
  isSelected: boolean;
  onToggleSelect: (id: string, e: React.MouseEvent) => void;
  onClick: (media: MediaItem) => void;
  onFavorite?: (id: string, isFav: boolean) => void;
  onArchive?: (id: string) => void;
  onTrash?: (id: string) => void;
  onRename?: (media: MediaItem) => void;
}

export const MediaCard: React.FC<MediaCardProps> = ({
  media,
  isSelected,
  onToggleSelect,
  onClick,
  onFavorite,
  onRename
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const lowerName = (media.originalName || media.fileName || '').toLowerCase();
  const isVideo = (media.mimeType && media.mimeType.startsWith('video/')) ||
    media.category === 'video' ||
    lowerName.endsWith('.mp4') ||
    lowerName.endsWith('.mov') ||
    lowerName.endsWith('.webm') ||
    lowerName.endsWith('.mkv');

  const isAudio = (media.mimeType && media.mimeType.startsWith('audio/')) ||
    media.category === 'audio' ||
    lowerName.endsWith('.mp3') ||
    lowerName.endsWith('.wav') ||
    lowerName.endsWith('.m4a') ||
    lowerName.endsWith('.flac') ||
    lowerName.endsWith('.aac');

  const isDoc = (media.mimeType && (media.mimeType.includes('pdf') || media.mimeType.includes('document') || media.mimeType.includes('text'))) ||
    media.category === 'document' ||
    lowerName.endsWith('.pdf') ||
    lowerName.endsWith('.docx') ||
    lowerName.endsWith('.txt') ||
    lowerName.endsWith('.zip');

  const thumbSource = media.thumbnailUrl || (media.mimeType?.startsWith('image/') ? media.streamUrl : '');

  return (
    <div
      onClick={() => onClick(media)}
      className={`group relative aspect-square rounded-2xl overflow-hidden bg-gray-100 dark:bg-[#1A2234] cursor-pointer select-none transition-all duration-200 border ${
        isSelected
          ? 'border-brand-500 ring-2 ring-brand-500 shadow-glow scale-[0.98]'
          : 'border-gray-200/60 dark:border-[#26334D]/60 hover:border-brand-500/50 hover:shadow-lg'
      }`}
    >
      {/* 1. Audio Track Card */}
      {isAudio ? (
        <div className="w-full h-full bg-gradient-to-br from-indigo-950 via-purple-900 to-[#121824] flex flex-col items-center justify-center p-4 text-center select-none">
          <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center mb-2 shadow-inner group-hover:scale-110 group-hover:bg-purple-500/20 transition-all border border-purple-500/20">
            <Music className="w-7 h-7 text-purple-300 group-hover:text-purple-200" />
          </div>
          <p className="text-xs font-bold text-white truncate max-w-full px-1">
            {media.originalName}
          </p>
          <span className="text-[10px] font-semibold text-purple-300/80 mt-1 uppercase tracking-wider">
            Audio • {formatBytes(media.fileSize)}
          </span>
        </div>
      ) : isDoc ? (
        /* 2. Document Card */
        <div className="w-full h-full bg-gradient-to-br from-slate-900 via-sky-950 to-[#0c1322] flex flex-col items-center justify-center p-4 text-center select-none">
          <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mb-2 shadow-inner group-hover:scale-110 group-hover:bg-sky-500/20 transition-all border border-sky-500/20">
            <FileText className="w-7 h-7 text-sky-300 group-hover:text-sky-200" />
          </div>
          <p className="text-xs font-bold text-white truncate max-w-full px-1">
            {media.originalName}
          </p>
          <span className="text-[10px] font-semibold text-sky-300/80 mt-1 uppercase tracking-wider">
            Document • {formatBytes(media.fileSize)}
          </span>
        </div>
      ) : (
        /* 3. Photos & Videos Thumbnail / Fallback Graphic */
        <div className="w-full h-full relative flex items-center justify-center bg-gradient-to-br from-[#0F172A] via-[#1E1B4B] to-[#0A0E17]">
          {thumbSource && !hasError ? (
            <img
              src={thumbSource}
              alt={media.originalName}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              onError={() => setHasError(true)}
              className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ) : null}

          {/* Elegant Branded Graphic when thumbnail is loading or failed */}
          {(!imageLoaded || hasError) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center bg-gradient-to-br from-[#0F172A] via-[#1E1B4B] to-[#0A0E17]">
              <div className="w-12 h-12 rounded-full bg-brand-500/20 border border-brand-400/30 flex items-center justify-center mb-2 backdrop-blur-sm group-hover:scale-110 transition-transform">
                {isVideo ? (
                  <Play className="w-6 h-6 text-brand-300 fill-brand-300 ml-0.5" />
                ) : (
                  <Film className="w-6 h-6 text-brand-300" />
                )}
              </div>
              <p className="text-xs font-bold text-white truncate max-w-full px-1 drop-shadow">
                {media.originalName}
              </p>
              <span className="text-[10px] font-semibold text-brand-300/80 mt-1 uppercase tracking-wider">
                {isVideo ? 'Video' : 'Media'} • {formatBytes(media.fileSize)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Audio Badge */}
      {isAudio && (
        <div className="absolute bottom-2.5 left-2.5 px-2 py-1 bg-purple-950/80 backdrop-blur-md rounded-lg flex items-center gap-1.5 text-purple-200 text-[11px] font-semibold z-10 border border-purple-500/30 shadow-sm">
          <Music className="w-3 h-3" />
          <span>MP3</span>
        </div>
      )}

      {/* Video Badge */}
      {isVideo && (
        <div className="absolute bottom-2.5 left-2.5 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg flex items-center gap-1.5 text-white text-[11px] font-semibold z-10">
          <Play className="w-3 h-3 fill-white" />
          <span>{formatDuration(media.duration)}</span>
        </div>
      )}

      {/* Favorite Heart Badge */}
      {media.isFavorite && (
        <div className="absolute bottom-2.5 right-2.5 p-1.5 bg-rose-500/90 text-white rounded-lg backdrop-blur-md z-10">
          <Heart className="w-3.5 h-3.5 fill-white" />
        </div>
      )}

      {/* Hover Overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 transition-opacity duration-200 ${
          isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
      />

      {/* Top Controls: Selection Checkbox & Favorite */}
      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-20">
        {/* Selection Checkbox */}
        <button
          type="button"
          onClick={e => {
            e.stopPropagation();
            onToggleSelect(media.id, e);
          }}
          className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
            isSelected
              ? 'bg-brand-500 text-white shadow-md'
              : 'bg-black/40 text-white hover:bg-black/60 opacity-0 group-hover:opacity-100'
          }`}
        >
          <Check className={`w-3.5 h-3.5 stroke-[3] ${isSelected ? 'opacity-100' : 'opacity-75'}`} />
        </button>

        <div className="flex items-center gap-1">
          {/* Quick Rename Button */}
          {onRename && (
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                onRename(media);
              }}
              title="Rename file"
              className="p-1.5 rounded-lg bg-black/40 text-white hover:text-brand-300 opacity-0 group-hover:opacity-100 transition-all"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Favorite Quick Button */}
          {onFavorite && (
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                onFavorite(media.id, !media.isFavorite);
              }}
              className={`p-1.5 rounded-lg transition-all ${
                media.isFavorite
                  ? 'opacity-0' // already shown in bottom badge
                  : 'bg-black/40 text-white hover:text-rose-400 opacity-0 group-hover:opacity-100'
              }`}
            >
              <Heart className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Original Filename Tooltip on hover */}
      <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none truncate text-[11px] text-white/90 font-medium drop-shadow">
        {!isAudio && !isDoc && media.originalName}
      </div>
    </div>
  );
};
