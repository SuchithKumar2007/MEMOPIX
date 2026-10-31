import React, { useState } from 'react';
import { X, FolderPlus } from 'lucide-react';
import { albumApi } from '../services/api';
import { useToast } from '../context/ToastContext';

interface CreateAlbumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAlbumCreated: () => void;
  initialMediaIds?: string[];
}

export const CreateAlbumModal: React.FC<CreateAlbumModalProps> = ({
  isOpen,
  onClose,
  onAlbumCreated,
  initialMediaIds
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { success, error } = useToast();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      error('Album title is required.');
      return;
    }

    setIsLoading(true);
    try {
      await albumApi.create({
        title: title.trim(),
        description: description.trim() || undefined,
        mediaIds: initialMediaIds
      });
      success('Album created successfully!');
      setTitle('');
      setDescription('');
      onAlbumCreated();
      onClose();
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to create album.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#121824] border border-gray-200 dark:border-[#26334D] rounded-3xl max-w-md w-full p-6 shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-500">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-gray-900 dark:text-white">
                New Album
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Organize your memories into collections
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5 block">
              Album Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Vacation 2026, Family, College"
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#1A2234] border border-gray-200 dark:border-[#26334D] focus:border-brand-500 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5 block">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              placeholder="Add details about this collection..."
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#1A2234] border border-gray-200 dark:border-[#26334D] focus:border-brand-500 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all resize-none"
            />
          </div>

          {initialMediaIds && initialMediaIds.length > 0 && (
            <p className="text-xs font-medium text-brand-600 dark:text-brand-400">
              ✓ {initialMediaIds.length} selected items will be added to this album.
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1A2234] rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 active:scale-95 text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-500/25 transition-all disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create Album'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
