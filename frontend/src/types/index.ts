export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  createdAt: string;
}

export interface Folder {
  id: string;
  name: string;
  parentId?: string | null;
  color?: string | null;
  itemCount: number;
  filesCount: number;
  subfoldersCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface MediaItem {
  id: string;
  ownerId: string;
  folderId?: string | null;
  fileName: string;
  originalName: string;
  mimeType: string;
  category?: string | null;
  fileSize: number;
  fileHash: string;
  storagePath: string;
  thumbnailPath?: string | null;
  width?: number | null;
  height?: number | null;
  duration?: number | null;
  isFavorite: boolean;
  isArchived: boolean;
  isDeleted: boolean;
  deletedAt?: string | null;
  takenAt?: string | null;
  cameraModel?: string | null;
  createdAt: string;
  updatedAt: string;
  streamUrl: string;
  thumbnailUrl?: string | null;
  downloadUrl: string;
}

export interface Album {
  id: string;
  title: string;
  description?: string | null;
  itemCount: number;
  coverMedia?: MediaItem | null;
  createdAt: string;
  updatedAt: string;
  media?: MediaItem[];
}

export interface Playlist {
  id: string;
  title: string;
  description?: string | null;
  coverUrl?: string | null;
  trackCount: number;
  tracks?: Array<{
    id: string;
    position: number;
    addedAt: string;
    media: MediaItem;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface ShareLink {
  id: string;
  token: string;
  publicUrl: string;
  resourceType: 'media' | 'album';
  resourceName: string;
  expiresAt?: string | null;
  allowDownload: boolean;
  isActive: boolean;
  viewCount: number;
  createdAt: string;
}

export interface StorageStats {
  usedBytes: number;
  limitBytes: number;
  remainingBytes: number;
  percentageUsed: number;
  photosBytes: number;
  videosBytes: number;
  audioBytes?: number;
  otherBytes: number;
  totalFiles: number;
  totalPhotos: number;
  totalVideos: number;
  totalAudio?: number;
  formattedUsed: string;
  formattedLimit: string;
  formattedRemaining: string;
}

export interface UploadQueueItem {
  id: string;
  file: File;
  fileName: string;
  fileSize: number;
  mimeType: string;
  folderId?: string | null;
  progress: number;
  status: 'pending' | 'uploading' | 'paused' | 'completed' | 'error' | 'duplicate' | 'needs_reselect';
  sessionId?: string;
  chunkSize?: number;
  totalChunks?: number;
  uploadedParts?: number[];
  uploadedBytes?: number;
  speed?: number; // bytes per second
  eta?: number;   // seconds remaining
  error?: string;
  duplicateInfo?: any;
}
