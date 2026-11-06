import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  FileText,
  Headphones,
  Sparkles
} from 'lucide-react';
import { useMusicPlayer } from '../context/MusicPlayerContext';
import { useToast } from '../context/ToastContext';
import { mediaApi } from '../services/api';
import { formatDuration } from '../utils/formatters';

interface SyncedLyricLine {
  time: number;
  text: string;
}

function parseLrcLyrics(lrc: string): SyncedLyricLine[] {
  const lines = lrc.split('\n');
  const result: SyncedLyricLine[] = [];
  const timeRegex = /\[(\d{1,2}):(\d{2})(?:\.(\d+))?\]/g;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const matches = [...trimmed.matchAll(timeRegex)];
    if (matches.length > 0) {
      const text = trimmed.replace(timeRegex, '').trim();
      for (const m of matches) {
        const min = parseInt(m[1], 10);
        const sec = parseInt(m[2], 10);
        const msStr = m[3] || '0';
        const ms = parseFloat('0.' + msStr);
        const total = min * 60 + sec + ms;
        result.push({ time: total, text: text || '♪ ♪ ♪' });
      }
    }
  }

  result.sort((a, b) => a.time - b.time);
  return result;
}

export const PersistentMiniPlayer: React.FC = () => {
  const [showLyrics, setShowLyrics] = useState(false);
  const [lyricsText, setLyricsText] = useState<string | null>(null);
  const [syncedLines, setSyncedLines] = useState<SyncedLyricLine[]>([]);
  const [isInstrumental, setIsInstrumental] = useState(false);
  const [matchedArtist, setMatchedArtist] = useState<string | null>(null);
  const [lyricsSource, setLyricsSource] = useState<'id3' | 'lrc' | 'txt' | 'lrclib' | null>(null);
  const [lyricsLoading, setLyricsLoading] = useState(false);

  const lyricsContainerRef = useRef<HTMLDivElement | null>(null);
  const activeLineRef = useRef<HTMLDivElement | null>(null);
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

  // Auto-fetch synchronized lyrics whenever the lyrics sheet is opened or the track changes
  useEffect(() => {
    if (!showLyrics || !currentTrack) return;
    let cancelled = false;
    setLyricsLoading(true);
    setLyricsText(null);
    setSyncedLines([]);
    setIsInstrumental(false);
    setLyricsSource(null);
    setMatchedArtist(null);

    mediaApi.getLyrics(currentTrack.id, currentTrack.originalName)
      .then(result => {
        if (!cancelled) {
          setIsInstrumental(!!result.isInstrumental);
          setLyricsSource(result.source);
          setMatchedArtist(result.artistName || null);

          if (result.syncedLyrics) {
            const parsed = parseLrcLyrics(result.syncedLyrics);
            setSyncedLines(parsed);
            setLyricsText(result.syncedLyrics);
          } else if (result.lyrics) {
            const parsed = parseLrcLyrics(result.lyrics);
            if (parsed.length > 0) {
              setSyncedLines(parsed);
            }
            setLyricsText(result.lyrics);
          } else {
            setLyricsText(null);
            setSyncedLines([]);
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLyricsText(null);
          setSyncedLines([]);
          setIsInstrumental(false);
          setLyricsSource(null);
          setMatchedArtist(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLyricsLoading(false);
      });
    return () => { cancelled = true; };
  }, [showLyrics, currentTrack?.id, currentTrack?.originalName]);

  // Compute active lyric line based on current audio playback time
  const activeLineIndex = useMemo(() => {
    if (syncedLines.length === 0) return -1;
    let active = -1;
    for (let i = 0; i < syncedLines.length; i++) {
      // 200ms anticipation leads the visual highlight smoothly as singing begins
      if (currentTime >= syncedLines[i].time - 0.2) {
        active = i;
      } else {
        break;
      }
    }
    return active;
  }, [currentTime, syncedLines]);

  // Smooth auto-scroll following the highlighted line as song plays
  useEffect(() => {
    if (activeLineIndex >= 0 && activeLineRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [activeLineIndex]);

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

          {/* Header with Mode Switcher */}
          <div className="flex items-center justify-between max-w-xl w-full mx-auto relative z-10">
            <button
              onClick={() => setIsExpanded(false)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white"
              title="Minimize Player"
            >
              <ChevronDown className="w-6 h-6" />
            </button>

            {/* Innovative 3-Way Mode Pill Switcher */}
            <div className="flex items-center bg-white/10 p-1 rounded-full border border-white/15 backdrop-blur-md shadow-inner">
              <button
                onClick={() => { setShowLyrics(false); setShowQueue(false); }}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                  !showLyrics && !showQueue
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/30'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Disc3 className="w-3.5 h-3.5" />
                <span>Disc</span>
              </button>

              <button
                onClick={() => { setShowLyrics(true); setShowQueue(false); }}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                  showLyrics
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/30'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Lyrics</span>
              </button>

              <button
                onClick={() => { setShowQueue(true); setShowLyrics(false); }}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                  showQueue
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/30'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <ListMusic className="w-3.5 h-3.5" />
                <span>Queue</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDeleteCurrentTrack}
                className="p-2 rounded-full bg-white/10 hover:bg-red-500/30 text-white hover:text-red-400 active:scale-95 transition-all"
                title="Delete this song"
              >
                <Trash2 className="w-5 h-5" />
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
              /* ── SYNCHRONIZED TIME-FLOW LYRICS SHEET ── */
              <div className="w-full h-80 sm:h-96 flex flex-col items-center">
                <div
                  ref={lyricsContainerRef}
                  className="w-full flex-1 bg-black/40 backdrop-blur-md border border-purple-500/20 rounded-3xl p-4 sm:p-6 overflow-y-auto relative shadow-[0_0_50px_rgba(139,92,246,0.18)] scroll-smooth"
                >
                  {/* Floating Header Info */}
                  <div className="sticky top-0 z-20 bg-gradient-to-b from-[#0a0010] via-[#0a0010]/95 to-transparent pb-3 pt-1 -mt-2 -mx-2 px-2 flex flex-col items-center border-b border-purple-500/10 mb-4 backdrop-blur-sm">
                    <h3 className="text-sm sm:text-base font-bold text-white truncate max-w-full text-center">
                      {cleanTitle}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      {isInstrumental ? (
                        <span className="text-[10px] font-bold tracking-widest uppercase text-amber-300 bg-amber-500/15 border border-amber-500/30 rounded-full px-2.5 py-0.5">
                          🎹 Instrumental / Pure Music
                        </span>
                      ) : syncedLines.length > 0 ? (
                        <span className="text-[10px] font-bold tracking-widest uppercase text-purple-300 bg-purple-500/15 border border-purple-500/30 rounded-full px-2.5 py-0.5 flex items-center gap-1 shadow-sm shadow-purple-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block mr-0.5" />
                          Live Synced Lyrics
                        </span>
                      ) : lyricsText ? (
                        <span className="text-[10px] font-bold tracking-widest uppercase text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-2.5 py-0.5">
                          📄 Lyrics Sheet
                        </span>
                      ) : null}
                      {matchedArtist && (
                        <span className="text-[10px] text-gray-400 truncate max-w-[150px]">
                          by {matchedArtist}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  {lyricsLoading ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                      <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                      <p className="text-gray-300 text-xs font-medium tracking-wide">Syncing lyrics with song...</p>
                    </div>
                  ) : isInstrumental ? (
                    /* ── INSTRUMENTAL / BACKGROUND SCORE VIEW ── */
                    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                      <div className="w-16 h-16 rounded-full bg-purple-500/15 border border-purple-500/30 flex items-center justify-center mb-4 shadow-[0_0_24px_rgba(168,85,247,0.3)]">
                        <Headphones className="w-8 h-8 text-purple-300" />
                      </div>
                      <h4 className="text-base sm:text-lg font-bold text-white mb-2">
                        Instrumental & Background Score
                      </h4>
                      <p className="text-xs text-purple-300/80 max-w-sm leading-relaxed">
                        This piece is a musical composition with no vocal lyrics. Enjoy the background soundtrack in high-fidelity 5 TB Cloud Audio!
                      </p>
                      {/* Animated audio wave bars */}
                      <div className="flex items-end gap-1.5 h-10 mt-6">
                        {[40, 75, 55, 90, 60, 80, 45, 95, 70, 50, 85, 65].map((h, i) => (
                          <span
                            key={i}
                            className={`w-1 bg-gradient-to-t from-purple-500 to-indigo-400 rounded-full transition-all duration-300 ${
                              isPlaying ? 'animate-pulse' : 'opacity-40'
                            }`}
                            style={{
                              height: isPlaying ? `${h}%` : '20%',
                              animationDelay: `${(i % 5) * 150}ms`
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  ) : syncedLines.length > 0 ? (
                    /* ── LIVE SYNCED LINE-BY-LINE HIGHLIGHTED KARAOKE ── */
                    <div className="py-12 space-y-5 text-center">
                      {syncedLines.map((line, idx) => {
                        const isActive = idx === activeLineIndex;
                        const isPast = activeLineIndex >= 0 && idx < activeLineIndex;

                        return (
                          <div
                            key={`${line.time}_${idx}`}
                            ref={isActive ? activeLineRef : null}
                            onClick={() => seekTo(line.time)}
                            title="Click to jump to this lyric"
                            className={`cursor-pointer transition-all duration-300 px-4 py-2 rounded-2xl select-none ${
                              isActive
                                ? 'text-white font-extrabold text-xl sm:text-2xl scale-[1.06] drop-shadow-[0_0_22px_rgba(168,85,247,0.95)] bg-purple-500/20 border border-purple-400/40 shadow-lg shadow-purple-500/20'
                                : isPast
                                ? 'text-white/40 hover:text-white/80 text-sm sm:text-base font-medium'
                                : 'text-white/30 hover:text-white/80 text-sm sm:text-base font-medium'
                            }`}
                          >
                            <p className={`leading-relaxed ${
                              isActive
                                ? 'bg-gradient-to-r from-purple-100 via-white to-purple-200 bg-clip-text text-transparent'
                                : ''
                            }`}>
                              {line.text}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  ) : lyricsText ? (
                    /* ── PLAIN LYRICS FALLBACK ── */
                    <div className="w-full text-center py-6">
                      <pre className="text-gray-200 text-sm sm:text-base leading-8 whitespace-pre-wrap font-sans text-center">
                        {lyricsText}
                      </pre>
                    </div>
                  ) : (
                    /* ── NO LYRICS FOUND ── */
                    <div className="text-center space-y-3 py-12">
                      <Music className="w-10 h-10 text-purple-400/40 mx-auto" />
                      <p className="text-gray-300 text-sm font-medium">No synchronized lyrics found for this track.</p>
                      <p className="text-gray-500 text-xs max-w-xs mx-auto">
                        You can upload a matching <span className="text-purple-400 font-mono">.lrc</span> file or embed ID3 lyrics to enable line sync.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* ── LUXURY ROTATING GRAMOPHONE RECORD PLAYER ── */
              <div className="flex flex-col items-center justify-center w-full">
                {/* Gramophone Turntable Plinth Deck */}
                <div
                  className="relative p-5 sm:p-7 rounded-[42px] bg-gradient-to-b from-[#16042b]/95 via-[#0b0114]/95 to-[#05000a]/95 border border-purple-500/25 shadow-[0_25px_80px_rgba(0,0,0,0.85),0_0_90px_rgba(147,51,234,0.22)] max-w-[340px] xs:max-w-sm sm:max-w-md w-full flex flex-col items-center justify-center cursor-pointer select-none group"
                  onClick={togglePlay}
                  title={isPlaying ? 'Click turntable to pause' : 'Click turntable to start'}
                >
                  {/* Outer Ambient Cosmic Radiant Glow */}
                  <div className={`absolute -inset-10 rounded-[48px] bg-purple-600/20 blur-3xl -z-10 transition-opacity duration-700 ${isPlaying ? 'animate-pulse' : 'opacity-25'}`} />

                  {/* ── MECHANICAL GRAMOPHONE TONEARM / STYLUS NEEDLE ── */}
                  <div
                    className="absolute top-3 right-5 sm:top-4 sm:right-7 pointer-events-none z-30 transition-transform duration-700 ease-out origin-top-right"
                    style={{
                      transform: isPlaying ? 'rotate(24deg)' : 'rotate(-16deg)'
                    }}
                  >
                    {/* Tonearm Pivot Base (Brushed Metallic Chrome & Gold Ring) */}
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-gray-300 via-gray-100 to-gray-400 border-2 border-white/80 shadow-xl flex items-center justify-center relative">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-800 via-black to-gray-900 border border-gray-500 shadow-inner flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_8px_#c084fc]" />
                      </div>
                    </div>

                    {/* Tonearm Metal Rod / Wand */}
                    <div className="w-1.5 h-32 sm:h-38 bg-gradient-to-r from-gray-300 via-white to-gray-400 rounded-full shadow-lg ml-4 sm:ml-4.5 -mt-1 origin-top transform -rotate-12">
                      {/* Headshell / Cartridge */}
                      <div className="absolute -bottom-6 -left-1.5 w-5 h-8 bg-gradient-to-b from-gray-900 via-black to-gray-900 rounded-sm border border-gray-600 shadow-2xl transform -rotate-15 flex flex-col items-center justify-between p-0.5">
                        <div className="w-3 h-1 bg-purple-500 rounded-full shadow-[0_0_6px_#a855f7]" />
                        {/* Glowing Stylus Needle Tip */}
                        <div className={`w-0.5 h-2.5 bg-amber-200 transition-all duration-300 ${isPlaying ? 'shadow-[0_0_8px_#fef08a] bg-yellow-100' : 'opacity-60'}`} />
                      </div>
                    </div>
                  </div>

                  {/* Turntable Platter Outer Metallic Beveled Rim */}
                  <div className="relative w-60 h-60 xs:w-68 xs:h-68 sm:w-76 sm:h-76 md:w-80 md:h-80 rounded-full bg-gradient-to-tr from-gray-800 via-[#1c0638] to-gray-900 p-2.5 sm:p-3 shadow-2xl border border-purple-400/25 ring-2 ring-purple-900/40 flex items-center justify-center">

                    {/* ── ROTATING VINYL DISC RECORD ── */}
                    <div
                      className={`w-full h-full rounded-full bg-gradient-to-br from-[#1b0533] via-[#090013] to-[#150228] border border-purple-500/30 shadow-2xl flex items-center justify-center relative select-none transition-transform ${
                        isPlaying ? 'animate-spin-slow' : 'animate-spin-slow animation-paused'
                      }`}
                    >
                      {/* Vinyl Conic Sheen Reflection (Authentic turntable gleam) */}
                      <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,transparent_0deg,rgba(255,255,255,0.06)_50deg,transparent_110deg,rgba(255,255,255,0.06)_230deg,transparent_290deg)] pointer-events-none" />

                      {/* Ring 1 — Outer vinyl edge band */}
                      <div className="w-[92%] h-[92%] rounded-full border border-purple-800/40 flex items-center justify-center">
                        {/* Ring 2 — Outer subtle white groove */}
                        <div className="w-[86%] h-[86%] rounded-full border border-white/20 flex items-center justify-center">
                          {/* Ring 3 — Mid dark band */}
                          <div className="w-[80%] h-[80%] rounded-full border border-purple-700/30 flex items-center justify-center">
                            {/* Ring 4 — Crisp luminous white groove */}
                            <div className="w-[74%] h-[74%] rounded-full border border-white/50 shadow-[0_0_12px_rgba(255,255,255,0.2)] flex items-center justify-center">
                              {/* Ring 5 — Brightest luminous crisp white groove (matching reference) */}
                              <div className="w-[68%] h-[68%] rounded-full border border-white/80 shadow-[0_0_16px_rgba(255,255,255,0.4)] flex items-center justify-center">
                                
                                {/* Central Glowing Purple Label Core */}
                                <div className="w-22 h-22 sm:w-26 sm:h-26 rounded-full bg-gradient-to-tr from-[#9333ea] via-[#a855f7] to-[#7c3aed] flex items-center justify-center shadow-[0_0_45px_rgba(168,85,247,0.95)] border-2 border-white/60 ring-4 ring-purple-500/30 relative">
                                  <Music className="w-9 h-9 sm:w-11 sm:h-11 text-white drop-shadow-[0_2px_12px_rgba(255,255,255,0.9)]" />

                                  {/* Center Metallic Spindle Pin Hole */}
                                  <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-gray-200 via-gray-300 to-gray-500 border border-white/90 shadow-md absolute inset-0 m-auto flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#1b0533]" />
                                  </div>
                                </div>

                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Turntable Plinth Lower Deck Bar */}
                  <div className="w-full flex items-center justify-between text-[10px] font-mono text-purple-400/80 mt-3 px-2">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full transition-colors ${isPlaying ? 'bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse' : 'bg-gray-500'}`} />
                      <span className="uppercase tracking-wider font-bold text-gray-300 text-[10px]">
                        {isPlaying ? 'GRAMOPHONE TURNTABLE ACTIVE' : 'TONEARM RESTING · PAUSED'}
                      </span>
                    </div>
                    <span className="font-semibold text-purple-400/90 tracking-widest uppercase text-[10px]">
                      33 ⅓ RPM · LOSSLESS
                    </span>
                  </div>
                </div>

                {/* Live Real-Time Equalizer Frequency Visualizer */}
                <div className="flex items-end justify-center gap-1 h-5 mt-4 px-4">
                  {[35, 60, 45, 80, 50, 95, 70, 40, 85, 65, 90, 55, 75, 45, 85, 60, 40, 70, 50, 30].map((h, i) => (
                    <span
                      key={i}
                      className={`w-1 rounded-full bg-gradient-to-t from-purple-500 to-indigo-300 transition-all duration-150 ${
                        isPlaying ? 'animate-pulse' : 'opacity-25'
                      }`}
                      style={{
                        height: isPlaying ? `${h}%` : '20%',
                        animationDelay: `${(i % 6) * 100}ms`
                      }}
                    />
                  ))}
                </div>

                {/* Track Title & Lossless Badge */}
                <div className="mt-3 text-center max-w-md px-4">
                  <h2 className="text-lg sm:text-2xl font-bold tracking-tight text-white line-clamp-1 drop-shadow-sm">
                    {cleanTitle}
                  </h2>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-purple-300 bg-purple-500/10 border border-purple-500/20 px-3 py-0.5 rounded-full shadow-sm">
                      <Sparkles className="w-3 h-3 text-purple-400" />
                      5 TB Audiophile Cloud · Hi-Fi Master
                    </span>
                  </div>
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
