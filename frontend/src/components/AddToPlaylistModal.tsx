import React, { useState, useEffect } from 'react';
import { X, ListMusic, Plus, Check, Music } from 'lucide-react';
import { playlistApi } from '../services/api';
import { Playlist } from '../types';
import { useToast } from '../context/ToastContext';

interface AddToPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaIds: string[];
  onSuccess?: () => void;
}

export const AddToPlaylistModal: React.FC<AddToPlaylistModalProps> = ({
  isOpen,
  onClose,
  mediaIds,
  onSuccess
}) => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const { success, error } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadPlaylists();
      setIsCreatingNew(false);
      setNewTitle('');
    }
  }, [isOpen]);

  const loadPlaylists = async () => {
    setIsLoading(true);
    try {
      const res = await playlistApi.list();
      if (res.success && res.data) {
        setPlaylists(res.data);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPlaylist = async (playlistId: string, playlistTitle: string) => {
    if (mediaIds.length === 0) return;
    setIsSaving(true);
    try {
      await playlistApi.addTracks(playlistId, mediaIds);
      success(`Added ${mediaIds.length} ${mediaIds.length === 1 ? 'song' : 'songs'} to "${playlistTitle}"!`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to add songs to playlist.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateAndAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || mediaIds.length === 0) return;
    setIsSaving(true);
    try {
      const res = await playlistApi.create({
        title: newTitle.trim(),
        mediaIds
      });
      if (res.success) {
        success(`Created playlist "${newTitle.trim()}" with ${mediaIds.length} ${mediaIds.length === 1 ? 'song' : 'songs'}!`);
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to create playlist.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in select-none">
      <div
        className="w-full max-w-md bg-white dark:bg-[#121824] rounded-3xl border border-gray-200 dark:border-[#26334D] shadow-2xl overflow-hidden animate-scale-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <ListMusic className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Add to Playlist
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {mediaIds.length} {mediaIds.length === 1 ? 'song' : 'songs'} selected
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

        {/* Content */}
        <div className="p-5 max-h-[60vh] overflow-y-auto space-y-4">
          {/* Create New Playlist option */}
          {!isCreatingNew ? (
            <button
              onClick={() => setIsCreatingNew(true)}
              className="w-full flex items-center gap-3 p-3 rounded-2xl border-2 border-dashed border-purple-500/30 hover:border-purple-500 bg-purple-500/5 hover:bg-purple-500/10 text-purple-600 dark:text-purple-400 transition-all font-semibold text-xs text-left"
            >
              <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-sm">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold">Create New Playlist</p>
                <p className="text-[11px] text-purple-600/70 dark:text-purple-400/70">
                  Name a new playlist and add these songs
                </p>
              </div>
            </button>
          ) : (
            <form onSubmit={handleCreateAndAdd} className="p-3.5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-500/30 space-y-2.5">
              <p className="text-xs font-bold text-gray-900 dark:text-white">
                New Playlist Name
              </p>
              <input
                type="text"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="e.g. Road Trip, Relaxing Mix..."
                autoFocus
                className="w-full px-3 py-2 bg-white dark:bg-[#161D2B] border border-purple-300 dark:border-purple-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white"
              />
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  disabled={isSaving || !newTitle.trim()}
                  className="flex-1 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                >
                  {isSaving ? 'Creating...' : 'Create & Add'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(false)}
                  className="px-3 py-1.5 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Existing Playlists List */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-gray-400">Loading playlists...</span>
            </div>
          ) : playlists.length === 0 && !isCreatingNew ? (
            <div className="text-center py-6 text-gray-400 text-xs">
              No playlists found. Create one above to add your songs!
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-1">
                Your Playlists
              </p>
              {playlists.map(pl => (
                <button
                  key={pl.id}
                  disabled={isSaving}
                  onClick={() => handleSelectPlaylist(pl.id, pl.title)}
                  className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-purple-50/80 dark:hover:bg-purple-950/30 border border-gray-100 dark:border-gray-800/80 transition-all text-left group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                      <Music className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate">
                        {pl.title}
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        {pl.trackCount} {pl.trackCount === 1 ? 'song' : 'songs'}
                      </p>
                    </div>
                  </div>
                  <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 group-hover:bg-purple-600 group-hover:text-white text-gray-400 flex items-center justify-center transition-colors">
                    <Plus className="w-4 h-4" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
