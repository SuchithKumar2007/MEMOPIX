import React, { useState, useEffect, useRef } from 'react';
import {
  Music,
  Play,
  Shuffle,
  Plus,
  ListMusic,
  Trash2,
  FolderPlus,
  Clock,
  Disc3,
  Heart,
  GripVertical,
  RotateCcw,
  Check,
  Edit2,
  ArrowLeft,
  ListPlus,
  Camera,
  Upload,
  Download
} from 'lucide-react';
import { MediaItem, Playlist } from '../types';
import { mediaApi, playlistApi, resolveMediaUrl } from '../services/api';
import { downloadMediaFile } from '../utils/download';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { EmptyState } from '../components/EmptyState';
import { useToast } from '../context/ToastContext';
import { useMusicPlayer } from '../context/MusicPlayerContext';
import { formatDuration, formatBytes } from '../utils/formatters';
import { AddToPlaylistModal } from '../components/AddToPlaylistModal';
import { SelectSongsModal } from '../components/SelectSongsModal';

interface AudioPageProps {
  searchQuery: string;
  selectedIds: string[];
  onToggleSelect: (id: string, e: React.MouseEvent) => void;
  onSelectGroup: (ids: string[]) => void;
  onClickMedia: (media: MediaItem, list: MediaItem[]) => void;
  onOpenUpload: () => void;
  onFavorite: (id: string, isFav: boolean) => void;
  onRename?: (media: MediaItem) => void;
  reloadTrigger: number;
}

const CACHE_KEY_AUDIO = 'memopix_cache_audio_v2';
const CACHE_KEY_PLAYLISTS = 'memopix_cache_playlists';

