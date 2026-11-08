import { uploadApi, mediaApi } from './api';
import { UploadQueueItem } from '../types';

const DB_NAME = 'memopix_resumable_db';
const DB_VERSION = 1;
const STORE_NAME = 'upload_sessions';

export interface StoredUploadMeta {
  id: string;
  sessionId?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  lastModified: number;
  chunkSize: number;
  totalChunks: number;
  uploadedParts: number[];
  uploadedBytes: number;
  folderId?: string | null;
  status: 'pending' | 'uploading' | 'paused' | 'completed' | 'error' | 'duplicate' | 'needs_reselect';
  error?: string;
  createdAt: number;
}

class ResumableUploader {
  private db: IDBDatabase | null = null;
  private activeFiles: Map<string, File> = new Map();
  private abortControllers: Map<string, AbortController> = new Map();
  private listeners: Set<(queue: UploadQueueItem[]) => void> = new Set();
  private items: Map<string, UploadQueueItem> = new Map();
  private isProcessing = false;

  constructor() {
    this.initDb().then(() => {
      this.restorePendingSessions();
    });
  }

  private async initDb(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        return reject(new Error('IndexedDB not supported'));
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  private async saveToDb(meta: StoredUploadMeta) {
    try {
      const db = await this.initDb();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(meta);
    } catch (e) {
      console.warn('[ResumableUploader] Failed to save meta to IndexedDB:', e);
    }
  }

  private async removeFromDb(id: string) {
    try {
      const db = await this.initDb();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(id);
    } catch (e) {}
  }

  private async getAllFromDb(): Promise<StoredUploadMeta[]> {
    try {
      const db = await this.initDb();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => resolve([]);
      });
    } catch {
      return [];
    }
  }

  private async restorePendingSessions() {
    const stored = await this.getAllFromDb();
    for (const s of stored) {
      if (s.status === 'completed') {
        this.removeFromDb(s.id);
        continue;
      }

      // Check if we already have it in items
      if (!this.items.has(s.id)) {
        const dummyFile = new File([], s.fileName, { type: s.mimeType });
        const item: UploadQueueItem = {
          id: s.id,
          file: dummyFile,
          fileName: s.fileName,
          fileSize: s.fileSize,
          mimeType: s.mimeType,
          folderId: s.folderId,
          progress: Math.min(100, Math.round(((s.uploadedParts.length * s.chunkSize) / s.fileSize) * 100)),
          status: 'needs_reselect', // Needs user to re-pick file since browser does not persist local file blobs
          sessionId: s.sessionId,
          chunkSize: s.chunkSize,
          totalChunks: s.totalChunks,
          uploadedParts: s.uploadedParts,
          uploadedBytes: s.uploadedBytes,
          error: 'Reopen upload: select file to resume'
        };
        this.items.set(s.id, item);
      }
    }
    this.notify();
  }

  public subscribe(listener: (queue: UploadQueueItem[]) => void) {
    this.listeners.add(listener);
    listener(this.getItems());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const list = this.getItems();
    this.listeners.forEach(fn => fn(list));
  }

  public getItems(): UploadQueueItem[] {
    return Array.from(this.items.values()).reverse();
  }

  /**
   * Adds files to upload queue
   */
  public async addFiles(files: File[], folderId?: string | null) {
    const newItems: UploadQueueItem[] = [];

    for (const file of files) {
      const id = `up_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      this.activeFiles.set(id, file);

      const chunkSize = 5 * 1024 * 1024; // 5 MB
      const totalChunks = Math.max(1, Math.ceil(file.size / chunkSize));

      const item: UploadQueueItem = {
        id,
        file,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || 'application/octet-stream',
        folderId: folderId || null,
        progress: 0,
        status: 'pending',
        chunkSize,
        totalChunks,
        uploadedParts: [],
        uploadedBytes: 0
      };

      this.items.set(id, item);
      newItems.push(item);

      await this.saveToDb({
        id,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || 'application/octet-stream',
        lastModified: file.lastModified,
        chunkSize,
        totalChunks,
        uploadedParts: [],
        uploadedBytes: 0,
        folderId,
        status: 'pending',
        createdAt: Date.now()
      });
    }

    this.notify();
    this.processQueue();
    return newItems;
  }

  /**
   * Re-links a user-selected file to an existing pending/needs_reselect job
   */
  public reselectFile(id: string, file: File) {
    const item = this.items.get(id);
    if (!item) return;

    if (file.name !== item.fileName || Math.abs(file.size - item.fileSize) > 1024) {
      item.error = `File does not match (${file.name} vs ${item.fileName})`;
      this.notify();
      return;
    }

    this.activeFiles.set(id, file);
    item.file = file;
    item.status = 'pending';
    item.error = undefined;
    this.notify();
    this.processQueue();
  }

  /**
   * Pauses an active upload
   */
  public pauseUpload(id: string) {
    const item = this.items.get(id);
    if (!item) return;

    const controller = this.abortControllers.get(id);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(id);
    }

    item.status = 'paused';
    this.saveToDb({
      id: item.id,
      sessionId: item.sessionId,
      fileName: item.fileName,
      fileSize: item.fileSize,
      mimeType: item.mimeType,
      lastModified: item.file.lastModified,
      chunkSize: item.chunkSize || 5242880,
      totalChunks: item.totalChunks || 1,
      uploadedParts: item.uploadedParts || [],
      uploadedBytes: item.uploadedBytes || 0,
      folderId: item.folderId,
      status: 'paused',
      createdAt: Date.now()
    });
    this.notify();
  }

  /**
   * Resumes a paused upload
   */
  public resumeUpload(id: string) {
    const item = this.items.get(id);
    if (!item) return;

    item.status = 'pending';
    item.error = undefined;
    this.notify();
    this.processQueue();
  }

  /**
   * Cancels and deletes an upload
   */
  public async cancelUpload(id: string) {
    const item = this.items.get(id);
    if (!item) return;

    const controller = this.abortControllers.get(id);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(id);
    }

    if (item.sessionId) {
      try {
        await uploadApi.abort(item.sessionId);
      } catch {}
    }

    this.activeFiles.delete(id);
    this.items.delete(id);
    await this.removeFromDb(id);
    this.notify();
  }

  public clearCompleted() {
    for (const [id, item] of this.items.entries()) {
      if (item.status === 'completed' || item.status === 'error' || item.status === 'needs_reselect' || item.status === 'duplicate') {
        this.items.delete(id);
        this.activeFiles.delete(id);
        this.removeFromDb(id);
      }
    }
    this.notify();
  }

  /** Rename a pending/paused/needs_reselect item before it is uploaded */
  public renameQueueItem(id: string, newName: string) {
    const item = this.items.get(id);
    if (!item) return;
    const trimmed = newName.trim();
    if (!trimmed) return;
    item.fileName = trimmed;
    // Also update IndexedDB meta
    this.saveToDb({
      id: item.id,
      sessionId: item.sessionId,
      fileName: trimmed,
      fileSize: item.fileSize,
      mimeType: item.mimeType,
      lastModified: item.file ? item.file.lastModified : Date.now(),
      chunkSize: item.chunkSize || 5242880,
      totalChunks: item.totalChunks || 1,
      uploadedParts: item.uploadedParts || [],
      uploadedBytes: item.uploadedBytes || 0,
      folderId: item.folderId,
      status: item.status,
      createdAt: Date.now()
    });
    this.notify();
  }

  /**
   * Processes the upload queue sequentially or concurrently
   */
  private async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      for (const item of this.items.values()) {
        if (item.status === 'pending') {
          await this.uploadItem(item);
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private async uploadItem(item: UploadQueueItem) {
    const file = this.activeFiles.get(item.id);
    if (!file || file.size === 0) {
      item.status = 'needs_reselect';
      item.error = 'File reference required. Please re-select the file to resume.';
      this.notify();
      return;
    }

    item.status = 'uploading';
    item.error = undefined;
    this.notify();

    // Fast direct single-stream upload for files <= 25MB (photos, music, audio, short videos)
    if (file.size <= 25 * 1024 * 1024 && !item.sessionId) {
      try {
        const res = await mediaApi.upload(
          file,
          false,
          (pct) => {
            item.progress = pct;
            item.uploadedBytes = Math.round((pct / 100) * file.size);
            this.notify();
          },
          item.folderId
        );

        if (res?.data?.duplicateDetected) {
          item.status = 'duplicate';
          item.duplicateInfo = res.data.existingMedia;
          item.error = 'Duplicate file detected';
          this.notify();
          return;
        }

        item.status = 'completed';
        item.progress = 100;
        item.uploadedBytes = file.size;
        // Remove from DB (direct upload complete, no session to resume)
        await this.removeFromDb(item.id).catch(() => {});
        this.notify();
        return;
      } catch (directErr: any) {
        console.warn('[DirectUploadFallback] Direct upload failed, falling back to chunked:', directErr);
      }
    }

    try {
      // 1. Initiate session on backend if not initiated yet
      if (!item.sessionId) {
        const initRes = await uploadApi.initiate({
          fileName: item.fileName,
          fileSize: item.fileSize,
          mimeType: item.mimeType,
          chunkSize: item.chunkSize,
          folderId: item.folderId,
          deviceInfo: navigator.userAgent
        });

        if (initRes.data?.duplicateDetected) {
          item.status = 'duplicate';
          item.duplicateInfo = initRes.data.existingMedia;
          item.error = 'Duplicate file detected';
          this.notify();
          return;
        }

        item.sessionId = initRes.data.sessionId;
        item.chunkSize = initRes.data.chunkSize || item.chunkSize;
        item.totalChunks = initRes.data.totalChunks || item.totalChunks;
        item.uploadedParts = initRes.data.uploadedParts || [];
      } else {
        // Query status to get latest uploaded parts from server
        try {
          const statusRes = await uploadApi.getStatus(item.sessionId);
          item.uploadedParts = statusRes.data.uploadedParts || [];
        } catch {}
      }

      const chunkSize = item.chunkSize || 5 * 1024 * 1024;
      const totalChunks = item.totalChunks || Math.ceil(file.size / chunkSize);
      const uploadedPartsSet = new Set(item.uploadedParts || []);

      let totalUploadedBytes = Array.from(uploadedPartsSet).length * chunkSize;
      let lastSpeedCalcTime = Date.now();
      let bytesUploadedInInterval = 0;

      // 2. Upload missing chunks
      for (let partNumber = 1; partNumber <= totalChunks; partNumber++) {
        const liveStatus = this.items.get(item.id)?.status;
        if (liveStatus === 'paused' || liveStatus === 'error') {
          return;
        }

        if (uploadedPartsSet.has(partNumber)) {
          continue;
        }

        const start = (partNumber - 1) * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunkBlob = file.slice(start, end);

        // Upload chunk with auto-retry
        let attempts = 0;
        let success = false;
        let lastError = '';

        while (attempts < 4 && !success) {
          if (this.items.get(item.id)?.status === 'paused') return;

          attempts++;
          try {
            await uploadApi.uploadChunk(
              item.sessionId!,
              partNumber,
              chunkBlob,
              (loaded) => {
                // Live chunk progress
                const currentBytes = totalUploadedBytes + loaded;
                item.progress = Math.min(99, Math.round((currentBytes / file.size) * 100));
                
                // Speed & ETA
                const now = Date.now();
                const deltaMs = now - lastSpeedCalcTime;
                if (deltaMs >= 1000) {
                  const bytesSec = (bytesUploadedInInterval / deltaMs) * 1000;
                  item.speed = Math.round(bytesSec);
                  const remainingBytes = file.size - currentBytes;
                  item.eta = bytesSec > 0 ? Math.round(remainingBytes / bytesSec) : 0;
                  lastSpeedCalcTime = now;
                  bytesUploadedInInterval = 0;
                } else {
                  bytesUploadedInInterval += loaded;
                }
                this.notify();
              }
            );

            success = true;
            uploadedPartsSet.add(partNumber);
            item.uploadedParts = Array.from(uploadedPartsSet);
            totalUploadedBytes += (end - start);

            // Persist progress to IndexedDB
            await this.saveToDb({
              id: item.id,
              sessionId: item.sessionId,
              fileName: item.fileName,
              fileSize: item.fileSize,
              mimeType: item.mimeType,
              lastModified: file.lastModified,
              chunkSize,
              totalChunks,
              uploadedParts: item.uploadedParts,
              uploadedBytes: totalUploadedBytes,
              folderId: item.folderId,
              status: 'uploading',
              createdAt: Date.now()
            });
          } catch (err: any) {
            lastError = err.response?.data?.message || err.message || 'Network interruption';
            if (err.response?.status === 413) {
              // Quota exceeded: do not retry
              item.status = 'error';
              item.error = lastError;
              this.notify();
              return;
            }
            // Exponential backoff wait (1s, 2s, 4s)
            await new Promise(r => setTimeout(r, Math.pow(2, attempts) * 500));
          }
        }

        if (!success) {
          item.status = 'error';
          item.error = `Failed part ${partNumber}: ${lastError}`;
          this.notify();
          return;
        }
      }

      // 3. Finalize upload
      item.progress = 100;
      item.status = 'uploading';
      this.notify();

      await uploadApi.complete(item.sessionId!);
      item.status = 'completed';
      item.speed = 0;
      item.eta = 0;
      await this.removeFromDb(item.id);
      this.notify();
    } catch (err: any) {
      item.status = 'error';
      item.error = err.response?.data?.message || err.message || 'Upload failed';
      this.notify();
    }
  }
}

export const resumableUploader = new ResumableUploader();
