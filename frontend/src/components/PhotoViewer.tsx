import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Heart,
  Share2,
  Download,
  Trash2,
  Info,
  Calendar,
  HardDrive,
  Maximize2,
  Play,
  Pause,
  Pencil,
  Check,
  Archive,
  ArchiveRestore
} from 'lucide-react';
import { MediaItem } from '../types';
import { resolveMediaUrl } from '../services/api';
import { formatBytes } from '../utils/formatters';
import { format, parseISO } from 'date-fns';

interface PhotoViewerProps {
  media: MediaItem | null;
  mediaList: MediaItem[];
  onClose: () => void;
  onNavigate: (media: MediaItem) => void;
  onFavorite: (id: string, isFav: boolean) => void;
  onTrash: (id: string) => void;
  onShare: (media: MediaItem) => void;
  onRename?: (id: string, newName: string) => void;
  onArchive?: (id: string, archive: boolean) => void;
}

export const PhotoViewer: React.FC<PhotoViewerProps> = ({
  media,
  mediaList,
  onClose,
  onNavigate,
  onFavorite,
  onTrash,
  onShare,
  onRename,
  onArchive
}) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [showInfo, setShowInfo] = useState(false);
  const [isSlideshow, setIsSlideshow] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Touch swipe tracking
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    // Reset transform when media changes
    setZoom(1);
    setRotation(0);
    setIsRenaming(false);
    setRenameValue('');
    setImageError(false);
    setImageLoading(true);
  }, [media?.id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!media) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [media, mediaList]);

  // Slideshow timer
  useEffect(() => {
    if (!isSlideshow || !media) return;

    const timer = setInterval(() => {
      const idx = mediaList.findIndex(m => m.id === media.id);
      if (idx !== -1 && idx < mediaList.length - 1) {
        onNavigate(mediaList[idx + 1]);
      } else if (mediaList.length > 0) {
        onNavigate(mediaList[0]);
      }
    }, 3500);

    return () => clearInterval(timer);
  }, [isSlideshow, media, mediaList, onNavigate]);

  if (!media) return null;

  const currentIndex = mediaList.findIndex(m => m.id === media.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < mediaList.length - 1 && currentIndex !== -1;

  const handlePrev = () => {
    if (hasPrev) onNavigate(mediaList[currentIndex - 1]);
  };

  const handleNext = () => {
    if (hasNext) onNavigate(mediaList[currentIndex + 1]);
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  const handleRenameStart = () => {
    setRenameValue(media.originalName);
    setIsRenaming(true);
  };

  const handleRenameCommit = () => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== media.originalName && onRename) {
      onRename(media.id, trimmed);
    }
    setIsRenaming(false);
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleRenameCommit();
    if (e.key === 'Escape') setIsRenaming(false);
  };

  // Mobile Touch Swipe Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;

    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    // Horizontal swipe threshold: 50px (and horizontal movement greater than vertical)
    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) && zoom === 1) {
      if (deltaX < 0) {
        handleNext(); // Swiped left -> next photo
      } else {
        handlePrev(); // Swiped right -> prev photo
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  const handleDoubleTap = () => {
    setZoom(prev => (prev === 1 ? 2 : 1));
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex flex-col select-none animate-fade-in"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Controls Bar */}
      <div className="h-16 px-4 flex items-center justify-between z-20 bg-gradient-to-b from-black/80 to-transparent">
        {/* Left: Close & Filename */}
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="text-white">
            {isRenaming ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={renameValue}
                  onChange={e => setRenameValue(e.target.value)}
                  onBlur={handleRenameCommit}
                  onKeyDown={handleRenameKeyDown}
                  className="text-sm font-semibold bg-white/10 text-white rounded-lg px-2 py-0.5 w-48 sm:w-72 outline-none border border-white/40 focus:border-brand-400"
                />
                <button onClick={handleRenameCommit} className="p-1 bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-colors" title="Save rename">
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setIsRenaming(false)} className="p-1 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors" title="Cancel">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 group/rename">
                <p className="text-sm font-semibold truncate max-w-xs sm:max-w-md">
                  {media.originalName}
                </p>
                {onRename && (
                  <button
                    onClick={handleRenameStart}
                    className="p-1 text-brand-300 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                    title="Rename file"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
            <p className="text-xs text-white/60">
              {format(parseISO(media.createdAt), 'MMMM d, yyyy • h:mm a')}
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Slideshow button */}
          <button
            onClick={() => setIsSlideshow(prev => !prev)}
            title={isSlideshow ? 'Pause Slideshow' : 'Start Slideshow'}
            className={`p-2 rounded-xl transition-colors ${
              isSlideshow ? 'text-purple-400 bg-purple-500/20' : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            {isSlideshow ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>

          <button
            onClick={handleZoomOut}
            title="Zoom Out"
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors hidden sm:flex"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <button
            onClick={handleZoomIn}
            title="Zoom In"
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors hidden sm:flex"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <button
            onClick={handleRotate}
            title="Rotate"
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors hidden sm:flex"
          >
            <RotateCw className="w-5 h-5" />
          </button>

          <button
            onClick={() => onFavorite(media.id, !media.isFavorite)}
            title="Favorite"
            className={`p-2 rounded-xl transition-colors ${
              media.isFavorite ? 'text-rose-500 bg-rose-500/20' : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <Heart className={`w-5 h-5 ${media.isFavorite ? 'fill-rose-500' : ''}`} />
          </button>

          <button
            onClick={() => onShare(media)}
            title="Share"
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            <Share2 className="w-5 h-5" />
          </button>

          <a
            href={media.downloadUrl}
            download={media.originalName}
            title="Download"
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            <Download className="w-5 h-5" />
          </a>

          <button
            onClick={() => setShowInfo(prev => !prev)}
            title="Information"
            className={`p-2 rounded-xl transition-colors ${
              showInfo ? 'text-brand-400 bg-brand-500/20' : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <Info className="w-5 h-5" />
          </button>

          {onArchive && (
            <button
              onClick={() => onArchive(media.id, !media.isArchived)}
              title={media.isArchived ? 'Unarchive — Restore to gallery' : 'Archive memory'}
              className={`p-2 rounded-xl transition-colors ${
                media.isArchived ? 'text-amber-400 bg-amber-500/20' : 'text-white/80 hover:text-amber-400 hover:bg-white/10'
              }`}
            >
              {media.isArchived ? <ArchiveRestore className="w-5 h-5" /> : <Archive className="w-5 h-5" />}
            </button>
          )}

          <button
            onClick={() => onTrash(media.id)}
            title="Move to Trash"
            className="p-2 text-white/80 hover:text-rose-400 hover:bg-rose-500/20 rounded-xl transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Container & Info Drawer */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {/* Previous Button */}
        {hasPrev && (
          <button
            onClick={handlePrev}
            className="absolute left-4 z-20 p-3 bg-black/40 hover:bg-black/80 text-white rounded-2xl backdrop-blur-md transition-all active:scale-95 hidden sm:block"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Photo Canvas */}
        <div
          className="w-full h-full flex items-center justify-center p-2 sm:p-4 transition-transform duration-200 cursor-zoom-in relative"
          onDoubleClick={handleDoubleTap}
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg)`
          }}
        >
          {imageLoading && !imageError && (
            <div className="absolute z-10 flex flex-col items-center gap-2 bg-black/60 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10">
              <div className="w-6 h-6 rounded-full border-2 border-brand-400 border-t-transparent animate-spin" />
              <span className="text-xs font-semibold text-white/90">Loading photo...</span>
            </div>
          )}

          {imageError && (
            <div className="absolute z-20 flex flex-col items-center gap-3 bg-[#111827]/95 border border-brand-500/30 p-6 rounded-3xl max-w-sm text-center shadow-2xl backdrop-blur-xl">
              <div className="w-12 h-12 rounded-2xl bg-brand-500/20 text-brand-400 flex items-center justify-center shadow-inner">
                <HardDrive className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Cloud Storage Standby</h3>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                  Image stream is connecting or waking up from cold standby.
                </p>
              </div>
              <a
                href={resolveMediaUrl(media.downloadUrl)}
                download={media.originalName}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-xl transition-all shadow-md"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Photo</span>
              </a>
            </div>
          )}

          <img
            src={resolveMediaUrl(media.streamUrl)}
            alt={media.originalName}
            onLoad={() => setImageLoading(false)}
            onError={() => {
              setImageLoading(false);
              setImageError(true);
            }}
            className={`max-h-[82vh] max-w-[92vw] sm:max-w-[88vw] object-contain rounded-lg shadow-2xl transition-all ${
              imageLoading || imageError ? 'opacity-0' : 'opacity-100'
            }`}
          />
        </div>

        {/* Next Button */}
        {hasNext && (
          <button
            onClick={handleNext}
            className="absolute right-4 z-20 p-3 bg-black/40 hover:bg-black/80 text-white rounded-2xl backdrop-blur-md transition-all active:scale-95 hidden sm:block"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        {/* Side Info Drawer */}
        {showInfo && (
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-gray-900/95 backdrop-blur-md border-l border-white/10 p-6 text-white z-30 overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Info className="w-4 h-4 text-brand-400" />
                Memory Info
              </h3>
              <button
                onClick={() => setShowInfo(false)}
                className="text-white/60 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <p className="text-xs text-white/50 mb-1">Original Name</p>
                <p className="font-semibold break-words">{media.originalName}</p>
              </div>

              <div>
                <p className="text-xs text-white/50 mb-1">Date Created</p>
                <p className="font-medium">
                  {format(parseISO(media.createdAt), 'EEEE, MMMM d, yyyy')}
                </p>
                <p className="text-xs text-white/60">
                  {format(parseISO(media.createdAt), 'h:mm:ss a')}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/10">
                <div>
                  <p className="text-xs text-white/50 mb-1">File Size</p>
                  <p className="font-semibold">{formatBytes(media.fileSize)}</p>
                </div>
                <div>
                  <p className="text-xs text-white/50 mb-1">Resolution</p>
                  <p className="font-semibold">
                    {media.width && media.height ? `${media.width} × ${media.height}` : 'Standard'}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-white/10">
                <p className="text-xs text-white/50 mb-1">MIME Type</p>
                <span className="inline-block px-2.5 py-1 bg-white/10 rounded-lg text-xs font-mono">
                  {media.mimeType}
                </span>
              </div>

              <div className="pt-2 border-t border-white/10">
                <p className="text-xs text-white/50 mb-1">Privacy & Storage</p>
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-medium mt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Encrypted 5 TB Cloud Storage
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
