import React, { useState, useEffect } from 'react';
import { X, Pencil, FileText } from 'lucide-react';
import { MediaItem } from '../types';

interface RenameModalProps {
  isOpen: boolean;
  media: MediaItem | null;
  onClose: () => void;
  onSave: (id: string, newName: string) => Promise<void>;
}

export const RenameModal: React.FC<RenameModalProps> = ({
  isOpen,
  media,
  onClose,
  onSave
}) => {
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (media) {
      setName(media.originalName || media.fileName || '');
    }
  }, [media]);

  if (!isOpen || !media) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || trimmed === media.originalName) {
      onClose();
      return;
    }

    setIsSaving(true);
    try {
      await onSave(media.id, trimmed);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-[#121824] border border-gray-200 dark:border-[#26334D] rounded-3xl p-6 shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-950/80 text-brand-600 dark:text-brand-300 flex items-center justify-center">
              <Pencil className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-gray-900 dark:text-white">
                Rename File
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Change the filename in your 5 TB cloud
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl hover:bg-gray-100 dark:hover:bg-[#1A2234] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              File Name
            </label>
            <div className="relative flex items-center">
              <FileText className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                autoFocus
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Enter new file name..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-[#1A2234] border border-gray-300 dark:border-[#26334D] focus:border-brand-500 rounded-xl text-sm text-gray-900 dark:text-white outline-none transition-colors"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 bg-gray-100 dark:bg-[#1A2234] hover:bg-gray-200 dark:hover:bg-[#26334D] text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !name.trim()}
              className="px-5 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-500/25 transition-all active:scale-95 flex items-center gap-1.5"
            >
              {isSaving ? 'Saving...' : 'Save Name'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
