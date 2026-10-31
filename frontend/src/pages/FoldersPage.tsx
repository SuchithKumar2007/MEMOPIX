import React, { useState, useEffect } from 'react';
import {
  Folder as FolderIcon,
  FolderPlus,
  ChevronRight,
  UploadCloud,
  File,
  FileImage,
  FileVideo,
  FileAudio,
  Trash2,
  MoreVertical,
  ArrowLeft
} from 'lucide-react';
import { Folder, MediaItem } from '../types';
import { folderApi, mediaApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { EmptyState } from '../components/EmptyState';
import { formatBytes, formatDate } from '../utils/formatters';

interface FoldersPageProps {
  onOpenUpload: (folderId?: string | null) => void;
  onClickMedia: (media: MediaItem, list: MediaItem[]) => void;
  reloadTrigger: number;
}

export const FoldersPage: React.FC<FoldersPageProps> = ({
  onOpenUpload,
  onClickMedia,
  reloadTrigger
}) => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);
  const [folderFiles, setFolderFiles] = useState<MediaItem[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const { success, error } = useToast();

  const loadCurrentView = async () => {
    setIsLoading(true);
    try {
      if (currentFolder) {
        const [folderDetails, filesRes] = await Promise.all([
          folderApi.getById(currentFolder.id),
          mediaApi.list({ folderId: currentFolder.id, view: 'files', limit: 100 })
        ]);
        if (filesRes.success && filesRes.data) {
          setFolderFiles(filesRes.data.items || []);
        }
        if (folderDetails.success && folderDetails.data?.children) {
          setFolders(folderDetails.data.children);
        }
      } else {
        const [rootFoldersRes, rootFilesRes] = await Promise.all([
          folderApi.list(null),
          mediaApi.list({ folderId: null, view: 'files', limit: 100 })
        ]);
        if (rootFoldersRes.success) {
          setFolders(rootFoldersRes.data || []);
        }
        if (rootFilesRes.success && rootFilesRes.data) {
          setFolderFiles(rootFilesRes.data.items || []);
        }
      }
    } catch {
      error('Failed to load folders.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCurrentView();
  }, [currentFolder, reloadTrigger]);

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      const res = await folderApi.create({
        name: newFolderName.trim(),
        parentId: currentFolder?.id || null
      });
      if (res.success) {
        success(`Folder "${newFolderName}" created!`);
        setNewFolderName('');
        setIsCreating(false);
        loadCurrentView();
      }
    } catch {
      error('Failed to create folder.');
    }
  };

  const handleDeleteFolder = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this folder? (Files inside will be kept in Root)')) return;

    try {
      await folderApi.delete(id);
      success('Folder deleted.');
      if (currentFolder?.id === id) {
        navigateBack();
      } else {
        loadCurrentView();
      }
    } catch {
      error('Failed to delete folder.');
    }
  };

  const navigateToFolder = (folder: Folder) => {
    setBreadcrumbs(prev => [...prev, folder]);
    setCurrentFolder(folder);
  };

  const navigateBack = () => {
    if (breadcrumbs.length <= 1) {
      setBreadcrumbs([]);
      setCurrentFolder(null);
    } else {
      const newCrumbs = breadcrumbs.slice(0, -1);
      setBreadcrumbs(newCrumbs);
      setCurrentFolder(newCrumbs[newCrumbs.length - 1]);
    }
  };

  const navigateToCrumb = (index: number) => {
    if (index === -1) {
      setBreadcrumbs([]);
      setCurrentFolder(null);
    } else {
      const target = breadcrumbs[index];
      setBreadcrumbs(breadcrumbs.slice(0, index + 1));
      setCurrentFolder(target);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              Cloud Files & Folders
            </h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              5 TB Storage
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Organize documents, projects, and media in synchronized cloud directories
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCreating(true)}
            className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-bold rounded-xl active:scale-95 transition-all flex items-center gap-1.5"
          >
            <FolderPlus className="w-4 h-4 text-indigo-500" />
            <span>New Folder</span>
          </button>

          <button
            onClick={() => onOpenUpload(currentFolder?.id || null)}
            className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-500/20 active:scale-95 transition-all flex items-center gap-1.5"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Here</span>
          </button>
        </div>
      </div>

      {/* Breadcrumbs Navigation */}
      <div className="flex items-center gap-1.5 px-4 py-2.5 bg-white dark:bg-[#121824] border border-gray-200 dark:border-[#26334D] rounded-2xl overflow-x-auto text-xs">
        <button
          onClick={() => navigateToCrumb(-1)}
          className={`font-bold hover:text-indigo-600 transition-colors ${
            !currentFolder ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          Root Storage
        </button>

        {breadcrumbs.map((b, idx) => (
          <React.Fragment key={b.id}>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <button
              onClick={() => navigateToCrumb(idx)}
              className={`font-bold hover:text-indigo-600 transition-colors truncate max-w-[120px] ${
                idx === breadcrumbs.length - 1 ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {b.name}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Inline Create Folder Form */}
      {isCreating && (
        <form onSubmit={handleCreateFolder} className="p-4 rounded-2xl bg-white dark:bg-[#121824] border border-indigo-500/40 flex gap-2">
          <input
            type="text"
            placeholder="Folder name (e.g. Work Documents, Family Trip, Project Files)..."
            value={newFolderName}
            onChange={e => setNewFolderName(e.target.value)}
            className="flex-1 px-3 py-2 bg-gray-50 dark:bg-[#161D2B] border border-gray-200 dark:border-gray-800 rounded-xl text-xs outline-none focus:border-indigo-500 text-gray-900 dark:text-white"
            autoFocus
          />
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl"
          >
            Create
          </button>
          <button
            type="button"
            onClick={() => setIsCreating(false)}
            className="px-3 py-2 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-xl"
          >
            Cancel
          </button>
        </form>
      )}

      {/* Main Content: Folders & Files */}
      {isLoading ? (
        <SkeletonLoader count={8} />
      ) : folders.length === 0 && folderFiles.length === 0 ? (
        <EmptyState
          icon={FolderIcon}
          title={currentFolder ? `Folder "${currentFolder.name}" is empty` : 'No files or folders yet'}
          description="Upload files or create subfolders to start organizing your 5 TB private cloud."
          actionText="Upload Files Here"
          onAction={() => onOpenUpload(currentFolder?.id || null)}
        />
      ) : (
        <div className="space-y-6">
          {/* Subfolders Grid */}
          {folders.length > 0 && (
            <div className="space-y-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 px-1">
                Folders ({folders.length})
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                {folders.map(f => (
                  <div
                    key={f.id}
                    onClick={() => navigateToFolder(f)}
                    className="p-4 rounded-2xl bg-white dark:bg-[#121824] border border-gray-200 dark:border-[#26334D] hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer group flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex-shrink-0 group-hover:scale-105 transition-transform">
                        <FolderIcon className="w-5 h-5 fill-current" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate">
                          {f.name}
                        </h4>
                        <p className="text-[10px] text-gray-400">
                          {f.itemCount} item{f.itemCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleDeleteFolder(f.id, e)}
                      className="p-1.5 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete Folder"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Files List / Grid */}
          {folderFiles.length > 0 && (
            <div className="space-y-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 px-1">
                Files ({folderFiles.length})
              </span>

              <div className="bg-white dark:bg-[#121824] border border-gray-200 dark:border-[#26334D] rounded-3xl overflow-hidden divide-y divide-gray-100 dark:divide-gray-800/80">
                {folderFiles.map(file => {
                  const isImage = file.mimeType.startsWith('image/');
                  const isVideo = file.mimeType.startsWith('video/');
                  const isAudio = file.mimeType.startsWith('audio/');

                  return (
                    <div
                      key={file.id}
                      onClick={() => onClickMedia(file, folderFiles)}
                      className="flex items-center justify-between px-4 py-3 sm:px-6 hover:bg-gray-50 dark:hover:bg-[#161D2B] cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-gray-100 dark:bg-gray-800">
                          {isImage ? (
                            <FileImage className="w-4 h-4 text-emerald-500" />
                          ) : isVideo ? (
                            <FileVideo className="w-4 h-4 text-blue-500" />
                          ) : isAudio ? (
                            <FileAudio className="w-4 h-4 text-purple-500" />
                          ) : (
                            <File className="w-4 h-4 text-gray-400" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {file.originalName}
                          </p>
                          <p className="text-[11px] text-gray-400">
                            {formatBytes(file.fileSize)} • {formatDate(file.createdAt)}
                          </p>
                        </div>
                      </div>

                      <a
                        href={file.downloadUrl}
                        download
                        onClick={e => e.stopPropagation()}
                        className="px-3 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-[11px] font-bold rounded-lg transition-colors"
                      >
                        Download
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
