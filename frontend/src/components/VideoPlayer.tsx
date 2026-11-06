import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Heart,
  Share2,
  Download,
  Trash2,
  RotateCcw,
  RotateCw,
  Pencil,
  Check,
  Archive,
  ArchiveRestore,
  Video,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { MediaItem } from '../types';
import { resolveMediaUrl } from '../services/api';
import { downloadMediaFile } from '../utils/download';
import { formatDuration } from '../utils/formatters';

interface VideoPlayerProps {
  media: MediaItem | null;
  onClose: () => void;
  onFavorite: (id: string, isFav: boolean) => void;
  onTrash: (id: string) => void;
  onShare: (media: MediaItem) => void;
  onRename?: (id: string, newName: string) => void;
  onArchive?: (id: string, archive: boolean) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  media,
  onClose,
  onFavorite,
  onTrash,
  onShare,
  onRename,
  onArchive
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [isBuffering, setIsBuffering] = useState(false);
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    setIsRenaming(false);
    setRenameValue('');
    setVideoError(false);
    setIsBuffering(false);
  }, [media?.id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === ' ') {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying]);

  if (!media) return null;

  const togglePlay = async () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        try {
          await videoRef.current.play();
          setIsPlaying(true);
        } catch (err) {
          console.warn('Playback play request failed:', err);
        }
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    if (videoRef.current) {
      videoRef.current.volume = vol;
      setIsMuted(vol === 0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const nextMuted = !isMuted;
      setIsMuted(nextMuted);
      videoRef.current.muted = nextMuted;
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackRate(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col select-none animate-fade-in">
      {/* Top Bar */}
      <div className="h-16 px-3 sm:px-6 flex items-center justify-between z-20 bg-gradient-to-b from-black/85 via-black/50 to-transparent text-white">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 mr-2">
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <div className="min-w-0 flex-1">
            {isRenaming ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={renameValue}
                  onChange={e => setRenameValue(e.target.value)}
                  onBlur={() => {
                    if (renameValue.trim() && onRename && media) {
                      onRename(media.id, renameValue.trim());
                    }
                    setIsRenaming(false);
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      if (renameValue.trim() && onRename && media) {
                        onRename(media.id, renameValue.trim());
                      }
                      setIsRenaming(false);
                    }
                    if (e.key === 'Escape') setIsRenaming(false);
                  }}
                  className="text-xs sm:text-sm font-semibold bg-white/10 text-white rounded-lg px-2 py-0.5 w-36 sm:w-72 outline-none border border-white/40 focus:border-brand-400"
                />
                <button
                  onClick={() => {
                    if (renameValue.trim() && onRename && media) {
                      onRename(media.id, renameValue.trim());
                    }
                    setIsRenaming(false);
                  }}
                  className="p-1 bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-colors flex-shrink-0"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 min-w-0">
                <p className="text-xs sm:text-sm font-semibold truncate max-w-[130px] xs:max-w-[200px] sm:max-w-md">
                  {media.originalName}
                </p>
                {onRename && (
                  <button
                    onClick={() => {
                      setRenameValue(media.originalName);
                      setIsRenaming(true);
                    }}
                    className="p-1 text-brand-300 hover:text-white hover:bg-white/10 rounded-lg transition-all flex-shrink-0"
                    title="Rename video"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {onArchive && (
            <button
              onClick={() => onArchive(media.id, !media.isArchived)}
              title={media.isArchived ? 'Unarchive — Restore to gallery' : 'Archive video'}
              className={`p-2 rounded-xl transition-colors ${
                media.isArchived ? 'text-amber-400 bg-amber-500/20' : 'text-white/80 hover:text-amber-400 hover:bg-white/10'
              }`}
            >
              {media.isArchived ? <ArchiveRestore className="w-5 h-5" /> : <Archive className="w-5 h-5" />}
            </button>
          )}

          <button
            onClick={() => onFavorite(media.id, !media.isFavorite)}
            className={`p-2 rounded-xl transition-colors ${
              media.isFavorite ? 'text-rose-500 bg-rose-500/20' : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <Heart className={`w-5 h-5 ${media.isFavorite ? 'fill-rose-500' : ''}`} />
          </button>

          <button
            onClick={() => onShare(media)}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            <Share2 className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => downloadMediaFile(media)}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer active:scale-95"
            title="Download video"
          >
            <Download className="w-5 h-5" />
          </button>

          <button
            onClick={() => onTrash(media.id)}
            className="p-2 text-white/80 hover:text-rose-400 hover:bg-rose-500/20 rounded-xl transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Video Element */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden px-4">
        {/* Buffering Indicator */}
        {isBuffering && (
          <div className="absolute z-20 flex flex-col items-center gap-2 bg-black/70 backdrop-blur-md px-5 py-3.5 rounded-2xl border border-white/10 shadow-2xl">
            <div className="w-7 h-7 rounded-full border-2 border-brand-400 border-t-transparent animate-spin" />
            <span className="text-xs font-semibold text-white/90">Connecting stream...</span>
          </div>
        )}

        {/* Video Error / Offline Fallback Banner */}
        {videoError && (
          <div className="absolute z-30 flex flex-col items-center gap-3 bg-[#111827]/95 border border-brand-500/30 p-6 rounded-3xl max-w-sm text-center shadow-2xl backdrop-blur-xl">
            <div className="w-14 h-14 rounded-2xl bg-brand-500/20 text-brand-400 flex items-center justify-center shadow-inner border border-brand-500/30">
              <Video className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Stream Connecting</h3>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                Cloud media storage is waking up or buffering from cold standby. Tap retry or download directly.
              </p>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <button
                type="button"
                onClick={() => {
                  setVideoError(false);
                  setIsBuffering(true);
                  if (videoRef.current) {
                    videoRef.current.load();
                    videoRef.current.play().then(() => {
                      setIsPlaying(true);
                      setIsBuffering(false);
                    }).catch(() => {
                      setIsBuffering(false);
                    });
                  }
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-xl transition-all shadow-md active:scale-95"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Stream</span>
              </button>
              <button
                type="button"
                onClick={() => downloadMediaFile(media)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-all border border-white/10 cursor-pointer active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>
            </div>
          </div>
        )}

        <video
          ref={videoRef}
          src={resolveMediaUrl(media.streamUrl)}
          crossOrigin="anonymous"
          preload="metadata"
          playsInline
          onWaiting={() => setIsBuffering(true)}
          onPlaying={() => {
            setIsBuffering(false);
            setIsPlaying(true);
          }}
          onCanPlay={() => setIsBuffering(false)}
          onError={() => {
            setIsBuffering(false);
            setVideoError(true);
          }}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
          onClick={togglePlay}
          className="max-h-[75vh] max-w-full rounded-2xl shadow-2xl cursor-pointer"
        />
      </div>

      {/* Custom Bottom Controls Bar */}
      <div className="p-4 bg-gradient-to-t from-black/90 to-transparent z-20 space-y-2 max-w-4xl mx-auto w-full text-white">
        {/* Seek Progress Bar */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-white/80 min-w-[40px]">
            {formatDuration(currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="flex-1 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-brand-500 focus:outline-none"
          />
          <span className="text-xs font-mono text-white/80 min-w-[40px]">
            {formatDuration(duration)}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="p-2 bg-brand-500 hover:bg-brand-600 active:scale-95 text-white rounded-xl transition-all"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-white" />}
            </button>

            {/* Volume */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMute}
                className="p-1.5 text-white/80 hover:text-white rounded-lg"
              >
                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Speed Options */}
            <div className="flex items-center gap-1 bg-white/10 rounded-xl p-1 text-xs font-semibold">
              {[0.5, 1, 1.5, 2].map(speed => (
                <button
                  key={speed}
                  onClick={() => handleSpeedChange(speed)}
                  className={`px-2 py-0.5 rounded-lg transition-colors ${
                    playbackRate === speed ? 'bg-brand-500 text-white' : 'text-white/70 hover:text-white'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>

            <button
              onClick={handleFullscreen}
              title="Fullscreen"
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            >
              <Maximize className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
