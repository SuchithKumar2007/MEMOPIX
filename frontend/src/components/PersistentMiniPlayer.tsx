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
  ChevronUp,
  GripVertical,
  ListMusic,
  X,
  Music,
  Disc3,
  Loader2,
  Trash2,
  Download,
  FileText,
  Headphones,
  Sparkles
} from 'lucide-react';
import { useMusicPlayer } from '../context/MusicPlayerContext';
import { useToast } from '../context/ToastContext';
import { mediaApi, resolveMediaUrl } from '../services/api';
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

  // Drag & drop state for queue reordering
  const [draggedQueueIdx, setDraggedQueueIdx] = useState<number | null>(null);
  const [dragOverQueueIdx, setDragOverQueueIdx] = useState<number | null>(null);

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
    reorderQueue,
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
            <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/30 border border-purple-500/40 ${
              isPlaying ? 'animate-spin-slow' : 'animation-paused'
            }`}>
              <img src="/turntable-disc-perfect.png" alt="Vinyl Disc" className="w-full h-full object-cover" />
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

            {/* Download Button */}
            {currentTrack && (
              <a
                href={resolveMediaUrl(currentTrack.downloadUrl || currentTrack.streamUrl)}
                download={currentTrack.originalName}
                onClick={e => e.stopPropagation()}
                className="p-1.5 text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400 transition-colors hidden xs:block"
                title="Download Song"
              >
                <Download className="w-4 h-4 sm:w-5 sm:h-5" />
              </a>
            )}

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
              {currentTrack && (
                <a
                  href={resolveMediaUrl(currentTrack.downloadUrl || currentTrack.streamUrl)}
                  download={currentTrack.originalName}
                  className="p-2 rounded-full bg-white/10 hover:bg-purple-600/30 text-white hover:text-purple-300 active:scale-95 transition-all flex items-center justify-center"
                  title="Download this song"
                >
                  <Download className="w-5 h-5" />
                </a>
              )}

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
              <div className="w-full h-80 sm:h-96 bg-black/40 backdrop-blur-md border border-purple-500/25 rounded-3xl p-4 sm:p-5 flex flex-col shadow-[0_0_40px_rgba(139,92,246,0.15)]">
                <div className="flex items-center justify-between mb-2.5 px-2 pb-2.5 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <ListMusic className="w-4 h-4 text-purple-400" />
                    <h3 className="font-bold text-sm text-purple-200">Play Queue ({queue.length})</h3>
                  </div>
                  <span className="text-[11px] font-mono text-purple-300 bg-purple-500/15 px-2.5 py-0.5 rounded-full border border-purple-500/30">
                    {currentIndex + 1} of {queue.length}
                  </span>
                </div>

                <div className="text-[11px] text-gray-400 mb-2 px-2 flex items-center justify-between">
                  <span className="flex items-center gap-1 text-purple-300/80">
                    <GripVertical className="w-3.5 h-3.5" />
                    <span>Drag items or use arrows to reorder queue</span>
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono">Real-time sync</span>
                </div>

                <div className="space-y-1.5 flex-1 overflow-y-auto pr-1">
                  {queue.map((track, idx) => {
                    const isCurrent = idx === currentIndex;
                    const isDragging = draggedQueueIdx === idx;
                    const isDragOver = dragOverQueueIdx === idx;

                    return (
                      <div
                        key={`${track.id}_${idx}`}
                        draggable
                        onDragStart={(e) => {
                          setDraggedQueueIdx(idx);
                          e.dataTransfer.effectAllowed = 'move';
                          e.dataTransfer.setData('text/plain', String(idx));
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';
                          if (dragOverQueueIdx !== idx) {
                            setDragOverQueueIdx(idx);
                          }
                        }}
                        onDragLeave={() => {
                          if (dragOverQueueIdx === idx) {
                            setDragOverQueueIdx(null);
                          }
                        }}
                        onDragEnd={() => {
                          setDraggedQueueIdx(null);
                          setDragOverQueueIdx(null);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (draggedQueueIdx !== null && draggedQueueIdx !== idx) {
                            reorderQueue(draggedQueueIdx, idx);
                          }
                          setDraggedQueueIdx(null);
                          setDragOverQueueIdx(null);
                        }}
                        onClick={() => playTrack(track, queue)}
                        className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all duration-150 select-none ${
                          isDragging
                            ? 'opacity-40 scale-95 border-2 border-dashed border-purple-400 bg-purple-950/40'
                            : isDragOver
                            ? 'bg-purple-600/40 border-2 border-purple-400 shadow-lg shadow-purple-500/25 scale-[1.01]'
                            : isCurrent
                            ? 'bg-gradient-to-r from-purple-900/60 to-indigo-900/50 border border-purple-500/50 text-white font-bold shadow-md shadow-purple-900/30'
                            : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {/* Drag handle */}
                          <div
                            className="p-1 text-gray-500 hover:text-purple-300 cursor-grab active:cursor-grabbing flex-shrink-0"
                            title="Drag to reorder"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <GripVertical className="w-4 h-4" />
                          </div>

                          {/* Index or Current Playing Dot */}
                          <div className="w-5 text-center flex-shrink-0">
                            {isCurrent ? (
                              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] inline-block animate-pulse" />
                            ) : (
                              <span className="text-xs text-gray-500 font-mono">{idx + 1}</span>
                            )}
                          </div>

                          {/* Track Title and Duration */}
                          <div className="min-w-0 flex-1">
                            <p className="text-xs truncate font-medium">{track.originalName.replace(/\.[^/.]+$/, '')}</p>
                            <p className="text-[10px] text-gray-400 font-mono">{formatDuration(track.duration || 0)}</p>
                          </div>
                        </div>

                        {/* Reorder and Remove Actions */}
                        <div className="flex items-center gap-1 flex-shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            disabled={idx === 0}
                            onClick={() => reorderQueue(idx, idx - 1)}
                            className="p-1 text-gray-400 hover:text-white disabled:opacity-20 disabled:hover:text-gray-400 rounded hover:bg-white/10 transition-colors"
                            title="Move Up"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>

                          <button
                            disabled={idx === queue.length - 1}
                            onClick={() => reorderQueue(idx, idx + 1)}
                            className="p-1 text-gray-400 hover:text-white disabled:opacity-20 disabled:hover:text-gray-400 rounded hover:bg-white/10 transition-colors"
                            title="Move Down"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>

                          {idx !== currentIndex && (
                            <button
                              onClick={() => removeFromQueue(idx)}
                              className="text-gray-500 hover:text-red-400 p-1 rounded hover:bg-red-500/10 transition-colors ml-1"
                              title="Remove from queue"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
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
              /* ── CYBER NEON TURNTABLE ROTATOR (Properly Aligned & Centered on ALL Sides) ── */
              <div className="flex flex-col items-center justify-center w-full">
                {/* Cyber Turntable Plinth Deck */}
                <div
                  className="relative p-5 sm:p-6 rounded-[38px] bg-gradient-to-b from-[#140628]/95 via-[#090214]/95 to-[#040108]/95 border border-cyan-500/30 shadow-[0_25px_80px_rgba(0,0,0,0.95),0_0_80px_rgba(6,182,212,0.22),0_0_100px_rgba(168,85,247,0.25)] w-full max-w-[340px] sm:max-w-[380px] flex flex-col items-center justify-center cursor-pointer select-none group overflow-hidden"
                  onClick={togglePlay}
                  title={isPlaying ? 'Click turntable to pause' : 'Click turntable to start'}
                >
                  {/* Outer Ambient Cosmic Neon Aura */}
                  <div className={`absolute -inset-10 rounded-[48px] bg-gradient-to-tr from-purple-600/25 via-pink-600/15 to-cyan-500/25 blur-3xl -z-10 transition-opacity duration-700 ${isPlaying ? 'animate-pulse' : 'opacity-25'}`} />

                  {/* Symmetrical Neon Swirl Light Trails (Framing the deck evenly on all sides) */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-0" viewBox="0 0 400 360">
                    <defs>
                      <linearGradient id="purpleRibbon" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ec4899" stopOpacity="0.95" />
                        <stop offset="50%" stopColor="#a855f7" stopOpacity="0.85" />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                      </linearGradient>
                      <linearGradient id="cyanRibbon" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#00f0ff" stopOpacity="0" />
                        <stop offset="35%" stopColor="#00f0ff" stopOpacity="0.95" />
                        <stop offset="85%" stopColor="#38bdf8" stopOpacity="0.9" />
                        <stop offset="100%" stopColor="#818cf8" stopOpacity="0.3" />
                      </linearGradient>
                      <filter id="neonGlow" x="-30%" y="-30%" width="160%" height="160%">
                        <feGaussianBlur stdDeviation="4" result="b1" />
                        <feGaussianBlur stdDeviation="9" result="b2" />
                        <feMerge>
                          <feMergeNode in="b2" />
                          <feMergeNode in="b1" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>
                    {/* Top-left to bottom-left neon purple swirl */}
                    <path
                      d="M -10 180 C 15 110, 25 50, 100 28 C 170 8, 230 20, 270 42"
                      fill="none"
                      stroke="url(#purpleRibbon)"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      filter="url(#neonGlow)"
                      className={isPlaying ? "animate-pulse" : "opacity-50"}
                    />
                    {/* Bottom & right neon cyan swirl */}
                    <path
                      d="M 140 335 C 235 340, 335 305, 365 225 C 390 145, 370 75, 315 42"
                      fill="none"
                      stroke="url(#cyanRibbon)"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      filter="url(#neonGlow)"
                      className={isPlaying ? "animate-pulse" : "opacity-50"}
                    />
                  </svg>

                  {/* ── MECHANICAL CHROME TONEARM (Clean Vector - ZERO seams, ZERO gray box artifacts) ── */}
                  <div
                    className="absolute top-2 right-3 sm:top-3 sm:right-5 pointer-events-none z-30 transition-transform duration-700 ease-out"
                    style={{
                      transformOrigin: '76px 28px',
                      transform: isPlaying ? 'rotate(18deg)' : 'rotate(-12deg)'
                    }}
                  >
                    <svg width="105" height="195" viewBox="0 0 105 195" fill="none" className="drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]">
                      <defs>
                        <linearGradient id="chromeBaseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#f3f4f6" />
                          <stop offset="40%" stopColor="#9ca3af" />
                          <stop offset="70%" stopColor="#d1d5db" />
                          <stop offset="100%" stopColor="#4b5563" />
                        </linearGradient>
                        <linearGradient id="wandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#ffffff" />
                          <stop offset="50%" stopColor="#cbd5e1" />
                          <stop offset="80%" stopColor="#64748b" />
                          <stop offset="100%" stopColor="#e2e8f0" />
                        </linearGradient>
                        <linearGradient id="cartridgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#1e1b4b" />
                          <stop offset="50%" stopColor="#0f172a" />
                          <stop offset="100%" stopColor="#020617" />
                        </linearGradient>
                        <filter id="stylusGlow" x="-50%" y="-50%" width="200%" height="200%">
                          <feGaussianBlur stdDeviation="3" result="glow" />
                          <feMerge>
                            <feMergeNode in="glow" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                      </defs>

                      {/* Turret Pivot Base Ring */}
                      <circle cx="76" cy="28" r="24" fill="url(#chromeBaseGrad)" stroke="#ffffff" strokeWidth="1.5" />
                      <circle cx="76" cy="28" r="18" fill="#1e293b" stroke="#64748b" strokeWidth="1" />
                      <circle cx="76" cy="28" r="12" fill="url(#chromeBaseGrad)" />
                      <circle cx="76" cy="28" r="6" fill="#0f172a" stroke="#00f0ff" strokeWidth="1" />
                      <circle cx="76" cy="28" r="2.5" fill="#00f0ff" className={isPlaying ? "animate-pulse" : "opacity-60"} />

                      {/* Curved Metallic Arm Tube */}
                      <path
                        d="M 76 34 C 76 75, 78 115, 52 152 L 40 170"
                        stroke="url(#wandGrad)"
                        strokeWidth="4"
                        strokeLinecap="round"
                        fill="none"
                      />
                      <path
                        d="M 77 34 C 77 75, 79 115, 53 152 L 41 170"
                        stroke="#ffffff"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        fill="none"
                        opacity="0.8"
                      />

                      {/* Headshell Connector */}
                      <rect x="33" y="166" width="10" height="7" rx="1.5" transform="rotate(-34 38 169)" fill="#475569" stroke="#94a3b8" strokeWidth="0.8" />

                      {/* Cartridge Housing */}
                      <polygon points="26,172 38,164 45,178 33,186" fill="url(#cartridgeGrad)" stroke="#38bdf8" strokeWidth="1" />

                      {/* Neon Purple Cartridge Light */}
                      <rect x="29" y="171" width="10" height="3" rx="1" transform="rotate(-34 34 172)" fill="#c084fc" filter="url(#stylusGlow)" />

                      {/* Stylus Needle Tip with Glowing Cyan Contact Point */}
                      <circle cx="27" cy="184" r="2.5" fill="#00f0ff" filter="url(#stylusGlow)" className={isPlaying ? "animate-ping" : "opacity-0"} />
                      <circle cx="27" cy="184" r="1.8" fill="#ffffff" />
                    </svg>
                  </div>

                  {/* ── TURNTABLE PLATTER OUTER METALLIC RIM (Equally Spaced On ALL 4 Sides) ── */}
                  <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full bg-gradient-to-tr from-gray-900 via-[#130628] to-gray-800 p-2 sm:p-2.5 shadow-[0_0_35px_rgba(6,182,212,0.35),inset_0_0_25px_rgba(168,85,247,0.35)] border border-cyan-400/35 ring-4 ring-purple-900/40 flex items-center justify-center z-10 mx-auto aspect-square flex-shrink-0">

                    {/* ── 360° CONTINUOUS ROTATING VINYL RECORD (100% Mathematically Circular & Concentric) ── */}
                    <div
                      className={`w-full h-full rounded-full overflow-hidden shadow-2xl relative select-none pointer-events-none aspect-square ${
                        isPlaying ? 'animate-spin-slow' : 'animate-spin-slow animation-paused'
                      }`}
                    >
                      <img
                        src="/turntable-disc-perfect.png"
                        alt="Rotating Cyber Vinyl Disc"
                        className="w-full h-full object-cover rounded-full select-none"
                        draggable={false}
                      />
                    </div>
                  </div>

                  {/* Turntable Plinth Lower Status Tag Bar */}
                  <div className="w-full flex items-center justify-between text-[10px] font-mono text-cyan-400/90 mt-4 px-2 z-10 bg-black/40 backdrop-blur-sm py-1.5 px-3 rounded-full border border-white/10">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full transition-colors ${isPlaying ? 'bg-cyan-400 shadow-[0_0_8px_#00f0ff] animate-pulse' : 'bg-gray-500'}`} />
                      <span className="uppercase tracking-wider font-bold text-gray-200 text-[10px]">
                        {isPlaying ? 'CYBER VINYL ROTATING' : 'TURNTABLE PAUSED'}
                      </span>
                    </div>
                    <span className="font-semibold text-purple-300 tracking-widest uppercase text-[10px]">
                      33 ⅓ RPM · LOSSLESS
                    </span>
                  </div>
                </div>

                {/* ── LIVE NEON FREQUENCY EQUALIZER SPECTRUM (Matches Reference Photo) ── */}
                <div className="flex flex-col items-center mt-5 w-full max-w-sm sm:max-w-md px-2">
                  {/* Equalizer Frequency Bars */}
                  <div className="flex items-end justify-center gap-1 sm:gap-1.5 h-9 w-full">
                    {[
                      { h: 35, c: 'from-purple-600 to-pink-500 shadow-[0_0_6px_#d946ef]' },
                      { h: 55, c: 'from-purple-600 to-pink-500 shadow-[0_0_6px_#d946ef]' },
                      { h: 70, c: 'from-purple-500 to-indigo-500 shadow-[0_0_6px_#a855f7]' },
                      { h: 45, c: 'from-purple-500 to-indigo-500 shadow-[0_0_6px_#a855f7]' },
                      { h: 80, c: 'from-indigo-500 to-cyan-500 shadow-[0_0_8px_#00f0ff]' },
                      { h: 95, c: 'from-cyan-500 to-sky-400 shadow-[0_0_10px_#00f0ff]' },
                      { h: 60, c: 'from-cyan-500 to-sky-400 shadow-[0_0_8px_#00f0ff]' },
                      { h: 85, c: 'from-cyan-400 to-teal-400 shadow-[0_0_10px_#00f0ff]' },
                      { h: 50, c: 'from-cyan-400 to-teal-400 shadow-[0_0_8px_#00f0ff]' },
                      { h: 100, c: 'from-cyan-400 to-white shadow-[0_0_12px_#00f0ff]' },
                      { h: 75, c: 'from-cyan-500 to-sky-400 shadow-[0_0_10px_#00f0ff]' },
                      { h: 90, c: 'from-cyan-500 to-sky-400 shadow-[0_0_10px_#00f0ff]' },
                      { h: 65, c: 'from-sky-500 to-indigo-500 shadow-[0_0_8px_#00f0ff]' },
                      { h: 85, c: 'from-indigo-500 to-purple-500 shadow-[0_0_8px_#a855f7]' },
                      { h: 55, c: 'from-purple-500 to-pink-500 shadow-[0_0_8px_#d946ef]' },
                      { h: 75, c: 'from-purple-600 to-pink-500 shadow-[0_0_6px_#ec4899]' },
                      { h: 40, c: 'from-pink-600 to-purple-600 shadow-[0_0_6px_#ec4899]' },
                      { h: 60, c: 'from-purple-600 to-pink-500 shadow-[0_0_6px_#d946ef]' },
                      { h: 80, c: 'from-indigo-500 to-cyan-500 shadow-[0_0_8px_#00f0ff]' },
                      { h: 45, c: 'from-cyan-500 to-sky-400 shadow-[0_0_8px_#00f0ff]' },
                      { h: 90, c: 'from-cyan-400 to-white shadow-[0_0_10px_#00f0ff]' },
                      { h: 70, c: 'from-cyan-500 to-sky-400 shadow-[0_0_8px_#00f0ff]' },
                      { h: 85, c: 'from-indigo-500 to-purple-500 shadow-[0_0_8px_#a855f7]' },
                      { h: 50, c: 'from-purple-500 to-pink-500 shadow-[0_0_6px_#d946ef]' },
                      { h: 65, c: 'from-purple-600 to-pink-600 shadow-[0_0_6px_#ec4899]' },
                      { h: 35, c: 'from-pink-600 to-purple-700 shadow-[0_0_4px_#ec4899]' }
                    ].map((bar, i) => (
                      <span
                        key={i}
                        className={`w-1 sm:w-1.5 rounded-t-sm bg-gradient-to-t ${bar.c} transition-all duration-150 ${
                          isPlaying ? 'animate-pulse' : 'opacity-30'
                        }`}
                        style={{
                          height: isPlaying ? `${bar.h}%` : '20%',
                          animationDelay: `${(i % 8) * 80}ms`
                        }}
                      />
                    ))}
                  </div>

                  {/* Equalizer Glossy Reflection (Mirror row from reference photo) */}
                  <div className="flex items-start justify-center gap-1 sm:gap-1.5 h-3.5 w-full opacity-25 scale-y-[-1] blur-[0.5px] pointer-events-none -mt-0.5">
                    {[
                      { h: 35, c: 'from-purple-600 to-pink-500' },
                      { h: 55, c: 'from-purple-600 to-pink-500' },
                      { h: 70, c: 'from-purple-500 to-indigo-500' },
                      { h: 45, c: 'from-purple-500 to-indigo-500' },
                      { h: 80, c: 'from-indigo-500 to-cyan-500' },
                      { h: 95, c: 'from-cyan-500 to-sky-400' },
                      { h: 60, c: 'from-cyan-500 to-sky-400' },
                      { h: 85, c: 'from-cyan-400 to-teal-400' },
                      { h: 50, c: 'from-cyan-400 to-teal-400' },
                      { h: 100, c: 'from-cyan-400 to-white' },
                      { h: 75, c: 'from-cyan-500 to-sky-400' },
                      { h: 90, c: 'from-cyan-500 to-sky-400' },
                      { h: 65, c: 'from-sky-500 to-indigo-500' },
                      { h: 85, c: 'from-indigo-500 to-purple-500' },
                      { h: 55, c: 'from-purple-500 to-pink-500' },
                      { h: 75, c: 'from-purple-600 to-pink-500' },
                      { h: 40, c: 'from-pink-600 to-purple-600' },
                      { h: 60, c: 'from-purple-600 to-pink-500' },
                      { h: 80, c: 'from-indigo-500 to-cyan-500' },
                      { h: 45, c: 'from-cyan-500 to-sky-400' },
                      { h: 90, c: 'from-cyan-400 to-white' },
                      { h: 70, c: 'from-cyan-500 to-sky-400' },
                      { h: 85, c: 'from-indigo-500 to-purple-500' },
                      { h: 50, c: 'from-purple-500 to-pink-500' },
                      { h: 65, c: 'from-purple-600 to-pink-600' },
                      { h: 35, c: 'from-pink-600 to-purple-700' }
                    ].map((bar, i) => (
                      <span
                        key={i}
                        className={`w-1 sm:w-1.5 rounded-t-sm bg-gradient-to-t ${bar.c} transition-all duration-150`}
                        style={{
                          height: isPlaying ? `${Math.min(100, bar.h * 0.6)}%` : '15%'
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Track Title & Lossless Badge */}
                <div className="mt-3 text-center max-w-md px-4">
                  <h2 className="text-lg sm:text-2xl font-bold tracking-tight text-white line-clamp-1 drop-shadow-sm">
                    {cleanTitle}
                  </h2>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-cyan-300 bg-cyan-500/10 border border-cyan-500/25 px-3 py-0.5 rounded-full shadow-[0_0_12px_rgba(6,182,212,0.2)]">
                      <Sparkles className="w-3 h-3 text-cyan-400" />
                      5 TB Audiophile Cloud · Cyber Hi-Fi Master
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
