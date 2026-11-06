import React, { useState, useEffect } from 'react';
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
  Loader2,
  Trash2,
  FileText
} from 'lucide-react';
import { useMusicPlayer } from '../context/MusicPlayerContext';
import { useToast } from '../context/ToastContext';
import { mediaApi } from '../services/api';
import { formatDuration } from '../utils/formatters';
export const PersistentMiniPlayer: React.FC = () => {
  const [showLyrics, setShowLyrics] = useState(false);
  const [lyricsText, setLyricsText] = useState<string | null>(null);
  const [lyricsSource, setLyricsSource] = useState<'id3' | 'lrc' | 'txt' | null>(null);
  const [lyricsLoading, setLyricsLoading] = useState(false);
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
    playbackError,
    clearPlaybackError,
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

  // Auto-fetch lyrics whenever the lyrics sheet is opened or the track changes
  useEffect(() => {
    if (!showLyrics || !currentTrack) return;
    let cancelled = false;
    setLyricsLoading(true);
    setLyricsText(null);
    setLyricsSource(null);
    mediaApi.getLyrics(currentTrack.id)
      .then(result => {
        if (!cancelled) {
          setLyricsText(result.lyrics);
          setLyricsSource(result.source);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLyricsText(null);
          setLyricsSource(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLyricsLoading(false);
      });
    return () => { cancelled = true; };
  }, [showLyrics, currentTrack?.id]);

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
        {/* Playback Error Banner */}
        {playbackError && (
          <div className="bg-amber-950/90 border-b border-amber-800/80 px-4 py-1.5 flex items-center justify-between text-xs text-amber-200 font-medium">
            <span className="truncate">{playbackError}</span>
            <button
              onClick={clearPlaybackError}
              className="text-amber-400 hover:text-white font-bold text-[11px] ml-2 px-2 py-0.5 rounded bg-white/10"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Top Interactive Progress Scrub Bar */}
        <div
          className="h-1.5 hover:h-2.5 bg-gray-200 dark:bg-gray-800 w-full cursor-pointer relative group transition-all"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const pct = Math.max(0, Math.min(1, clickX / rect.width));
            seekTo(pct * (duration || 1));
          }}
          title="Click to seek"
        >
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 transition-all duration-100 relative"
            style={{ width: `${progressPercent}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md scale-0 group-hover:scale-100 transition-transform -mr-1.5" />
          </div>
        </div>

        <div className="flex items-center justify-between px-3 sm:px-6 py-2">
          {/* Left: Track Info & Disc (Click expands to fullscreen player) */}
          <div
            className="flex items-center gap-3 min-w-0 cursor-pointer flex-1 max-w-[200px] sm:max-w-[260px]"
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
              <p className="text-[10px] sm:text-xs text-purple-600 dark:text-purple-400 font-mono truncate font-medium">
                {formatDuration(currentTime)} / {formatDuration(duration)}
              </p>
            </div>
          </div>

          {/* Middle: Timeline Scrubber with Timestamps (Tablet & Desktop) */}
          <div className="hidden md:flex items-center gap-2.5 flex-1 max-w-sm lg:max-w-md mx-4">
            <span className="text-[11px] font-mono text-gray-500 dark:text-gray-400 min-w-[36px] text-right">
              {formatDuration(currentTime)}
            </span>
            <div
              className="flex-1 h-1.5 hover:h-2.5 bg-gray-200 dark:bg-gray-800 rounded-full cursor-pointer relative group flex items-center transition-all"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const pct = Math.max(0, Math.min(1, clickX / rect.width));
                seekTo(pct * (duration || 1));
              }}
            >
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full relative"
                style={{ width: `${progressPercent}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md scale-0 group-hover:scale-100 transition-transform -mr-1" />
              </div>
            </div>
            <span className="text-[11px] font-mono text-gray-500 dark:text-gray-400 min-w-[36px]">
              {formatDuration(duration)}
            </span>
          </div>

          {/* Right: Playback Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
            {/* Previous Track button — 100% visible on mobile & desktop */}
            <button
              onClick={prevTrack}
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 active:scale-90 transition-all flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
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

            {/* Next Track button */}
            <button
              onClick={nextTrack}
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 active:scale-90 transition-all flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              title="Next Track"
            >
              <SkipForward className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Desktop Volume Slider */}
            <div className="hidden lg:flex items-center gap-2 ml-1 pl-2.5 border-l border-gray-200 dark:border-gray-800">
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
                className="w-16 h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
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
        <div className="fixed inset-0 z-50 bg-gradient-to-b from-[#0a0010] via-[#1a0530] to-black flex flex-col justify-between p-4 sm:p-8 animate-fade-in text-white overflow-hidden">
          {/* Atmospheric background blobs */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-purple-900/30 blur-3xl pointer-events-none" />
          <div className="absolute bottom-1/3 left-1/4 w-64 h-64 rounded-full bg-indigo-900/20 blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between max-w-xl w-full mx-auto relative z-10">
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
                onClick={() => { setShowLyrics(!showLyrics); setShowQueue(false); }}
                className={`p-2 rounded-full transition-all ${
                  showLyrics ? 'bg-purple-600 text-white' : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
                title="Lyrics"
              >
                <FileText className="w-5 h-5" />
              </button>

              <button
                onClick={() => { setShowQueue(!showQueue); setShowLyrics(false); }}
                className={`p-2 rounded-full transition-all ${
                  showQueue ? 'bg-purple-600 text-white' : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
                title="View Queue"
              >
                <ListMusic className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Main Body: Vinyl Disc / Artwork OR Queue OR Lyrics */}
          <div className="flex-1 flex items-center justify-center py-4 max-w-xl w-full mx-auto relative z-10">
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
            ) : showLyrics ? (
              /* ── LYRICS SHEET ── */
              <div className="w-full h-80 sm:h-96 flex flex-col items-center">
                <div className="w-full flex-1 bg-white/5 border border-purple-500/20 rounded-3xl p-6 overflow-y-auto flex flex-col items-center shadow-[0_0_40px_rgba(139,92,246,0.15)]">
                  <Music className="w-10 h-10 text-purple-400/60 mb-4" />
                  <h3 className="text-base font-bold text-white mb-1 text-center">{cleanTitle}</h3>
                  <p className="text-xs text-purple-400 mb-6 text-center">5 TB Cloud · Private Audio Library</p>
                  <p className="text-purple-300/50 italic text-xs tracking-widest uppercase mb-4">♪ Lyrics</p>

                  {lyricsLoading ? (
                    <div className="flex flex-col items-center gap-3 mt-4">
                      <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                      <p className="text-gray-400 text-xs">Detecting lyrics...</p>
                    </div>
                  ) : lyricsText ? (
                    <div className="w-full text-center">
                      {lyricsSource && (
                        <span className="inline-block text-[10px] font-bold tracking-widest uppercase text-purple-500 bg-purple-500/10 border border-purple-500/20 rounded-full px-3 py-0.5 mb-4">
                          {lyricsSource === 'id3' ? '🎵 Embedded ID3 Tag' : lyricsSource === 'lrc' ? '📄 .lrc File' : '📄 .txt File'}
                        </span>
                      )}
                      <pre className="text-gray-200 text-sm leading-7 whitespace-pre-wrap font-sans text-center">
                        {lyricsText}
                      </pre>
                    </div>
                  ) : (
                    <div className="text-center space-y-3 mt-2">
                      <p className="text-gray-500 text-sm">No lyrics found for this track.</p>
                      <p className="text-gray-600 text-xs">Embed lyrics in the MP3 ID3 tag, or upload a<br /><span className="text-purple-400 font-mono">.lrc</span> / <span className="text-purple-400 font-mono">.txt</span> file with the same filename.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* ── VINYL DISC ── */
              <div className="flex flex-col items-center">
                {/* Vinyl Disc with enhanced aura */}
                <div className="relative group">
                  {/* Outer ambient glow layers */}
                  <div className={`absolute -inset-12 rounded-full bg-purple-900/25 blur-3xl -z-10 ${isPlaying ? 'animate-pulse' : ''}`} />
                  <div className={`absolute -inset-6 rounded-full bg-purple-600/20 blur-2xl -z-10 ${isPlaying ? 'animate-pulse' : ''}`} />

                  {/* Main vinyl disc */}
                  <div className={`w-64 h-64 sm:w-80 sm:h-80 rounded-full bg-gradient-to-br from-[#1a0a2e] via-[#2d1050] to-[#0d0318] shadow-2xl border border-purple-800/30 flex items-center justify-center ${
                    isPlaying ? 'animate-spin-slow' : ''
                  }`}>
                    {/* Groove ring 1 — outermost */}
                    <div className="w-[90%] h-[90%] rounded-full border border-purple-700/25 flex items-center justify-center">
                      {/* Groove ring 2 */}
                      <div className="w-[88%] h-[88%] rounded-full border border-purple-600/20 flex items-center justify-center">
                        {/* Groove ring 3 */}
                        <div className="w-[86%] h-[86%] rounded-full border border-purple-500/18 flex items-center justify-center">
                          {/* Groove ring 4 */}
                          <div className="w-[84%] h-[84%] rounded-full border border-purple-400/15 flex items-center justify-center">
                            {/* Groove ring 5 */}
                            <div className="w-[82%] h-[82%] rounded-full border border-indigo-500/12 flex items-center justify-center">
                              {/* Center label circle */}
                              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-purple-400 via-purple-600 to-indigo-700 flex items-center justify-center shadow-[0_0_40px_rgba(139,92,246,0.8)] border-2 border-purple-300/30">
                                <Music className="w-10 h-10 sm:w-12 sm:h-12 text-white drop-shadow-lg" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Track Title */}
                <div className="mt-8 text-center max-w-md px-4">
                  <h2 className="text-lg sm:text-2xl font-bold tracking-tight text-white line-clamp-1">
                    {cleanTitle}
                  </h2>
                  <p className="text-xs sm:text-sm text-purple-400 mt-1 font-medium tracking-wide">
                    5 TB Cloud · Private Audio Library
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
