import React from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Shuffle,
  Repeat,
  Repeat1,
  ChevronDown,
  ListMusic,
  X,
  Music,
  Disc3,
  Heart,
  Loader2,
  Trash2
} from 'lucide-react';
import { useMusicPlayer } from '../context/MusicPlayerContext';
import { useToast } from '../context/ToastContext';
import { mediaApi } from '../services/api';
import { formatDuration } from '../utils/formatters';

export const PersistentMiniPlayer: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    isBuffering,
    currentTime,
    duration,
    volume,
    isMuted,
    isShuffle,
    repeatMode,
    isExpanded,
    showQueue,
    queue,
    currentIndex,
    togglePlay,
    nextTrack,
    prevTrack,
    seekTo,
    setVolumeLevel,
    toggleMute,
    toggleShuffle,
    toggleRepeat,
    setIsExpanded,
    setShowQueue,
    playTrack,
    removeFromQueue,
    closePlayer
  } = useMusicPlayer();

  const { success, error } = useToast();

  const handleDeleteCurrentTrack = async () => {
    if (!currentTrack) return;
    const trackTitle = currentTrack.originalName.replace(/\.[^/.]+$/, '');
    if (!window.confirm(`Are you sure you want to delete "${trackTitle}"? It will be moved to Trash.`)) {
      return;
    }
    try {
      await mediaApi.trash(currentTrack.id);
      success(`Moved "${trackTitle}" to Trash.`);
      closePlayer();
    } catch {
      error('Failed to delete audio file.');
    }
  };

  if (!currentTrack) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const cleanTitle = currentTrack.originalName.replace(/\.[^/.]+$/, '');

  return (
    <>
      {/* ── 1. BOTTOM DOCKED MINI-PLAYER BAR ───────────────────────────────── */}
      <div className={`fixed z-40 bg-white/95 dark:bg-[#121824]/95 backdrop-blur-md border-t border-gray-200 dark:border-[#26334D] shadow-lg transition-all duration-300 ${
        isExpanded ? 'opacity-0 pointer-events-none' : 'opacity-100'
      } left-0 right-0 bottom-[56px] md:bottom-0 md:left-64`}>
        {/* Top Slim Progress Bar */}
        <div
          className="h-1 bg-gray-200 dark:bg-gray-800 w-full cursor-pointer relative"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const pct = clickX / rect.width;
            seekTo(pct * duration);
          }}
        >
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 transition-all duration-100"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between px-3 sm:px-6 py-2.5">
          {/* Left: Track Info & Disc (Click expands to fullscreen player) */}
          <div
            className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
            onClick={() => setIsExpanded(true)}
          >
            <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-md ${
              isPlaying ? 'animate-spin-slow' : ''
            }`}>
              <Disc3 className="w-5 h-5 text-white" />
            </div>

            <div className="min-w-0 flex-1">
              <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate">
                {cleanTitle}
              </h4>
              <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">
                MEMOPIX Cloud • 5 TB Library
              </p>
            </div>
          </div>

          {/* Center: Playback Controls */}
          <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
            <button
              onClick={prevTrack}
              className="p-1.5 text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 active:scale-90 transition-all hidden xs:block"
              title="Previous Track"
            >
              <SkipBack className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <button
              onClick={togglePlay}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20 active:scale-95 hover:scale-105 transition-all"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isBuffering ? (
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <Play className="w-4 h-4 sm:w-5 sm:h-5 ml-0.5" />
              )}
            </button>

            <button
              onClick={nextTrack}
              className="p-1.5 text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 active:scale-90 transition-all"
              title="Next Track"
            >
              <SkipForward className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Desktop Volume Slider */}
            <div className="hidden lg:flex items-center gap-2 ml-2 pl-3 border-l border-gray-200 dark:border-gray-800">
              <button onClick={toggleMute} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white">
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={(e) => setVolumeLevel(parseFloat(e.target.value))}
                className="w-20 h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>

            {/* Queue Toggle */}
            <button
              onClick={() => {
                setIsExpanded(true);
                setShowQueue(true);
              }}
              className="p-1.5 text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400 hidden sm:block"
              title="Queue"
            >
              <ListMusic className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Close Button */}
            <button
              onClick={closePlayer}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
              title="Close Player"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. FULLSCREEN EXPANDED VINYL PLAYER ────────────────────────────── */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex flex-col justify-between p-4 sm:p-8 animate-fade-in text-white">
          {/* Header */}
          <div className="flex items-center justify-between max-w-xl w-full mx-auto">
            <button
              onClick={() => setIsExpanded(false)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white"
              title="Minimize Player"
            >
              <ChevronDown className="w-6 h-6" />
            </button>

            <div className="text-center">
              <span className="text-[11px] font-bold tracking-widest uppercase text-purple-400">
                PLAYING FROM 5 TB CLOUD
              </span>
              <p className="text-xs text-gray-400">Private Audio Library</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDeleteCurrentTrack}
                className="p-2 rounded-full bg-white/10 hover:bg-red-500/30 text-white hover:text-red-400 active:scale-95 transition-all"
                title="Delete this song"
              >
                <Trash2 className="w-5 h-5" />
              </button>

              <button
                onClick={() => setShowQueue(!showQueue)}
                className={`p-2 rounded-full transition-all ${
                  showQueue ? 'bg-purple-600 text-white' : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
                title="View Queue"
              >
                <ListMusic className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Main Body: Vinyl Disc / Artwork OR Queue */}
          <div className="flex-1 flex items-center justify-center py-6 max-w-xl w-full mx-auto">
            {showQueue ? (
              <div className="w-full h-80 sm:h-96 bg-white/5 border border-white/10 rounded-3xl p-4 overflow-y-auto">
                <div className="flex items-center justify-between mb-3 px-2">
                  <h3 className="font-bold text-sm text-purple-300">Play Queue ({queue.length})</h3>
                  <span className="text-xs text-gray-400">{currentIndex + 1} of {queue.length}</span>
                </div>
                <div className="space-y-1">
                  {queue.map((track, idx) => (
                    <div
                      key={`${track.id}_${idx}`}
                      onClick={() => playTrack(track, queue)}
                      className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors ${
                        idx === currentIndex
                          ? 'bg-purple-600/30 border border-purple-500/40 text-purple-300 font-bold'
                          : 'hover:bg-white/10 text-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-xs text-gray-500 w-4 text-center">{idx + 1}</span>
                        <div className="min-w-0">
                          <p className="text-xs truncate">{track.originalName.replace(/\.[^/.]+$/, '')}</p>
                          <p className="text-[10px] text-gray-500">{formatDuration(track.duration || 0)}</p>
                        </div>
                      </div>
                      {idx !== currentIndex && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFromQueue(idx);
                          }}
                          className="text-gray-500 hover:text-red-400 p-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                {/* Vinyl Disc with Aura */}
                <div className="relative group">
                  <div className={`w-56 h-56 sm:w-72 sm:h-72 rounded-full bg-gradient-to-tr from-purple-700 via-indigo-900 to-black p-3 shadow-2xl border-4 border-white/10 flex items-center justify-center ${
                    isPlaying ? 'animate-spin-slow' : ''
                  }`}>
                    {/* Concentric vinyl grooves */}
                    <div className="w-full h-full rounded-full border border-white/5 flex items-center justify-center p-6">
                      <div className="w-full h-full rounded-full border border-white/5 flex items-center justify-center p-6">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg border-2 border-white/20">
                          <Music className="w-8 h-8 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pulsing Aura */}
                  <div className={`absolute -inset-4 rounded-full bg-purple-500/20 filter blur-xl -z-10 ${
                    isPlaying ? 'animate-pulse' : ''
                  }`} />
                </div>

                {/* Track Title */}
                <div className="mt-8 text-center max-w-md px-4">
                  <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white line-clamp-1">
                    {cleanTitle}
                  </h2>
                  <p className="text-xs sm:text-sm text-purple-300 mt-1">
                    5 TB Cloud Storage
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Scrubbar & Controls */}
          <div className="max-w-xl w-full mx-auto space-y-4">
            {/* Scrubber */}
            <div className="space-y-1">
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={(e) => seekTo(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <div className="flex justify-between text-[11px] font-mono text-gray-400">
                <span>{formatDuration(currentTime)}</span>
                <span>{formatDuration(duration)}</span>
              </div>
            </div>

            {/* Playback Button Row */}
            <div className="flex items-center justify-between px-4">
              <button
                onClick={toggleShuffle}
                className={`p-2 transition-colors ${
                  isShuffle ? 'text-purple-400' : 'text-gray-400 hover:text-white'
                }`}
                title="Shuffle"
              >
                <Shuffle className="w-5 h-5" />
              </button>

              <button
                onClick={prevTrack}
                className="p-3 text-white hover:text-purple-400 active:scale-90 transition-all"
                title="Previous"
              >
                <SkipBack className="w-7 h-7" />
              </button>

              <button
                onClick={togglePlay}
                className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 text-white flex items-center justify-center shadow-xl shadow-purple-500/40 hover:scale-105 active:scale-95 transition-all"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isBuffering ? (
                  <Loader2 className="w-8 h-8 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-8 h-8" />
                ) : (
                  <Play className="w-8 h-8 ml-1" />
                )}
              </button>

              <button
                onClick={nextTrack}
                className="p-3 text-white hover:text-purple-400 active:scale-90 transition-all"
                title="Next"
              >
                <SkipForward className="w-7 h-7" />
              </button>

              <button
                onClick={toggleRepeat}
                className={`p-2 transition-colors ${
                  repeatMode !== 'none' ? 'text-purple-400' : 'text-gray-400 hover:text-white'
                }`}
                title={`Repeat: ${repeatMode}`}
              >
                {repeatMode === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
              </button>
            </div>

            {/* Volume Control */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <button onClick={toggleMute} className="text-gray-400 hover:text-white">
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={(e) => setVolumeLevel(parseFloat(e.target.value))}
                className="w-32 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
