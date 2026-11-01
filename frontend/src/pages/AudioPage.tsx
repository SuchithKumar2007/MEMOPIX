import React, { useState, useEffect } from 'react';
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
  Edit2
} from 'lucide-react';
import { MediaItem, Playlist } from '../types';
import { mediaApi, playlistApi } from '../services/api';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { EmptyState } from '../components/EmptyState';
import { useToast } from '../context/ToastContext';
import { useMusicPlayer } from '../context/MusicPlayerContext';
import { formatDuration, formatBytes } from '../utils/formatters';

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
  const [tracks, setTracks] = useState<MediaItem[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [newPlaylistTitle, setNewPlaylistTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Drag-to-reorder state
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [hasCustomOrder, setHasCustomOrder] = useState(false);

  const { error, success } = useToast();
  const { playTrack, currentTrack, isPlaying, isBuffering, closePlayer } = useMusicPlayer();

  const loadAudio = async () => {
    setIsLoading(true);
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
      } else if (!mediaRes?.success) {
        error('Failed to load audio library.');
      }

      if (playlistRes && playlistRes.success && playlistRes.data) {
        setPlaylists(playlistRes.data);
      }
    } catch {
      error('Failed to load audio library.');
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
                  <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400">
                    {selectedIds.length} of {tracks.length} selected
                  </span>
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

                      {/* Delete Button */}
                      <button
                        onClick={(e) => handleDeleteTrack(e, track)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 opacity-70 sm:opacity-0 group-hover:opacity-100 transition-colors"
                        title="Delete audio file"
                      >
                        <Trash2 className="w-4 h-4 text-red-500/70 hover:text-red-600" />
                      </button>

                      <span className="text-xs font-mono text-gray-400 hidden sm:block ml-1">
                        {track.duration ? formatDuration(track.duration) : '--:--'}
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
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">
              Your Playlists
            </h3>
            <button
              onClick={() => setIsCreatingPlaylist(true)}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all"
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
                      if (res.data.tracks && res.data.tracks.length > 0) {
                        const mediaList = res.data.tracks.map((t: any) => t.media);
                        playTrack(mediaList[0], mediaList);
                      }
                    }
                  }}
                  className="p-4 rounded-3xl bg-white dark:bg-[#121824] border border-gray-200 dark:border-[#26334D] hover:border-purple-500/50 hover:shadow-lg transition-all cursor-pointer group"
                >
                  <div className="w-full aspect-square rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center mb-3 shadow-md">
                    <Disc3 className="w-12 h-12 text-white group-hover:scale-110 transition-transform" />
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
      )}
    </div>
  );
};
