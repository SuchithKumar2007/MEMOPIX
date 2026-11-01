import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { MediaItem } from '../types';
import { resolveMediaUrl } from '../services/api';

interface MusicPlayerContextType {
  currentTrack: MediaItem | null;
  queue: MediaItem[];
  currentIndex: number;
  isPlaying: boolean;
  isBuffering: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffle: boolean;
  repeatMode: 'none' | 'all' | 'one';
  isExpanded: boolean;
  showQueue: boolean;
  playTrack: (track: MediaItem, newQueue?: MediaItem[]) => void;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seekTo: (seconds: number) => void;
  setVolumeLevel: (vol: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  setIsExpanded: (val: boolean) => void;
  setShowQueue: (val: boolean) => void;
  addToQueue: (track: MediaItem) => void;
  removeFromQueue: (index: number) => void;
  closePlayer: () => void;
}

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(undefined);

export const MusicPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [currentTrack, setCurrentTrack] = useState<MediaItem | null>(null);
  const [queue, setQueue] = useState<MediaItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(() => {
    const saved = localStorage.getItem('memopix_music_volume');
    return saved !== null ? parseFloat(saved) : 0.8;
  });
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<'none' | 'all' | 'one'>('none');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [showQueue, setShowQueue] = useState<boolean>(false);

