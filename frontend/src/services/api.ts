import axios from 'axios';

export const getApiBase = (): string => {
  const customUrl = typeof window !== 'undefined' ? localStorage.getItem('memopix_custom_backend_url') : null;
  if (customUrl && customUrl.trim()) {
    const clean = customUrl.trim().replace(/\/$/, '');
    return clean.endsWith('/api') ? clean : `${clean}/api`;
  }
  const rawBackend = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL;
  if (rawBackend && rawBackend.trim()) {
    const clean = rawBackend.trim().replace(/\/$/, '');
    return clean.endsWith('/api') ? clean : `${clean}/api`;
  }

  // Capacitor Native Android/iOS or mobile WebViews running on localhost/capacitor origin
  if (typeof window !== 'undefined') {
    const isCapacitor =
      (window as any).Capacitor !== undefined ||
      window.location.protocol === 'capacitor:' ||
      (window.location.hostname === 'localhost' && window.location.port === '') ||
      window.navigator.userAgent.includes('Capacitor') ||
      window.navigator.userAgent.includes('wv');
    if (isCapacitor) {
      return 'https://memopix-backend.onrender.com/api';
    }
  }

  // Production web (e.g. Vercel deployment)
  if (import.meta.env.PROD) {
    return 'https://memopix-backend.onrender.com/api';
  }

  return '/api';
};

/**
 * Resolves relative media URLs (/api/media/stream/...) to direct backend origin,
 * bypassing serverless proxy limits and ensuring reliable audio/video streaming on web & mobile APK.
 */
