import React, { useState, useEffect } from 'react';
import { Trash2, RotateCcw, AlertTriangle, Image as ImageIcon } from 'lucide-react';
import { MediaItem } from '../types';
import { mediaApi } from '../services/api';
import { MediaGrid } from '../components/MediaGrid';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { EmptyState } from '../components/EmptyState';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface TrashPageProps {
  selectedIds: string[];
  onToggleSelect: (id: string, e: React.MouseEvent) => void;
  onSelectGroup: (ids: string[]) => void;
  onClickMedia: (media: MediaItem, list: MediaItem[]) => void;
  reloadTrigger: number;
  onActionComplete: () => void;
}

export const TrashPage: React.FC<TrashPageProps> = ({
  selectedIds,
  onToggleSelect,
  onSelectGroup,
  onClickMedia,
  reloadTrigger,
  onActionComplete
}) => {
  const [trashItems, setTrashItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmEmptyOpen, setConfirmEmptyOpen] = useState(false);
  const { refreshStorage } = useAuth();
  const { success, error } = useToast();

  const loadTrash = async () => {
    setIsLoading(true);
    try {
      const res = await mediaApi.list({ view: 'trash', limit: 200 });
      if (res.success && res.data) {
        setTrashItems(res.data.items);
      }
    } catch {
      error('Failed to load trash.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTrash();
  }, [reloadTrigger]);

  const handleEmptyTrash = async () => {
    setConfirmEmptyOpen(false);
    try {
      await mediaApi.emptyTrash();
      success('Trash emptied successfully.');
      await refreshStorage();
      onActionComplete();
      loadTrash();
    } catch {
      error('Failed to empty trash.');
    }
  };

  const handleRestoreSelected = async () => {
    if (selectedIds.length === 0) return;
    try {
      await mediaApi.bulkAction('restore', selectedIds);
      success(`Restored ${selectedIds.length} item(s).`);
      onActionComplete();
      loadTrash();
    } catch {
      error('Failed to restore selected items.');
    }
  };

  const handleDeletePermanentSelected = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Permanently delete ${selectedIds.length} item(s)? This action cannot be undone.`)) return;
    try {
      await mediaApi.bulkAction('delete_permanent', selectedIds);
      success(`Permanently deleted ${selectedIds.length} item(s).`);
      await refreshStorage();
      onActionComplete();
      loadTrash();
    } catch {
      error('Failed to permanently delete items.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner & Controls */}
      <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 p-4 sm:p-5 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 rounded-2xl">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900 dark:text-white">
              Trash
            </h1>
            <p className="text-xs text-rose-700 dark:text-rose-300 font-medium">
              Items in trash are permanently deleted after 30 days.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {selectedIds.length > 0 ? (
            <>
              <button
                onClick={handleRestoreSelected}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-[#121824] hover:bg-gray-100 dark:hover:bg-[#1A2234] text-emerald-600 dark:text-emerald-400 border border-gray-200 dark:border-[#26334D] text-xs font-bold rounded-xl shadow-sm transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restore ({selectedIds.length})</span>
              </button>
              <button
                onClick={handleDeletePermanentSelected}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Permanently</span>
              </button>
            </>
          ) : (
            trashItems.length > 0 && (
              <button
                onClick={() => setConfirmEmptyOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Empty Trash</span>
              </button>
            )
          )}
        </div>
      </div>

      {isLoading ? (
        <SkeletonLoader count={12} />
      ) : trashItems.length === 0 ? (
        <EmptyState
          icon={Trash2}
          title="Trash is empty."
          description="Deleted items will appear here before being permanently removed after 30 days."
        />
      ) : (
        <MediaGrid
          media={trashItems}
          selectedIds={selectedIds}
          onToggleSelect={onToggleSelect}
          onSelectGroup={onSelectGroup}
          onClickMedia={item => onClickMedia(item, trashItems)}
        />
      )}

      {/* Confirm Empty Trash Dialog */}
      <ConfirmDialog
        isOpen={confirmEmptyOpen}
        title="Empty Trash?"
        message={`Are you sure you want to permanently delete all ${trashItems.length} item(s)? This will free up storage space, but cannot be undone.`}
        confirmText="Empty Trash Permanently"
        isDestructive
        onConfirm={handleEmptyTrash}
        onCancel={() => setConfirmEmptyOpen(false)}
      />
    </div>
  );
};
