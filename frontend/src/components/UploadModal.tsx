import React, { useState, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  UploadCloud,
  X,
  FileImage,
  FileVideo,
  FileAudio,
  FileText,
  File,
  FolderUp,
  Camera,
  Video,
  Music,
  CheckCircle2,
  AlertCircle,
  Pause,
  Play,
  RotateCcw,
  Trash2,
  Clock,
  Zap,
  Layers
} from 'lucide-react';
import { resumableUploader } from '../services/resumableUploader';
import { UploadQueueItem } from '../types';
import { formatBytes } from '../utils/formatters';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: () => void;
  folderId?: string | null;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onUploadComplete,
  folderId
}) => {
  const [queue, setQueue] = useState<UploadQueueItem[]>([]);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const photoLibraryInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const documentsInputRef = useRef<HTMLInputElement>(null);
  const reselectInputRef = useRef<HTMLInputElement>(null);
  const [reselectTargetId, setReselectTargetId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = resumableUploader.subscribe((items) => {
      setQueue(items);
      // If all items completed
      if (items.length > 0 && items.every(i => i.status === 'completed')) {
        onUploadComplete();
      }
    });
    return unsubscribe;
  }, [onUploadComplete]);

  // Handle files selection
  const handleFilesAdded = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length > 0) {
      resumableUploader.addFiles(fileArray, folderId);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        resumableUploader.addFiles(acceptedFiles, folderId);
      }
    },
    noClick: false
  });

  // Re-select file handler when browser session lost file handle
  const handleReselectClick = (id: string) => {
    setReselectTargetId(id);
    reselectInputRef.current?.click();
  };

  const handleReselectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && reselectTargetId) {
      resumableUploader.reselectFile(reselectTargetId, e.target.files[0]);
      setReselectTargetId(null);
      e.target.value = '';
    }
  };

  if (!isOpen) return null;

  const activeCount = queue.filter(q => q.status === 'uploading' || q.status === 'pending').length;
  const completedCount = queue.filter(q => q.status === 'completed').length;

  const getFileIcon = (mimeType: string, fileName: string) => {
    const lower = fileName.toLowerCase();
    if (mimeType.startsWith('image/')) return <FileImage className="w-5 h-5 text-emerald-500" />;
    if (mimeType.startsWith('video/') || lower.endsWith('.mp4') || lower.endsWith('.mov')) return <FileVideo className="w-5 h-5 text-blue-500" />;
    if (mimeType.startsWith('audio/') || lower.endsWith('.mp3') || lower.endsWith('.wav')) return <FileAudio className="w-5 h-5 text-purple-500" />;
    if (mimeType.includes('pdf') || lower.endsWith('.pdf') || lower.endsWith('.docx')) return <FileText className="w-5 h-5 text-amber-500" />;
    return <File className="w-5 h-5 text-gray-400" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      {/* Hidden File Inputs for Native Mobile & Desktop Pickers */}
      <input
        type="file"
        ref={folderInputRef}
        onChange={(e) => e.target.files && handleFilesAdded(e.target.files)}
        multiple
        // @ts-ignore
        webkitdirectory=""
        directory=""
        className="hidden"
      />
      <input
        type="file"
        ref={cameraInputRef}
        onChange={(e) => e.target.files && handleFilesAdded(e.target.files)}
        accept="image/*"
        capture="environment"
        className="hidden"
      />
      <input
        type="file"
        ref={videoInputRef}
        onChange={(e) => e.target.files && handleFilesAdded(e.target.files)}
        accept="video/*"
        capture="environment"
        className="hidden"
      />
      <input
        type="file"
        ref={photoLibraryInputRef}
        onChange={(e) => e.target.files && handleFilesAdded(e.target.files)}
        accept="image/*,video/*"
        multiple
        className="hidden"
      />
      <input
        type="file"
        ref={audioInputRef}
        onChange={(e) => e.target.files && handleFilesAdded(e.target.files)}
        accept="audio/*,.mp3,.wav,.m4a,.aac,.flac,.ogg"
        multiple
        className="hidden"
      />
      <input
        type="file"
        ref={documentsInputRef}
        onChange={(e) => e.target.files && handleFilesAdded(e.target.files)}
        multiple
        className="hidden"
      />
      <input
        type="file"
        ref={reselectInputRef}
        onChange={handleReselectChange}
        className="hidden"
      />

      <div className="bg-white dark:bg-[#121824] border border-gray-200 dark:border-[#26334D] rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 dark:border-[#26334D] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
                Resumable Cloud Upload
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300">
                  5 TB Quota
                </span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Chunked multipart transfer • Large video support • Auto-retry
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* 1. Drag & Drop Zone (Desktop & General) */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              isDragActive
                ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/20 scale-[0.99]'
                : 'border-gray-200 dark:border-gray-700/80 hover:border-purple-400 dark:hover:border-purple-600 bg-gray-50/50 dark:bg-[#161D2B]/40'
            }`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500/20 to-indigo-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <UploadCloud className="w-6 h-6 animate-bounce" />
              </div>
              <p className="font-bold text-sm text-gray-800 dark:text-gray-200">
                Drag & drop files or videos here, or <span className="text-purple-600 dark:text-purple-400 underline">browse</span>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Supports unlimited video size, photos, MP3 audio and documents
              </p>
            </div>
          </div>

          {/* 2. Fast Picker Buttons (Native Mobile & Desktop Quick Actions) */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 px-1">
              Select Upload Source
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => photoLibraryInputRef.current?.click()}
                className="flex items-center gap-2 p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#161D2B] hover:border-purple-500 hover:bg-purple-50/30 dark:hover:bg-purple-950/20 transition-all text-left"
              >
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <FileImage className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-800 dark:text-gray-200">Photo Library</p>
                  <p className="text-[10px] text-gray-400">Images & Photos</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                className="flex items-center gap-2 p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#161D2B] hover:border-purple-500 hover:bg-purple-50/30 dark:hover:bg-purple-950/20 transition-all text-left"
              >
                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Video className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-800 dark:text-gray-200">Videos & Movies</p>
                  <p className="text-[10px] text-gray-400">MP4 / Large Video</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => audioInputRef.current?.click()}
                className="flex items-center gap-2 p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#161D2B] hover:border-purple-500 hover:bg-purple-50/30 dark:hover:bg-purple-950/20 transition-all text-left"
              >
                <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <Music className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-800 dark:text-gray-200">Music & Audio</p>
                  <p className="text-[10px] text-gray-400">MP3 / WAV Songs</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => folderInputRef.current?.click()}
                className="flex items-center gap-2 p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#161D2B] hover:border-purple-500 hover:bg-purple-50/30 dark:hover:bg-purple-950/20 transition-all text-left"
              >
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <FolderUp className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-800 dark:text-gray-200">Upload Folder</p>
                  <p className="text-[10px] text-gray-400">All Files Inside</p>
                </div>
              </button>
            </div>
          </div>

          {/* 3. Upload Queue & Resumable Transfer Dashboard */}
          {queue.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-purple-500" />
                  Transfer Queue ({queue.length})
                </span>
                <button
                  type="button"
                  onClick={() => resumableUploader.clearCompleted()}
                  className="text-[11px] text-purple-600 dark:text-purple-400 hover:underline"
                >
                  Clear Completed
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {queue.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-[#161D2B]/80 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {getFileIcon(item.mimeType, item.fileName)}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                            {item.fileName}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400 font-mono">
                            <span>{formatBytes(item.fileSize)}</span>
                            {item.speed ? (
                              <span className="text-purple-500 font-semibold flex items-center gap-0.5">
                                <Zap className="w-3 h-3" />
                                {formatBytes(item.speed)}/s
                              </span>
                            ) : null}
                            {item.eta ? (
                              <span className="flex items-center gap-0.5">
                                <Clock className="w-3 h-3" />
                                {item.eta}s remaining
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      {/* Status & Actions */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {item.status === 'completed' && (
                          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            Done
                          </span>
                        )}

                        {item.status === 'uploading' && (
                          <button
                            type="button"
                            onClick={() => resumableUploader.pauseUpload(item.id)}
                            className="p-1.5 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200"
                            title="Pause"
                          >
                            <Pause className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {item.status === 'paused' && (
                          <button
                            type="button"
                            onClick={() => resumableUploader.resumeUpload(item.id)}
                            className="p-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white"
                            title="Resume"
                          >
                            <Play className="w-3.5 h-3.5 ml-0.5" />
                          </button>
                        )}

                        {item.status === 'needs_reselect' && (
                          <button
                            type="button"
                            onClick={() => handleReselectClick(item.id)}
                            className="px-2 py-1 bg-amber-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 hover:bg-amber-600"
                            title="Select file again to resume"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Resume File
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => resumableUploader.cancelUpload(item.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500"
                          title="Remove"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          item.status === 'completed'
                            ? 'bg-emerald-500'
                            : item.status === 'error'
                            ? 'bg-red-500'
                            : item.status === 'paused'
                            ? 'bg-amber-500'
                            : 'bg-gradient-to-r from-purple-500 to-indigo-600'
                        }`}
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>

                    {item.error && (
                      <p className="text-[10px] text-red-500 font-medium">
                        {item.error}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-gray-100 dark:border-[#26334D] bg-gray-50/50 dark:bg-[#161D2B]/50 flex items-center justify-between">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {activeCount > 0 ? (
              <span className="font-semibold text-purple-600 dark:text-purple-400">
                {activeCount} upload{activeCount > 1 ? 's' : ''} in progress...
              </span>
            ) : (
              <span>Ready for uploads • 5 TB Storage</span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-bold rounded-xl transition-all"
          >
            {activeCount > 0 ? 'Minimize' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
