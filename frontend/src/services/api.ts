import axios from 'axios';

export const getApiBase = (): string => {
  // 1. Explicit user override in localStorage (Settings -> Backend URL)
  if (typeof window !== 'undefined') {
    const customUrl = localStorage.getItem('memopix_custom_backend_url');
    if (customUrl && customUrl.trim()) {
      const clean = customUrl.trim().replace(/\/$/, '');
      return clean.endsWith('/api') ? clean : `${clean}/api`;
    }
  }

  // 2. Explicit environment variable configured at build time (e.g. Vercel env var)
  const rawBackend = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL;
  if (rawBackend && rawBackend.trim()) {
    const clean = rawBackend.trim().replace(/\/$/, '');
    return clean.endsWith('/api') ? clean : `${clean}/api`;
  }

  // 3. Running inside Laptop local development / unified server (localhost:5000, 127.0.0.1:5000, or LAN 192.168.x.x:5000)
  if (typeof window !== 'undefined') {
    const host = window.location.host || '';
    if (host.includes(':5000')) {
      return '/api';
    }

    // Running on Vercel web domain: relative /api proxied to laptop via Cloudflare tunnel
    if (host.includes('vercel.app')) {
      return '/api';
    }

    // Running on native mobile APK (Android WebView / Capacitor)
    const isNativeApp =
      window.location.protocol === 'capacitor:' ||
      window.location.protocol === 'ionic:' ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      (window as any).Capacitor !== undefined ||
      navigator.userAgent.includes('wv');

    if (isNativeApp) {
      // Check localStorage for auto-discovered tunnel URL (set by discoverBackend())
      const tunnelUrl = localStorage.getItem('memopix_tunnel_url');
      if (tunnelUrl && tunnelUrl.trim()) {
        const t = tunnelUrl.trim();
        return t.endsWith('/api') ? t : `${t}/api`;
      }
      // Fallback: Vercel frontend proxies to laptop tunnel
      return 'https://memopix-tau.vercel.app/api';
    }
  }

  // 4. Default in web environments: relative /api
  return '/api';
};

/**
 * Auto-discover backend tunnel URL for mobile APK.
 * Tries Vercel frontend proxy to read tunnel URL registered by laptop start script.
 * Call once on app start in native mobile context.
 */
export const discoverBackend = async (): Promise<void> => {
  try {
    const isNativeApp =
      typeof window !== 'undefined' && (
        window.location.protocol === 'capacitor:' ||
        window.location.protocol === 'ionic:' ||
        (window as any).Capacitor !== undefined ||
        navigator.userAgent.includes('wv')
      );
    if (!isNativeApp) return;

    // Fast check: Are we on the same home WiFi as the laptop? (192.168.1.3)
    try {
      const wifiProbe = await fetch('http://192.168.1.3:5000/api/health', { signal: AbortSignal.timeout(1500) });
      if (wifiProbe.ok) {
        localStorage.setItem('memopix_tunnel_url', 'http://192.168.1.3:5000');
        console.log('[MEMOPIX] Connected to Laptop directly over WiFi');
        return;
      }
    } catch {}

    // Outside home WiFi: Fetch current Cloudflare tunnel URL via Vercel
    const res = await fetch('https://memopix-tau.vercel.app/api/tunnel-url', { signal: AbortSignal.timeout(6000) });
    if (res.ok) {
      const data = await res.json();
      if (data?.tunnelUrl) {
        localStorage.setItem('memopix_tunnel_url', data.tunnelUrl);
        console.log('[MEMOPIX] Connected via Cloudflare Tunnel:', data.tunnelUrl);
      }
    }
  } catch {
    // Silent fallback to Vercel proxy
  }
};


