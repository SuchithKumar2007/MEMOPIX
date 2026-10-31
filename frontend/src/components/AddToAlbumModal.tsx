import React, { useState, useEffect } from 'react';
import { X, FolderPlus, Check, Plus } from 'lucide-react';
import { albumApi } from '../services/api';
import { Album } from '../types';
import { useToast } from '../context/ToastContext';

interface AddToAlbumModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaIds: string[];
  onSuccess: () => void;
}

export const AddToAlbumModal: React.FC<AddToAlbumModalProps> = ({
  isOpen,
  onClose,
  mediaIds,
  onSuccess
}) => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { success, error } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadAlbums();
    }
  }, [isOpen]);

  const loadAlbums = async () => {
    setIsLoading(true);
    try {
      const res = await albumApi.list();
      if (res.success && res.data) {
        setAlbums(res.data);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAlbum = async (albumId: string) => {
    setIsSaving(true);
    try {
      await albumApi.addMedia(albumId, mediaIds);
      success(`Added ${mediaIds.length} item(s) to album.`);
      onSuccess();
      onClose();
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to add items to album.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#121824] border border-gray-200 dark:border-[#26334D] rounded-3xl max-w-md w-full p-6 shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-500">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-gray-900 dark:text-white">
                Add to Album
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {mediaIds.length} selected item(s)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto pr-1 my-4">
          {isLoading ? (
            <p className="text-center py-6 text-xs text-gray-400">Loading albums...</p>
          ) : albums.length === 0 ? (
            <p className="text-center py-6 text-xs text-gray-400">
              No albums created yet.
            </p>
          ) : (
            albums.map(album => (
              <button
                key={album.id}
                disabled={isSaving}
                onClick={() => handleSelectAlbum(album.id)}
                className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-[#1A2234] hover:bg-brand-50/50 dark:hover:bg-brand-950/30 border border-gray-200 dark:border-[#26334D] hover:border-brand-500/50 rounded-2xl transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-[#26334D] flex items-center justify-center text-brand-500 overflow-hidden shrink-0">
                    {album.coverMedia ? (
                      <img
                        src={album.coverMedia.thumbnailUrl || album.coverMedia.streamUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FolderPlus className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-brand-500 transition-colors">
                      {album.title}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      {album.itemCount} items
                    </p>
                  </div>
                </div>
                <Plus className="w-4 h-4 text-gray-400 group-hover:text-brand-500 transition-colors" />
              </button>
            ))
          )}
        </div>

        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1A2234] rounded-xl transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