export const resolveMediaUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('blob:') ||
    url.startsWith('data:')
  ) {
    return url;
  }

  const apiBase = getApiBase();
  let baseOrigin = 'https://memopix-backend.onrender.com';
  if (apiBase.startsWith('http://') || apiBase.startsWith('https://')) {
    baseOrigin = apiBase.endsWith('/api') ? apiBase.slice(0, -4) : apiBase;
  } else if (typeof window !== 'undefined' && window.location.origin && window.location.port) {
    baseOrigin = window.location.origin;
  }

  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${baseOrigin}${cleanPath}`;
};

export const API_BASE = getApiBase();

const api = axios.create({
  baseURL: API_BASE,
  timeout: 60000, // 60 seconds (covers Render cold-start spinup)
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach Authorization Bearer token and dynamic baseURL from localStorage/environment
api.interceptors.request.use(config => {
  config.baseURL = getApiBase();
  const token = localStorage.getItem('memopix_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor with automatic single retry for cold-start 502/503/504 or timeout
api.interceptors.response.use(
  response => response,
  async error => {
    const config = error.config;
    if (
      config &&
      !config._retry &&
      (config.method === 'get' || !config.method) &&
      (error.code === 'ECONNABORTED' || !error.response || [502, 503, 504].includes(error.response?.status))
    ) {
      config._retry = true;
      // Wait 3 seconds for server to finish waking up and retry once
      await new Promise(res => setTimeout(res, 3000));
      return api(config);
    }
    if (error.response && error.response.status === 401) {
      console.warn('[MEMOPIX] Session unverified or expired');
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authApi = {
  register: async (data: any) => {
    const res = await api.post('/auth/register', data);
    return res.data;
  },

  login: async (data: any) => {
    const res = await api.post('/auth/login', data);
    return res.data;
  },

  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },

  forgotPassword: async (email: string) => {
    const res = await api.post('/auth/forgot-password', { email });
    return res.data;
  },

  resetPassword: async (data: any) => {
    const res = await api.post('/auth/reset-password', data);
    return res.data;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {}
    localStorage.removeItem('memopix_token');
    localStorage.removeItem('memopix_user');
    return { success: true };
  }
};

// Resumable Upload APIs
export const uploadApi = {
  initiate: async (params: {
    fileName: string;
    fileSize: number;
    mimeType: string;
    fileHash?: string;
    chunkSize?: number;
    folderId?: string | null;
    deviceInfo?: string;
    forceDuplicate?: boolean;
  }) => {
    const res = await api.post('/uploads/initiate', params);
    return res.data;
  },

  uploadChunk: async (
    sessionId: string,
    partNumber: number,
    chunkBlob: Blob,
    onProgress?: (loaded: number, total: number) => void
  ) => {
    const formData = new FormData();
    formData.append('partNumber', String(partNumber));
    formData.append('chunk', chunkBlob, `part_${partNumber}`);

    const res = await api.post(`/uploads/${sessionId}/chunk`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000, // 2 minutes per 5MB chunk
      onUploadProgress: (e) => {
        if (e.total && onProgress) {
          onProgress(e.loaded, e.total);
        }
      }
    });
    return res.data;
  },

  getStatus: async (sessionId: string) => {
    const res = await api.get(`/uploads/${sessionId}/status`);
    return res.data;
  },

  complete: async (sessionId: string) => {
    const res = await api.post(`/uploads/${sessionId}/complete`, {}, {
      timeout: 180000 // 3 minutes for assembling large multi-GB files
    });
    return res.data;
  },

  abort: async (sessionId: string) => {
    const res = await api.post(`/uploads/${sessionId}/abort`);
    return res.data;
  },

  listPending: async () => {
    const res = await api.get('/uploads/pending');
    return res.data;
  }
};

const enrichItemUrls = (item: any) => {
  if (!item) return item;
  return {
    ...item,
    streamUrl: resolveMediaUrl(item.streamUrl),
    thumbnailUrl: item.thumbnailUrl ? resolveMediaUrl(item.thumbnailUrl) : null,
    downloadUrl: resolveMediaUrl(item.downloadUrl)
  };
};

// Media & Files APIs (Direct Real Cloud Backend)
export const mediaApi = {
  list: async (params: {
    view?: string;
    albumId?: string;
    folderId?: string | null;
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const res = await api.get('/media', { params });
    if (res.data?.success && res.data?.data?.items) {
      res.data.data.items = res.data.data.items.map(enrichItemUrls);
    }
    return res.data;
  },

  getById: async (id: string) => {
    const res = await api.get(`/media/${id}`);
    if (res.data?.success && res.data?.data) {
      res.data.data = enrichItemUrls(res.data.data);
    }
    return res.data;
  },

  upload: async (file: File, forceDuplicate: boolean = false, onProgress?: (pct: number) => void) => {
    const formData = new FormData();
    formData.append('file', file);
    if (forceDuplicate) {
      formData.append('forceDuplicate', 'true');
    }

    const res = await api.post('/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 300000,
      onUploadProgress: progressEvent => {
        if (progressEvent.total && onProgress) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      }
    });
    return res.data;
  },

  update: async (id: string, data: { isFavorite?: boolean; isArchived?: boolean; originalName?: string; folderId?: string | null }) => {
    const res = await api.patch(`/media/${id}`, data);
    return res.data;
  },

  trash: async (id: string) => {
    const res = await api.delete(`/media/${id}`);
    return res.data;
  },

  restore: async (id: string) => {
    const res = await api.post(`/media/${id}/restore`);
    return res.data;
  },

  deletePermanent: async (id: string) => {
    const res = await api.delete(`/media/${id}/permanent`);
    return res.data;
  },

  emptyTrash: async () => {
    const res = await api.post('/media/empty-trash');
    return res.data;
  },

  bulkAction: async (action: string, mediaIds: string[]) => {
    const res = await api.post('/media/bulk', { action, mediaIds });
    return res.data;
  },

  downloadZip: (mediaIds: string[]) => {
    return api.post('/media/bulk-download', { mediaIds }, { responseType: 'blob' });
  }
};

// Folders API
export const folderApi = {
  list: async (parentId?: string | null) => {
    const params = parentId !== undefined ? { parentId: parentId === null ? 'null' : parentId } : {};
    const res = await api.get('/folders', { params });
    return res.data;
  },

  create: async (data: { name: string; parentId?: string | null; color?: string }) => {
    const res = await api.post('/folders', data);
    return res.data;
  },

  getById: async (id: string) => {
    const res = await api.get(`/folders/${id}`);
    return res.data;
  },

  update: async (id: string, data: { name?: string; color?: string; parentId?: string | null }) => {
    const res = await api.patch(`/folders/${id}`, data);
    return res.data;
  },

  delete: async (id: string) => {
    const res = await api.delete(`/folders/${id}`);
    return res.data;
  }
};

// Playlist APIs
export const playlistApi = {
  list: async () => {
    const res = await api.get('/playlists');
    return res.data;
  },

  create: async (data: { title: string; description?: string; mediaIds?: string[] }) => {
    const res = await api.post('/playlists', data);
    return res.data;
  },

  getById: async (id: string) => {
    const res = await api.get(`/playlists/${id}`);
    return res.data;
  },

  update: async (id: string, data: { title?: string; description?: string; coverUrl?: string }) => {
    const res = await api.patch(`/playlists/${id}`, data);
    return res.data;
  },

  delete: async (id: string) => {
    const res = await api.delete(`/playlists/${id}`);
    return res.data;
  },

  addTracks: async (playlistId: string, mediaIds: string[]) => {
    const res = await api.post(`/playlists/${playlistId}/tracks`, { mediaIds });
    return res.data;
  },

  removeTrack: async (playlistId: string, mediaId: string) => {
    const res = await api.delete(`/playlists/${playlistId}/tracks/${mediaId}`);
    return res.data;
  }
};

// Album APIs
export const albumApi = {
  list: async () => {
    const res = await api.get('/albums');
    return res.data;
  },

  create: async (data: { title: string; description?: string; mediaIds?: string[] }) => {
    const res = await api.post('/albums', data);
    return res.data;
  },

  getById: async (id: string) => {
    const res = await api.get(`/albums/${id}`);
    return res.data;
  },

  update: async (id: string, data: any) => {
    const res = await api.patch(`/albums/${id}`, data);
    return res.data;
  },

  delete: async (id: string) => {
    const res = await api.delete(`/albums/${id}`);
    return res.data;
  },

  addMedia: async (albumId: string, mediaIds: string[]) => {
    const res = await api.post(`/albums/${albumId}/media`, { mediaIds });
    return res.data;
  },

  removeMedia: async (albumId: string, mediaId: string) => {
    const res = await api.delete(`/albums/${albumId}/media/${mediaId}`);
    return res.data;
  }
};

// Share APIs
export const shareApi = {
  create: async (data: { mediaId?: string; albumId?: string; expiresInDays?: number; allowDownload?: boolean }) => {
    const res = await api.post('/share', data);
    return res.data;
  },
  listMyLinks: async () => {
    const res = await api.get('/share/my-links');
    return res.data;
  },
  update: async (id: string, data: any) => {
    const res = await api.patch(`/share/${id}`, data);
    return res.data;
  },
  delete: async (id: string) => {
    const res = await api.delete(`/share/${id}`);
    return res.data;
  },
  getPublic: async (token: string) => {
    const res = await api.get(`/share/public/${token}`);
    return res.data;
  }
};

// Storage APIs (Always 5 TB Enforced Quota)
export const storageApi = {
  getUsage: async () => {
    const res = await api.get('/storage/usage');
    return res.data;
  },
  recalculate: async () => {
    const res = await api.post('/storage/recalculate');
    return res.data;
  }
};

// User APIs
export const userApi = {
  updateProfile: async (data: { name?: string; avatarUrl?: string }) => {
    const res = await api.patch('/user/profile', data);
    return res.data;
  },
  changePassword: async (data: any) => {
    const res = await api.post('/user/change-password', data);
    return res.data;
  }
};

export default api;