/**
 * Resolves relative media URLs (/api/media/stream/...) to direct backend origin,
 * ensuring reliable audio/video streaming and thumbnail loading on web & mobile.
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
  let baseOrigin = '';
  if (apiBase.startsWith('http://') || apiBase.startsWith('https://')) {
    baseOrigin = apiBase.endsWith('/api') ? apiBase.slice(0, -4) : apiBase;
  } else if (typeof window !== 'undefined' && window.location.origin) {
    baseOrigin = window.location.origin;
  }

  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${baseOrigin}${cleanPath}`;
};

export const API_BASE = getApiBase();

const api = axios.create({
  baseURL: API_BASE,
  timeout: 20000, // 20 seconds
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

// Response interceptor with automatic retry on cold-start or temporary network blip
api.interceptors.response.use(
  response => response,
  async error => {
    const config = error.config;
    if (!config) return Promise.reject(error);

    config._retryCount = config._retryCount || 0;
    const MAX_RETRIES = 2;

    const isNetworkOrColdStart =
      error.code === 'ECONNABORTED' ||
      !error.response ||
      [500, 502, 503, 504].includes(error.response?.status);

    if (isNetworkOrColdStart && config._retryCount < MAX_RETRIES && (config.method === 'get' || !config.method)) {
      config._retryCount += 1;
      const delay = config._retryCount * 1500; // 1.5s, 3s backoff
      await new Promise(res => setTimeout(res, delay));
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

  upload: async (file: File, forceDuplicate: boolean = false, onProgress?: (pct: number) => void, folderId?: string | null) => {
    const formData = new FormData();
    formData.append('file', file);
    if (forceDuplicate) {
      formData.append('forceDuplicate', 'true');
    }
    if (folderId) {
      formData.append('folderId', folderId);
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
  },

  getLyrics: async (
    id: string,
    trackTitle?: string
  ): Promise<{
    lyrics: string | null;
    syncedLyrics?: string | null;
    plainLyrics?: string | null;
    isInstrumental?: boolean;
    source: 'id3' | 'lrc' | 'txt' | 'lrclib' | null;
    trackName?: string | null;
    artistName?: string | null;
  }> => {
    // 1. Try backend endpoint first
    try {
      const res = await api.get(`/media/${id}/lyrics`);
      if (res.data?.success) {
        return {
          lyrics: res.data.lyrics ?? null,
          syncedLyrics: res.data.syncedLyrics ?? (res.data.lyrics && /\[\d{1,2}:\d{2}/.test(res.data.lyrics) ? res.data.lyrics : null),
          plainLyrics: res.data.plainLyrics ?? null,
          isInstrumental: !!res.data.isInstrumental,
          source: res.data.source ?? null,
          trackName: res.data.trackName,
          artistName: res.data.artistName
        };
      }
    } catch (err) {
      console.warn('[lyrics] Backend lyrics call failed, attempting direct online fetch:', err);
    }

    // 2. Direct browser fallback to LRCLIB (CORS-friendly public lyrics database)
    if (trackTitle) {
      try {
        const clean = trackTitle
          .replace(/\.[a-zA-Z0-9]+$/, '')
          .replace(/\[[^\]]+\]/g, '')
          .replace(/\((?:official|audio|video|lyric|lyrics|remix|hd|4k)[^)]*\)/gi, '')
          .trim();

        const isInstrumental = /\b(instrumental|bgm|theme|background score|score|karaoke)\b/i.test(clean);

        const lrcRes = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(clean)}`, {
          headers: { 'Accept': 'application/json' }
        });
        if (lrcRes.ok) {
          const list: any = await lrcRes.json();
          if (Array.isArray(list) && list.length > 0) {
            const synced = list.find((it: any) => it.syncedLyrics && it.syncedLyrics.trim().length > 0);
            if (synced) {
              return {
                lyrics: synced.syncedLyrics,
                syncedLyrics: synced.syncedLyrics,
                plainLyrics: synced.plainLyrics || null,
                isInstrumental: false,
                source: 'lrclib',
                trackName: synced.trackName || clean,
                artistName: synced.artistName || null
              };
            }
            const inst = list.find((it: any) => it.instrumental === true);
            if (inst || isInstrumental) {
              return {
                lyrics: null,
                syncedLyrics: null,
                isInstrumental: true,
                source: 'lrclib',
                trackName: inst?.trackName || clean,
                artistName: inst?.artistName || null
              };
            }
            const plain = list.find((it: any) => it.plainLyrics && it.plainLyrics.trim().length > 0);
            if (plain) {
              return {
                lyrics: plain.plainLyrics,
                syncedLyrics: null,
                plainLyrics: plain.plainLyrics,
                isInstrumental: false,
                source: 'lrclib',
                trackName: plain.trackName || clean,
                artistName: plain.artistName || null
              };
            }
          }
        }
        if (isInstrumental) {
          return { lyrics: null, syncedLyrics: null, isInstrumental: true, source: null };
        }
      } catch {}
    }

    return { lyrics: null, syncedLyrics: null, isInstrumental: false, source: null };
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
  },

  reorder: async (playlistId: string, mediaIds: string[]) => {
    const res = await api.put(`/playlists/${playlistId}/reorder`, { mediaIds });
    return res.data;
  },

  uploadCover: async (playlistId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post(`/playlists/${playlistId}/cover`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
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
