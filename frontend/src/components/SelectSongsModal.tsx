import React, { useState, useEffect } from 'react';
import { X, Search, Check, Music, Plus } from 'lucide-react';
import { MediaItem } from '../types';
import { mediaApi, playlistApi } from '../services/api';
import { formatBytes, formatDuration } from '../utils/formatters';
import { useToast } from '../context/ToastContext';

interface SelectSongsModalProps {
  isOpen: boolean;
  onClose: () => void;
  playlistId: string;
  playlistTitle: string;
  existingMediaIds?: string[];
  onSuccess: () => void;
}

export const SelectSongsModal: React.FC<SelectSongsModalProps> = ({
  isOpen,
  onClose,
  playlistId,
  playlistTitle,
  existingMediaIds = [],
  onSuccess
}) => {
  const [songs, setSongs] = useState<MediaItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { success, error } = useToast();

  useEffect(() => {
    if (isOpen) {
      setSelectedIds([]);
      setSearch('');
      loadSongs();
    }
  }, [isOpen]);

  const loadSongs = async () => {
    setIsLoading(true);
    try {
      const res = await mediaApi.list({
        view: 'audio',
        limit: 300
      });
      if (res.success && res.data) {
        setSongs(res.data.items || []);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleAddSelected = async () => {
    if (selectedIds.length === 0) return;
    setIsSaving(true);
    try {
      await playlistApi.addTracks(playlistId, selectedIds);
      success(`Added ${selectedIds.length} ${selectedIds.length === 1 ? 'song' : 'songs'} to "${playlistTitle}"!`);
      onSuccess();
      onClose();
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to add songs to playlist.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const existingSet = new Set(existingMediaIds);
  const filteredSongs = songs.filter(s => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return s.originalName.toLowerCase().includes(q);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in select-none">
      <div
        className="w-full max-w-lg bg-white dark:bg-[#121824] rounded-3xl border border-gray-200 dark:border-[#26334D] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-scale-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Add Songs to "{playlistTitle}"
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Select audio tracks from your 5 TB private library
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Filter */}
        <div className="px-5 pt-3 pb-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search audio tracks..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-[#161D2B] border border-gray-200 dark:border-gray-800 rounded-xl text-xs outline-none focus:border-purple-500 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Songs List */}
        <div className="flex-1 overflow-y-auto px-5 py-2 divide-y divide-gray-100 dark:divide-gray-800/60">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-gray-400">Loading audio library...</span>
            </div>
          ) : filteredSongs.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-400">
              {search ? 'No songs match your search.' : 'No audio tracks found in library.'}
            </div>
          ) : (
            filteredSongs.map(song => {
              const cleanName = song.originalName.replace(/\.[^/.]+$/, '');
              const isAlreadyIn = existingSet.has(song.id);
              const isSelected = selectedIds.includes(song.id);

              return (
                <div
                  key={song.id}
                  onClick={() => {
                    if (!isAlreadyIn) toggleSelect(song.id);
                  }}
                  className={`flex items-center justify-between py-2.5 px-2 rounded-xl transition-colors ${
                    isAlreadyIn
                      ? 'opacity-50 cursor-not-allowed bg-gray-50/50 dark:bg-gray-900/30'
                      : isSelected
                      ? 'bg-purple-50 dark:bg-purple-950/30 cursor-pointer'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800/40 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all flex-shrink-0 ${
                        isAlreadyIn
                          ? 'bg-gray-300 dark:bg-gray-700 border-transparent text-white'
                          : isSelected
                          ? 'bg-purple-600 border-purple-600 text-white'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      {(isAlreadyIn || isSelected) && (
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-semibold truncate ${
                        isSelected ? 'text-purple-600 dark:text-purple-400 font-bold' : 'text-gray-900 dark:text-white'
                      }`}>
                        {cleanName}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        {formatBytes(song.fileSize)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isAlreadyIn ? (
                      <span className="text-[10px] uppercase font-bold text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                        Already in playlist
                      </span>
                    ) : (
                      <span className="text-xs font-mono text-gray-400">
                        {song.duration ? formatDuration(song.duration) : ''}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Actions */}
        <div className="p-4 bg-gray-50 dark:bg-[#161D2B] border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
            {selectedIds.length} {selectedIds.length === 1 ? 'song' : 'songs'} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={selectedIds.length === 0 || isSaving}
              onClick={handleAddSelected}
              className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-purple-500/20 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>{isSaving ? 'Adding...' : `Add to Playlist (${selectedIds.length})`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