  // Initialize HTML5 Audio element with CORS & streaming support
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    audio.crossOrigin = 'anonymous';
    audioRef.current = audio;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => {
      setDuration(audio.duration || 0);
      setIsBuffering(false);
    };
    const onWaiting = () => setIsBuffering(true);
    const onPlaying = () => {
      setIsBuffering(false);
      setIsPlaying(true);
    };
    const onCanPlay = () => setIsBuffering(false);
    const onEnded = () => handleTrackEnded();
    const onPause = () => setIsPlaying(false);
    const onError = () => {
      const err = audio.error;
      console.warn('[MusicPlayer] Audio error:', err ? `code=${err.code}: ${err.message}` : 'unknown');
      setIsBuffering(false);
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('error', onError);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('error', onError);
    };
  }, []);

  // Update MediaSession API for OS controls (Android notification, iOS lockscreen)
  useEffect(() => {
    if (!currentTrack || typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    const trackTitle = currentTrack.originalName.replace(/\.[^/.]+$/, '');
    navigator.mediaSession.metadata = new MediaMetadata({
      title: trackTitle,
      artist: 'MEMOPIX Cloud',
      album: '5 TB Private Music',
      artwork: [
        {
          src: currentTrack.thumbnailUrl || '/icon-192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: currentTrack.thumbnailUrl || '/icon-512.png',
          sizes: '512x512',
          type: 'image/png'
        }
      ]
    });

    navigator.mediaSession.setActionHandler('play', () => {
      audioRef.current?.play().catch(() => {});
    });
    navigator.mediaSession.setActionHandler('pause', () => {
      audioRef.current?.pause();
    });
    navigator.mediaSession.setActionHandler('previoustrack', () => {
      prevTrack();
    });
    navigator.mediaSession.setActionHandler('nexttrack', () => {
      nextTrack();
    });
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime !== undefined && audioRef.current) {
        audioRef.current.currentTime = details.seekTime;
      }
    });
  }, [currentTrack]);

  // Handle Play track - resolves URLs to absolute backend URLs for reliable streaming on web & mobile
  const playTrack = useCallback((track: MediaItem, newQueue?: MediaItem[]) => {
    if (!audioRef.current) return;

    // If tapping same track, toggle play/pause
    if (currentTrack?.id === track.id) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        setIsBuffering(true);
        audioRef.current.play().then(() => {
          setIsBuffering(false);
        }).catch(err => {
          console.warn('[MusicPlayer] Play resumed - waiting on user gesture:', err);
          setIsBuffering(false);
        });
      }
      return;
    }

    let targetQueue = queue;
    if (newQueue && newQueue.length > 0) {
      targetQueue = newQueue;
      setQueue(newQueue);
    } else if (!queue.some(t => t.id === track.id)) {
      targetQueue = [track, ...queue];
      setQueue(targetQueue);
    }

    const idx = targetQueue.findIndex(t => t.id === track.id);
    setCurrentIndex(idx !== -1 ? idx : 0);

    // Resolve to absolute backend URL (fixes Vercel proxy limits & mobile APK localhost issue)
    const streamUrl = resolveMediaUrl(track.streamUrl);
    const resolvedTrack = { ...track, streamUrl };
    setCurrentTrack(resolvedTrack);
    setCurrentTime(0);
    setDuration(0);
    setIsBuffering(true);

    try {
      audioRef.current.pause();
      audioRef.current.src = streamUrl;
      audioRef.current.crossOrigin = 'anonymous';
      audioRef.current.volume = isMuted ? 0 : volume;
      audioRef.current.load();

      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsBuffering(false);
          })
          .catch(err => {
            // NotAllowedError = autoplay blocked, user must tap Play button
            console.warn('[MusicPlayer] Autoplay blocked or stream initializing:', err.name, err.message);
            setIsBuffering(false);
          });
      }
    } catch (err) {
      console.error('[MusicPlayer] Track load failed:', err);
      setIsBuffering(false);
    }

    // Save to recently played
    try {
      const recent = JSON.parse(localStorage.getItem('memopix_recently_played') || '[]');
      const filtered = recent.filter((r: any) => r.id !== track.id);
      localStorage.setItem('memopix_recently_played', JSON.stringify([resolvedTrack, ...filtered].slice(0, 50)));
    } catch {}
  }, [queue, volume, isMuted, currentTrack, isPlaying]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current || !currentTrack) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      // Re-attach src if audio lost its source (e.g. page reload)
      if (!audioRef.current.src || audioRef.current.src === window.location.href) {
        audioRef.current.src = resolveMediaUrl(currentTrack.streamUrl);
        audioRef.current.crossOrigin = 'anonymous';
        audioRef.current.load();
      }
      setIsBuffering(true);
      audioRef.current.play().then(() => {
        setIsBuffering(false);
      }).catch(err => {
        console.warn('[MusicPlayer] Resume rejected:', err);
        setIsBuffering(false);
      });
    }
  }, [isPlaying, currentTrack]);

  const nextTrack = useCallback(() => {
    if (queue.length === 0) return;

    if (repeatMode === 'one' && currentTrack) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
      return;
    }

    let nextIdx: number;
    if (isShuffle) {
      nextIdx = Math.floor(Math.random() * queue.length);
    } else {
      nextIdx = currentIndex + 1;
      if (nextIdx >= queue.length) {
        if (repeatMode === 'all') {
          nextIdx = 0;
        } else {
          return; // reached end
        }
      }
    }

    const nextItem = queue[nextIdx];
    if (nextItem) {
      playTrack(nextItem, queue);
    }
  }, [queue, currentIndex, isShuffle, repeatMode, currentTrack, playTrack]);

  const prevTrack = useCallback(() => {
    if (queue.length === 0) return;

    // If current time > 3 seconds, restart current track
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }

    let prevIdx = currentIndex - 1;
    if (prevIdx < 0) {
      prevIdx = repeatMode === 'all' ? queue.length - 1 : 0;
    }

    const prevItem = queue[prevIdx];
    if (prevItem) {
      playTrack(prevItem, queue);
    }
  }, [queue, currentIndex, repeatMode, playTrack]);

  const handleTrackEnded = useCallback(() => {
    if (repeatMode === 'one' && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    } else {
      nextTrack();
    }
  }, [repeatMode, nextTrack]);

  const seekTo = useCallback((seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(duration, seconds));
      setCurrentTime(audioRef.current.currentTime);
    }
  }, [duration]);

  const setVolumeLevel = useCallback((vol: number) => {
    const cleanVol = Math.max(0, Math.min(1, vol));
    setVolume(cleanVol);
    localStorage.setItem('memopix_music_volume', cleanVol.toString());
    if (audioRef.current) {
      audioRef.current.volume = cleanVol;
      if (cleanVol === 0) setIsMuted(true);
      else if (isMuted) setIsMuted(false);
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    if (audioRef.current) {
      const nextMuted = !isMuted;
      setIsMuted(nextMuted);
      audioRef.current.muted = nextMuted;
    }
  }, [isMuted]);

  const toggleShuffle = useCallback(() => {
    setIsShuffle(prev => !prev);
  }, []);

  const toggleRepeat = useCallback(() => {
    setRepeatMode(prev => {
      if (prev === 'none') return 'all';
      if (prev === 'all') return 'one';
      return 'none';
    });
  }, []);

  const addToQueue = useCallback((track: MediaItem) => {
    setQueue(prev => [...prev, track]);
  }, []);

  const removeFromQueue = useCallback((index: number) => {
    setQueue(prev => prev.filter((_, i) => i !== index));
  }, []);

  const closePlayer = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setCurrentTrack(null);
    setIsPlaying(false);
    setIsExpanded(false);
    setIsBuffering(false);
  }, []);

  return (
    <MusicPlayerContext.Provider
      value={{
        currentTrack,
        queue,
        currentIndex,
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
        playTrack,
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
        addToQueue,
        removeFromQueue,
        closePlayer
      }}
    >
      {children}
    </MusicPlayerContext.Provider>
  );
};

export const useMusicPlayer = () => {
  const context = useContext(MusicPlayerContext);
  if (!context) {
    throw new Error('useMusicPlayer must be used within a MusicPlayerProvider');
  }
  return context;
};