export const AudioPage: React.FC<AudioPageProps> = ({
  searchQuery,
  selectedIds,
  onToggleSelect,
  onSelectGroup,
  onClickMedia,
  onOpenUpload,
  onFavorite,
  onRename,
  reloadTrigger
}) => {
  const [activeTab, setActiveTab] = useState<'tracks' | 'playlists'>('tracks');
  const [tracks, setTracks] = useState<MediaItem[]>(() => {
    try {
      const saved = localStorage.getItem(CACHE_KEY_AUDIO);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    try {
      const saved = localStorage.getItem(CACHE_KEY_PLAYLISTS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [newPlaylistTitle, setNewPlaylistTitle] = useState('');
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(CACHE_KEY_AUDIO);
      return saved === null;
    } catch {
      return true;
    }
  });

  // Playlist Modals
  const [isAddToPlaylistOpen, setIsAddToPlaylistOpen] = useState(false);
  const [addToPlaylistTargetIds, setAddToPlaylistTargetIds] = useState<string[]>([]);
  const [isSelectSongsOpen, setIsSelectSongsOpen] = useState(false);

  const [isLoadError, setIsLoadError] = useState(false);
  const errorShownRef = useRef(false);

  // Drag-to-reorder state for All Songs
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [hasCustomOrder, setHasCustomOrder] = useState(false);

  // Drag-to-reorder state for Playlist
  const [playlistDragIndex, setPlaylistDragIndex] = useState<number | null>(null);
  const [playlistDragOverIndex, setPlaylistDragOverIndex] = useState<number | null>(null);

  // Playlist Cover Image state
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  const { error, success } = useToast();
  const { playTrack, currentTrack, isPlaying, isBuffering, duration, closePlayer } = useMusicPlayer();

  const loadAudio = async () => {
    setTracks(prev => {
      if (prev.length === 0) setIsLoading(true);
      return prev;
    });
    setIsLoadError(false);
    errorShownRef.current = false;
    try {
      const [mediaRes, playlistRes] = await Promise.all([
        mediaApi.list({
          view: 'audio',
          search: searchQuery || undefined,
          limit: 200
        }).catch(err => {
          console.warn('[AudioPage] mediaApi.list error:', err);
          return { success: false, data: null };
        }),
        playlistApi.list().catch(err => {
          console.warn('[AudioPage] playlistApi.list error:', err);
          return { success: true, data: [] };
        })
      ]);

      if (mediaRes && mediaRes.success && mediaRes.data) {
        const items = mediaRes.data.items || [];
        if (!searchQuery) {
          try {
            localStorage.setItem(CACHE_KEY_AUDIO, JSON.stringify(items));
          } catch {}
        }
        // Apply saved custom order from localStorage
        const savedOrder = localStorage.getItem('memopix_audio_order');
        if (savedOrder) {
          try {
            const ids: string[] = JSON.parse(savedOrder);
            const ordered = [...items].sort((a, b) => {
              const ai = ids.indexOf(a.id);
              const bi = ids.indexOf(b.id);
              if (ai === -1 && bi === -1) return 0;
              if (ai === -1) return 1;
              if (bi === -1) return -1;
              return ai - bi;
            });
            setTracks(ordered);
            setHasCustomOrder(true);
          } catch {
            setTracks(items);
            setHasCustomOrder(false);
          }
        } else {
          setTracks(items);
          setHasCustomOrder(false);
        }
      } else if (!mediaRes?.success && !errorShownRef.current) {
        // Only show error toast once — not on every reloadTrigger
        errorShownRef.current = true;
        setIsLoadError(true);
        // Don't spam toast — just set error state
      }

      if (playlistRes && playlistRes.success && playlistRes.data) {
        setPlaylists(playlistRes.data);
      }
    } catch {
      if (!errorShownRef.current) {
        errorShownRef.current = true;
        setIsLoadError(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAudio();
  }, [searchQuery, reloadTrigger]);

  // ── Drag-to-Reorder Handlers ──────────────────────────────────────────────
  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === dropIndex) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }
    const newTracks = [...tracks];
    const [dragged] = newTracks.splice(dragIndex, 1);
    newTracks.splice(dropIndex, 0, dragged);
    setTracks(newTracks);
    const newOrder = newTracks.map(t => t.id);
    localStorage.setItem('memopix_audio_order', JSON.stringify(newOrder));
    setHasCustomOrder(true);
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleResetOrder = () => {
    localStorage.removeItem('memopix_audio_order');
    setHasCustomOrder(false);
    loadAudio();
  };

  // ── Playlist Drag-to-Reorder Handlers ─────────────────────────────────────
  const handlePlaylistDragStart = (index: number) => {
    setPlaylistDragIndex(index);
  };

  const handlePlaylistDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setPlaylistDragOverIndex(index);
  };

  const handlePlaylistDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (playlistDragIndex === null || playlistDragIndex === dropIndex || !selectedPlaylist?.tracks) {
      setPlaylistDragIndex(null);
      setPlaylistDragOverIndex(null);
      return;
    }

    const newTracks = [...selectedPlaylist.tracks];
    const [dragged] = newTracks.splice(playlistDragIndex, 1);
    newTracks.splice(dropIndex, 0, dragged);

    // Update locally for instant responsiveness
    setSelectedPlaylist({
      ...selectedPlaylist,
      tracks: newTracks
    });
    setPlaylistDragIndex(null);
    setPlaylistDragOverIndex(null);

    // Persist new order to backend
    try {
      const mediaIds = newTracks.map((t: any) => t.media.id);
      await playlistApi.reorder(selectedPlaylist.id, mediaIds);
      success('Playlist reordered successfully!');
    } catch {
      error('Failed to save playlist order.');
    }
  };

  // ── Playlist Cover Upload Handler ─────────────────────────────────────────
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedPlaylist) return;
    if (!file.type.startsWith('image/')) {
      error('Please select an image file (PNG, JPG, WebP).');
      return;
    }

    setIsUploadingCover(true);
    try {
      const res = await playlistApi.uploadCover(selectedPlaylist.id, file);
      if (res.success) {
        success('Playlist cover image updated!');
        const updated = await playlistApi.getById(selectedPlaylist.id);
        if (updated.success && updated.data) {
          setSelectedPlaylist(updated.data);
        }
        loadAudio();
      }
    } catch {
      error('Failed to upload cover image.');
    } finally {
      setIsUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  // ── Playlist Handlers ─────────────────────────────────────────────────────
  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistTitle.trim()) return;

    try {
      const res = await playlistApi.create({ title: newPlaylistTitle.trim() });
      if (res.success) {
        success(`Playlist "${newPlaylistTitle}" created!`);
        setNewPlaylistTitle('');
        setIsCreatingPlaylist(false);
        loadAudio();
      }
    } catch {
      error('Failed to create playlist.');
    }
  };

  const handleDeletePlaylist = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this playlist?')) return;
    try {
      await playlistApi.delete(id);
      success('Playlist deleted.');
      setSelectedPlaylist(null);
      loadAudio();
    } catch {
      error('Failed to delete playlist.');
    }
  };

  const handlePlayAll = (shuffle: boolean = false) => {
    if (tracks.length === 0) return;
    let list = [...tracks];
    if (shuffle) {
      list = list.sort(() => Math.random() - 0.5);
    }
    playTrack(list[0], list);
  };

  const handleDeleteTrack = async (e: React.MouseEvent, track: MediaItem) => {
    e.stopPropagation();
    const cleanName = track.originalName.replace(/\.[^/.]+$/, '');
    if (!window.confirm(`Are you sure you want to delete "${cleanName}"? It will be moved to Trash.`)) {
      return;
    }
    try {
      await mediaApi.trash(track.id);
      success(`Moved "${cleanName}" to Trash.`);
      if (currentTrack?.id === track.id) {
        closePlayer();
      }
      loadAudio();
    } catch {
      error('Failed to delete audio file.');
    }
  };

  const handleRemoveTrackFromPlaylist = async (mediaId: string, trackTitle: string) => {
    if (!selectedPlaylist) return;
    try {
      await playlistApi.removeTrack(selectedPlaylist.id, mediaId);
      success(`Removed "${trackTitle}" from playlist.`);
      const res = await playlistApi.getById(selectedPlaylist.id);
      if (res.success && res.data) {
        setSelectedPlaylist(res.data);
      }
      loadAudio();
    } catch {
      error('Failed to remove track from playlist.');
    }
  };

  const handlePlaylistSongsAdded = async () => {
    if (!selectedPlaylist) return;
    const res = await playlistApi.getById(selectedPlaylist.id);
    if (res.success && res.data) {
      setSelectedPlaylist(res.data);
    }
    loadAudio();
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-24">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              Music &amp; Audio Player
            </h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
              5 TB Cloud
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Stream your private music library across all your mobile phones and laptops
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {tracks.length > 0 && (
            <>
              <button
                onClick={() => handlePlayAll(true)}
                className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-bold rounded-xl active:scale-95 transition-all flex items-center gap-1.5"
              >
                <Shuffle className="w-4 h-4 text-purple-500" />
                <span>Shuffle</span>
              </button>
              {hasCustomOrder && (
                <button
                  onClick={handleResetOrder}
                  className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-bold rounded-xl active:scale-95 transition-all flex items-center gap-1.5"
                  title="Reset to original order"
                >
                  <RotateCcw className="w-4 h-4 text-gray-500" />
                  <span>Reset Order</span>
                </button>
              )}
            </>
          )}

          <button
            onClick={onOpenUpload}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-purple-500/20 active:scale-95 transition-all flex items-center gap-1.5"
          >
            <Music className="w-4 h-4" />
            <span>Upload Audio</span>
          </button>
        </div>
      </div>

      {/* Tabs: Tracks vs Playlists */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-[#26334D] pb-2">
        <button
          onClick={() => {
            setActiveTab('tracks');
            setSelectedPlaylist(null);
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'tracks' && !selectedPlaylist
              ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <Music className="w-4 h-4" />
          <span>All Songs ({tracks.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('playlists');
            setSelectedPlaylist(null);
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'playlists' || selectedPlaylist
              ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <ListMusic className="w-4 h-4" />
          <span>Playlists ({playlists.length})</span>
        </button>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <SkeletonLoader count={8} />
      ) : isLoadError ? (
        /* ── SERVER ERROR / WAKING STATE ─────────────────────────────────── */
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
            <Music className="w-8 h-8 text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-white mb-1">Server is waking up…</p>
            <p className="text-xs text-gray-400 max-w-xs">
              The backend server may be starting up. Please wait a moment and try again.
            </p>
          </div>
          <button
            onClick={() => { errorShownRef.current = false; loadAudio(); }}
            className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md active:scale-95 transition-all"
          >
            Retry
          </button>
        </div>
      ) : activeTab === 'tracks' ? (
        /* ── TRACKS LIST VIEW ────────────────────────────────────────────── */
        tracks.length === 0 ? (
          <EmptyState
            icon={Music}
            title={searchQuery ? 'No audio tracks found' : 'No music uploaded yet'}
            description={
              searchQuery
                ? `No audio files matching "${searchQuery}"`
                : 'Upload your MP3, WAV, FLAC, and AAC songs to your 5 TB private cloud.'
            }
            actionText="Upload Audio Track"
            onAction={onOpenUpload}
          />
        ) : (
          <div className="bg-white dark:bg-[#121824] border border-gray-200 dark:border-[#26334D] rounded-3xl overflow-hidden shadow-sm">
            <div className="divide-y divide-gray-100 dark:divide-gray-800/80">
              {/* Header bar: Select All & Drag hint */}
              <div className="px-4 py-2.5 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 bg-gray-50/70 dark:bg-[#161D2B]/70">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (selectedIds && selectedIds.length === tracks.length && tracks.length > 0) {
                        onSelectGroup([]);
                      } else {
                        onSelectGroup(tracks.map(t => t.id));
                      }
                    }}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-gray-200/60 dark:hover:bg-gray-800 transition-colors font-medium text-[11px]"
                    title={selectedIds && selectedIds.length === tracks.length ? 'Deselect all' : 'Select all'}
                  >
                    <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${
                      selectedIds && selectedIds.length === tracks.length && tracks.length > 0
                        ? 'bg-purple-600 border-purple-600 text-white'
                        : 'border-gray-400 dark:border-gray-500'
                    }`}>
                      {selectedIds && selectedIds.length === tracks.length && tracks.length > 0 && (
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      )}
                    </div>
                    <span>{selectedIds && selectedIds.length === tracks.length && tracks.length > 0 ? 'Deselect All' : 'Select All'}</span>
                  </button>

                  <span className="text-gray-300 dark:text-gray-700">|</span>

                  <span className="flex items-center gap-1 text-[11px] italic text-gray-400 dark:text-gray-500">
                    <GripVertical className="w-3 h-3" />
                    Drag rows to reorder
                  </span>
                </div>

                {selectedIds && selectedIds.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400">
                      {selectedIds.length} of {tracks.length} selected
                    </span>
                    <button
                      onClick={() => {
                        setAddToPlaylistTargetIds(selectedIds);
                        setIsAddToPlaylistOpen(true);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[11px] font-bold shadow-sm transition-all active:scale-95"
                    >
                      <ListPlus className="w-3.5 h-3.5" />
                      <span>Add to Playlist</span>
                    </button>
                  </div>
                )}
              </div>

              {tracks.map((track, index) => {
                const isCurrent = currentTrack?.id === track.id;
                const cleanName = track.originalName.replace(/\.[^/.]+$/, '');
                const isDragTarget = dragOverIndex === index && dragIndex !== index;
                const isDragging = dragIndex === index;
                const isSelected = selectedIds?.includes(track.id);

                return (
                  <div
                    key={track.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={() => { setDragIndex(null); setDragOverIndex(null); }}
                    onClick={() => playTrack(track, tracks)}
                    className={`flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3 cursor-pointer transition-colors group ${
                      isDragging
                        ? 'opacity-40 bg-purple-50 dark:bg-purple-950/20'
                        : isDragTarget
                        ? 'bg-purple-100/60 dark:bg-purple-900/20 border-t-2 border-purple-500'
                        : isSelected
                        ? 'bg-purple-50 dark:bg-purple-950/30 font-medium'
                        : isCurrent
                        ? 'bg-purple-50/80 dark:bg-purple-950/30 font-semibold'
                        : 'hover:bg-gray-50 dark:hover:bg-[#161D2B]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
                      {/* Checkbox for selection */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleSelect(track.id, e);
                        }}
                        className={`w-4 h-4 sm:w-5 sm:h-5 rounded-md border flex items-center justify-center transition-all flex-shrink-0 ${
                          isSelected
                            ? 'bg-purple-600 border-purple-600 text-white shadow-sm'
                            : 'border-gray-300 dark:border-gray-600 opacity-60 sm:opacity-0 group-hover:opacity-100 hover:border-purple-500'
                        }`}
                        title="Select track"
                      >
                        {isSelected && <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[3]" />}
                      </button>

                      {/* Drag Handle */}
                      <GripVertical
                        className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity -ml-1 hidden sm:block"
                        onClick={e => e.stopPropagation()}
                      />

                      {/* Play/Index Indicator */}
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300">
                        {isCurrent && isBuffering ? (
                          <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                        ) : isCurrent && isPlaying ? (
                          <Disc3 className="w-4 h-4 animate-spin-slow text-purple-600 dark:text-purple-400" />
                        ) : (
                          <span className="text-xs group-hover:hidden">{index + 1}</span>
                        )}
                        <Play className={`w-3.5 h-3.5 hidden group-hover:block ml-0.5 ${isCurrent ? 'text-purple-600' : ''}`} />
                      </div>

                      {/* Song Title & Meta */}
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs sm:text-sm truncate ${
                          isCurrent ? 'text-purple-600 dark:text-purple-400 font-bold' : 'text-gray-900 dark:text-white'
                        }`}>
                          {cleanName}
                        </p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                          {formatBytes(track.fileSize)} • MP3 Audio
                        </p>
                      </div>
                    </div>

                    {/* Right Side Actions: Favorite, Rename, Delete, Duration */}
                    <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 ml-2">
                      {/* Favorite Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onFavorite(track.id, !track.isFavorite);
                        }}
                        className={`p-1.5 rounded-lg transition-colors ${
                          track.isFavorite
                            ? 'text-red-500'
                            : 'text-gray-400 hover:text-red-400 opacity-70 sm:opacity-0 group-hover:opacity-100'
                        }`}
                        title={track.isFavorite ? 'Remove Favorite' : 'Favorite'}
                      >
                        <Heart className={`w-4 h-4 ${track.isFavorite ? 'fill-current' : ''}`} />
                      </button>

                      {/* Rename Button */}
                      {onRename && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRename(track);
                          }}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/30 opacity-70 sm:opacity-0 group-hover:opacity-100 transition-colors"
                          title="Rename song"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}

                      {/* Add to Playlist Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setAddToPlaylistTargetIds([track.id]);
                          setIsAddToPlaylistOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/30 opacity-70 sm:opacity-0 group-hover:opacity-100 transition-colors"
                        title="Add to Playlist"
                      >
                        <FolderPlus className="w-4 h-4 text-purple-500/80 hover:text-purple-600" />
                      </button>

                      {/* Download Audio Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadMediaFile(track);
                        }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/30 opacity-70 sm:opacity-0 group-hover:opacity-100 transition-colors flex items-center justify-center cursor-pointer active:scale-95"
                        title="Download song"
                      >
                        <Download className="w-4 h-4 text-purple-400 hover:text-purple-300" />
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={(e) => handleDeleteTrack(e, track)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 opacity-70 sm:opacity-0 group-hover:opacity-100 transition-colors"
                        title="Delete audio file"
                      >
                        <Trash2 className="w-4 h-4 text-red-500/70 hover:text-red-600" />
                      </button>

                      <span className="text-xs font-mono text-purple-600 dark:text-purple-400 font-medium hidden sm:block ml-1 min-w-[36px] text-right">
                        {track.duration ? formatDuration(track.duration) : isCurrent && duration > 0 ? formatDuration(duration) : '--:--'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )
      ) : (
        /* ── PLAYLISTS VIEW ──────────────────────────────────────────────── */
        selectedPlaylist ? (
          /* ── PLAYLIST DETAIL VIEW ─────────────────────────────────────── */
          <div className="space-y-6 animate-fade-in">
            {/* Back Button & Playlist Info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#121824] border border-gray-200 dark:border-[#26334D] p-5 sm:p-6 rounded-3xl shadow-sm">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSelectedPlaylist(null)}
                  className="p-2.5 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-2xl transition-colors active:scale-95"
                  title="Back to all playlists"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                {/* Playlist Cover Image with Upload Option */}
                <div className="relative group/cover w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden flex-shrink-0 shadow-lg border border-purple-500/20 bg-gradient-to-tr from-purple-600 to-indigo-600">
                  {selectedPlaylist.coverUrl ? (
                    <img
                      src={selectedPlaylist.coverUrl}
                      alt={selectedPlaylist.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white">
                      <Disc3 className="w-8 h-8 sm:w-10 sm:h-10 animate-spin-slow" />
                    </div>
                  )}

                  {/* Change Cover Button (Hover / Tap) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      coverInputRef.current?.click();
                    }}
                    disabled={isUploadingCover}
                    className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center opacity-0 group-hover/cover:opacity-100 transition-opacity text-white cursor-pointer"
                    title="Change Playlist Cover Image"
                  >
                    {isUploadingCover ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Camera className="w-5 h-5 text-purple-300" />
                        <span className="text-[9px] font-bold mt-0.5">Cover</span>
                      </>
                    )}
                  </button>

                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCoverUpload}
                    className="hidden"
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-950 px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-800">
                      Playlist
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mt-1 truncate">
                    {selectedPlaylist.title}
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {selectedPlaylist.tracks?.length || 0} {(selectedPlaylist.tracks?.length || 0) === 1 ? 'song' : 'songs'} in playlist
                  </p>
                </div>
              </div>

              {/* Action Buttons: Play All, Shuffle, + Add Songs, Delete */}
              <div className="flex items-center gap-2 flex-wrap sm:self-center">
                {selectedPlaylist.tracks && selectedPlaylist.tracks.length > 0 && (
                  <>
                    <button
                      onClick={() => {
                        const list = (selectedPlaylist.tracks || []).map((t: any) => t.media);
                        if (list.length > 0) playTrack(list[0], list);
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-500/20 active:scale-95"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>Play All</span>
                    </button>
                    <button
                      onClick={() => {
                        const list = (selectedPlaylist.tracks || []).map((t: any) => t.media);
                        const shuffled = [...list].sort(() => Math.random() - 0.5);
                        if (shuffled.length > 0) playTrack(shuffled[0], shuffled);
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-bold transition-all active:scale-95"
                    >
                      <Shuffle className="w-4 h-4 text-purple-500" />
                      <span>Shuffle</span>
                    </button>
                  </>
                )}

                {/* + Add Songs Button */}
                <button
                  onClick={() => setIsSelectSongsOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-500/20 active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Songs</span>
                </button>

                <button
                  onClick={() => handleDeletePlaylist(selectedPlaylist.id)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors"
                  title="Delete Playlist"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Tracks List inside Playlist */}
            {(!selectedPlaylist.tracks || selectedPlaylist.tracks.length === 0) ? (
              <EmptyState
                icon={ListMusic}
                title="This playlist has no songs yet"
                description="Add your favorite audio tracks to this playlist to stream them in order."
                actionText="Add Songs to Playlist"
                onAction={() => setIsSelectSongsOpen(true)}
              />
            ) : (
              <div className="bg-white dark:bg-[#121824] border border-gray-200 dark:border-[#26334D] rounded-3xl overflow-hidden shadow-sm divide-y divide-gray-100 dark:divide-gray-800/80">
                {/* Header bar: Reorder hint & Cover change button */}
                <div className="px-4 py-2.5 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 bg-gray-50/70 dark:bg-[#161D2B]/70 border-b border-gray-100 dark:border-gray-800">
                  <span className="flex items-center gap-1.5 text-[11px] font-medium text-purple-600 dark:text-purple-400">
                    <GripVertical className="w-3.5 h-3.5" />
                    Drag rows to reorder songs in playlist
                  </span>
                  <button
                    onClick={() => coverInputRef.current?.click()}
                    className="flex items-center gap-1 text-[11px] font-bold text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5 text-purple-500" />
                    <span>Upload Cover Image</span>
                  </button>
                </div>

                {selectedPlaylist.tracks.map((t: any, index: number) => {
                  const media = t.media;
                  const isCurrent = currentTrack?.id === media.id;
                  const cleanName = media.originalName.replace(/\.[^/.]+$/, '');
                  const list = (selectedPlaylist.tracks || []).map((x: any) => x.media);
                  const isDragTarget = playlistDragOverIndex === index && playlistDragIndex !== index;
                  const isDragging = playlistDragIndex === index;

                  return (
                    <div
                      key={t.id || media.id}
                      draggable
                      onDragStart={() => handlePlaylistDragStart(index)}
                      onDragOver={(e) => handlePlaylistDragOver(e, index)}
                      onDrop={(e) => handlePlaylistDrop(e, index)}
                      onClick={() => playTrack(media, list)}
                      className={`flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3 cursor-pointer transition-colors group ${
                        isDragging ? 'opacity-40 bg-purple-100/50 dark:bg-purple-950/50' : ''
                      } ${
                        isDragTarget ? 'border-t-2 border-purple-500 bg-purple-50/50 dark:bg-purple-950/20' : ''
                      } ${
                        isCurrent ? 'bg-purple-50/80 dark:bg-purple-950/30 font-semibold' : 'hover:bg-gray-50 dark:hover:bg-[#161D2B]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                        {/* Drag Handle */}
                        <div
                          className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-purple-500 dark:text-gray-600 dark:hover:text-purple-400 transition-colors flex-shrink-0"
                          title="Drag to reorder"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <GripVertical className="w-3.5 h-3.5" />
                        </div>

                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300">
                          {isCurrent && isPlaying ? (
                            <Disc3 className="w-4 h-4 animate-spin-slow text-purple-600 dark:text-purple-400" />
                          ) : (
                            <span className="text-xs group-hover:hidden">{index + 1}</span>
                          )}
                          <Play className={`w-3.5 h-3.5 hidden group-hover:block ml-0.5 ${isCurrent ? 'text-purple-600' : ''}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs sm:text-sm truncate ${
                            isCurrent ? 'text-purple-600 dark:text-purple-400 font-bold' : 'text-gray-900 dark:text-white'
                          }`}>
                            {cleanName}
                          </p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                            {formatBytes(media.fileSize)} • MP3 Audio
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        {/* Download Audio Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadMediaFile(media);
                          }}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/30 opacity-70 sm:opacity-0 group-hover:opacity-100 transition-colors flex items-center justify-center cursor-pointer active:scale-95"
                          title="Download song"
                        >
                          <Download className="w-4 h-4 text-purple-400 hover:text-purple-300" />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveTrackFromPlaylist(media.id, cleanName);
                          }}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 opacity-70 sm:opacity-0 group-hover:opacity-100 transition-colors"
                          title="Remove from playlist"
                        >
                          <Trash2 className="w-4 h-4 text-red-500/70 hover:text-red-600" />
                        </button>
                        <span className="text-xs font-mono text-gray-400 hidden sm:block ml-1">
                          {media.duration ? formatDuration(media.duration) : '--:--'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Playlists Grid */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">
                Your Playlists
              </h3>
              <button
                onClick={() => setIsCreatingPlaylist(true)}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Create Playlist</span>
              </button>
            </div>

            {/* Create Playlist Inline Form */}
            {isCreatingPlaylist && (
              <form onSubmit={handleCreatePlaylist} className="p-4 rounded-2xl bg-white dark:bg-[#121824] border border-purple-500/30 flex gap-2">
                <input
                  type="text"
                  placeholder="Playlist Name (e.g. Chill Beats, Gym Workout)..."
                  value={newPlaylistTitle}
                  onChange={e => setNewPlaylistTitle(e.target.value)}
                  className="flex-1 px-3 py-2 bg-gray-50 dark:bg-[#161D2B] border border-gray-200 dark:border-gray-800 rounded-xl text-xs outline-none focus:border-purple-500 text-gray-900 dark:text-white"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreatingPlaylist(false)}
                  className="px-3 py-2 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
              </form>
            )}

            {playlists.length === 0 ? (
              <EmptyState
                icon={ListMusic}
                title="No playlists created yet"
                description="Group your favorite audio tracks into custom playlists."
                actionText="Create First Playlist"
                onAction={() => setIsCreatingPlaylist(true)}
              />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {playlists.map((playlist) => (
                  <div
                    key={playlist.id}
                    onClick={async () => {
                      const res = await playlistApi.getById(playlist.id);
                      if (res.success && res.data) {
                        setSelectedPlaylist(res.data);
                      }
                    }}
                    className="p-4 rounded-3xl bg-white dark:bg-[#121824] border border-gray-200 dark:border-[#26334D] hover:border-purple-500/50 hover:shadow-lg transition-all cursor-pointer group"
                  >
                    <div className="w-full aspect-square rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center mb-3 shadow-md group-hover:scale-[1.02] transition-transform overflow-hidden relative">
                      {playlist.coverUrl ? (
                        <img
                          src={playlist.coverUrl}
                          alt={playlist.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Disc3 className="w-12 h-12 text-white group-hover:scale-110 transition-transform" />
                      )}
                    </div>
                    <h4 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white truncate">
                      {playlist.title}
                    </h4>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                      {playlist.trackCount} {playlist.trackCount === 1 ? 'Track' : 'Tracks'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      )}

      {/* Add To Playlist Modal (from All Songs row or multi-select) */}
      <AddToPlaylistModal
        isOpen={isAddToPlaylistOpen}
        onClose={() => {
          setIsAddToPlaylistOpen(false);
          setAddToPlaylistTargetIds([]);
        }}
        mediaIds={addToPlaylistTargetIds}
        onSuccess={loadAudio}
      />

      {/* Select Songs For Current Playlist Modal */}
      {selectedPlaylist && (
        <SelectSongsModal
          isOpen={isSelectSongsOpen}
          onClose={() => setIsSelectSongsOpen(false)}
          playlistId={selectedPlaylist.id}
          playlistTitle={selectedPlaylist.title}
          existingMediaIds={selectedPlaylist.tracks?.map((t: any) => t.media.id) || []}
          onSuccess={handlePlaylistSongsAdded}
        />
      )}
    </div>
  );
};
