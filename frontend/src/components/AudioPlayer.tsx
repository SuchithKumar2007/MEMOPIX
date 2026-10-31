import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Heart,
  Share2,
  Download,
  Trash2,
  RotateCcw,
  RotateCw,
  Repeat,
  Music,
  Disc,
  Info
} from 'lucide-react';
import { MediaItem } from '../types';
import { formatDuration, formatBytes, formatDate } from '../utils/formatters';

interface AudioPlayerProps {
  media: MediaItem | null;
  onClose: () => void;
  onFavorite: (id: string, isFav: boolean) => void;
  onTrash: (id: string) => void;
  onShare: (media: MediaItem) => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  media,
  onClose,
  onFavorite,
  onTrash,
  onShare
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLooping, setIsLooping] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === ' ') {
        e.preventDefault();
        togglePlay();
      }
      if (e.key === 'ArrowRight') {
        seekRelative(10);
      }
      if (e.key === 'ArrowLeft') {
        seekRelative(-10);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, duration, currentTime]);

  if (!media) return null;

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(() => {});
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || media.duration || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const seekRelative = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds));
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
      if (val === 0) setIsMuted(true);
      else if (isMuted) setIsMuted(false);
    }
  };

  const handleSpeedChange = () => {
    const rates = [0.75, 1, 1.25, 1.5, 2];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    const newRate = rates[nextIdx];
    setPlaybackRate(newRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = newRate;
    }
  };

  const toggleLoop = () => {
    setIsLooping(!isLooping);
    if (audioRef.current) {
      audioRef.current.loop = !isLooping;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        src={media.streamUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => {
          if (!isLooping) setIsPlaying(false);
        }}
        autoPlay
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      <div className="relative w-full max-w-xl bg-gradient-to-b from-[#182030] to-[#0D121D] border border-purple-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden animate-scale-up text-white">
        {/* Glow ambient background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Controls */}
        <div className="flex items-center justify-between relative z-10 mb-6">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full text-xs font-bold uppercase tracking-wider">
              MP3 Audio
            </span>
            <span className="text-xs text-gray-400 font-medium">
              5 TB Cloud
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
              title="Track Details"
            >
              <Info className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Central Album Artwork & Visualizer */}
        <div className="flex flex-col items-center justify-center my-6 relative z-10">
          <div className="relative w-44 h-44 sm:w-52 sm:h-52 rounded-full bg-gradient-to-tr from-purple-900 via-indigo-950 to-slate-900 flex items-center justify-center border-4 border-purple-500/30 shadow-2xl">
            {/* Vinyl record grooves */}
            <div className="absolute inset-4 rounded-full border border-white/10" />
            <div className="absolute inset-8 rounded-full border border-white/10" />
            <div className="absolute inset-12 rounded-full border border-white/10" />

            {/* Rotating center art */}
            <div className={`w-20 h-20 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shadow-lg ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '8s' }}>
              <Music className="w-9 h-9 text-white" />
            </div>
          </div>

          {/* Animated Waveform Bars */}
          <div className="flex items-center justify-center gap-1.5 mt-6 h-8">
            {[40, 75, 100, 60, 85, 30, 90, 50, 95, 65, 80, 45, 90, 70, 35].map((h, i) => (
              <div
                key={i}
                className={`w-1 rounded-full bg-purple-400/80 transition-all duration-300 ${isPlaying ? 'animate-pulse' : 'opacity-40'}`}
                style={{
                  height: isPlaying ? `${Math.max(20, (h * (i % 2 === 0 ? 1 : 0.8)) * 0.35)}px` : '6px',
                  animationDelay: `${(i * 0.1)}s`
                }}
              />
            ))}
          </div>

          {/* Track Title */}
          <div className="text-center mt-4 max-w-full px-4">
            <h2 className="text-lg sm:text-xl font-bold text-white truncate">
              {media.originalName}
            </h2>
            <p className="text-xs text-purple-300/80 mt-0.5">
              {formatBytes(media.fileSize)} • Added {formatDate(media.createdAt)}
            </p>
          </div>
        </div>

        {/* Details Drawer if Info Toggled */}
        {showInfo && (
          <div className="bg-black/40 border border-white/10 rounded-2xl p-4 mb-4 text-xs space-y-2 relative z-10 animate-fade-in">
            <div className="flex justify-between text-gray-400">
              <span>File Name:</span>
              <span className="text-white font-mono truncate max-w-[240px]">{media.originalName}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Format:</span>
              <span className="text-white font-mono">{media.mimeType}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>File Size:</span>
              <span className="text-white font-mono">{formatBytes(media.fileSize)}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Storage Quota:</span>
              <span className="text-brand-400 font-semibold">5 TB Dedicated Private Cloud</span>
            </div>
          </div>
        )}

        {/* Progress & Time Controls */}
        <div className="space-y-1.5 relative z-10 mb-4">
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-500 hover:h-2 transition-all"
          />
          <div className="flex justify-between text-xs text-gray-400 font-mono">
            <span>{formatDuration(currentTime)}</span>
            <span>{formatDuration(duration)}</span>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center justify-between relative z-10 mb-6">
          {/* Loop toggle */}
          <button
            onClick={toggleLoop}
            className={`p-2 rounded-full transition-colors ${isLooping ? 'text-brand-400 bg-brand-500/20' : 'text-gray-400 hover:text-white'}`}
            title={isLooping ? 'Looping enabled' : 'Enable loop'}
          >
            <Repeat className="w-4 h-4" />
          </button>

          {/* Skip Back 10s */}
          <button
            onClick={() => seekRelative(-10)}
            className="p-2 text-gray-400 hover:text-white rounded-full transition-colors"
            title="Rewind 10s"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          {/* Main Play / Pause Button */}
          <button
            onClick={togglePlay}
            className="w-14 h-14 rounded-full bg-gradient-to-r from-brand-500 to-purple-600 hover:from-brand-600 hover:to-purple-700 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-purple-500/30 transition-all"
            title="Play / Pause (Space)"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-white" />
            ) : (
              <Play className="w-6 h-6 fill-white translate-x-0.5" />
            )}
          </button>

          {/* Skip Forward 10s */}
          <button
            onClick={() => seekRelative(10)}
            className="p-2 text-gray-400 hover:text-white rounded-full transition-colors"
            title="Forward 10s"
          >
            <RotateCw className="w-5 h-5" />
          </button>

          {/* Playback Speed button */}
          <button
            onClick={handleSpeedChange}
            className="px-2.5 py-1 text-xs font-mono font-bold bg-white/10 hover:bg-white/20 text-gray-300 rounded-lg transition-colors"
            title="Playback Speed"
          >
            {playbackRate}x
          </button>
        </div>

        {/* Bottom Actions Bar (Volume, Favorite, Share, Download, Trash) */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10 relative z-10 text-gray-300">
          {/* Volume Control */}
          <div className="flex items-center gap-2">
            <button onClick={toggleMute} className="hover:text-white transition-colors">
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16 sm:w-24 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-500"
            />
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => onFavorite(media.id, !media.isFavorite)}
              className={`p-2 rounded-full hover:bg-white/10 transition-colors ${
                media.isFavorite ? 'text-rose-500' : 'hover:text-white'
              }`}
              title="Favorite"
            >
              <Heart className={`w-4 h-4 ${media.isFavorite ? 'fill-rose-500' : ''}`} />
            </button>

            <button
              onClick={() => onShare(media)}
              className="p-2 hover:text-white rounded-full hover:bg-white/10 transition-colors"
              title="Share"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <a
              href={media.downloadUrl}
              download={media.originalName}
              className="p-2 hover:text-white rounded-full hover:bg-white/10 transition-colors"
              title="Download MP3"
            >
              <Download className="w-4 h-4" />
            </a>

            <button
              onClick={() => {
                onTrash(media.id);
                onClose();
              }}
              className="p-2 hover:text-rose-400 rounded-full hover:bg-white/10 transition-colors"
              title="Move to Trash"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
