import { User, MediaItem, Album, StorageStats } from '../types';

const USERS_KEY = 'memopix_vault_users';
const MEDIA_KEY = 'memopix_vault_media';
const ALBUMS_KEY = 'memopix_vault_albums';
const ACTIVE_USER_KEY = 'memopix_vault_active_user';

// Initial pre-seeded demo accounts
const DEFAULT_USERS: Array<User & { password?: string }> = [
  {
    id: 'usr_suchith_primary',
    name: 'Suchith',
    email: 'suchith@gmail.com',
    password: 'password123',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop',
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'usr_suchith_kumar',
    name: 'Suchith Kumar',
    email: 'suchith2007kumar@gmail.com',
    password: 'password123',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop',
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'usr_suchith_2007',
    name: 'Suchith',
    email: 'suchith@2007.com',
    password: 'password123',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop',
    createdAt: '2026-01-01T00:00:00.000Z'
  }
];

// Pre-seeded high quality sample memories
const DEFAULT_MEDIA: MediaItem[] = [
  {
    id: 'med_sample_1',
    ownerId: 'usr_suchith_primary',
    fileName: 'golden_sunset_mountain.jpg',
    originalName: 'Golden Sunset Mountain.jpg',
    mimeType: 'image/jpeg',
    fileSize: 4250000,
    fileHash: 'hash_sunset_001',
    storagePath: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1600&auto=format&fit=crop',
    thumbnailPath: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=500&auto=format&fit=crop',
    streamUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1600&auto=format&fit=crop',
    thumbnailUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=500&auto=format&fit=crop',
    downloadUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1600&auto=format&fit=crop',
    width: 3840,
    height: 2160,
    isFavorite: true,
    isArchived: false,
    isDeleted: false,
    takenAt: '2026-08-15T18:30:00.000Z',
    cameraModel: 'Sony A7R V',
    createdAt: '2026-08-15T18:35:00.000Z',
    updatedAt: '2026-08-15T18:35:00.000Z'
  },
  {
    id: 'med_sample_2',
    ownerId: 'usr_suchith_primary',
    fileName: 'coastal_horizon_waves.jpg',
    originalName: 'Coastal Waves & Ocean.jpg',
    mimeType: 'image/jpeg',
    fileSize: 3890000,
    fileHash: 'hash_ocean_002',
    storagePath: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&auto=format&fit=crop',
    thumbnailPath: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&auto=format&fit=crop',
    streamUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&auto=format&fit=crop',
    thumbnailUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&auto=format&fit=crop',
    downloadUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&auto=format&fit=crop',
    width: 4000,
    height: 2667,
    isFavorite: true,
    isArchived: false,
    isDeleted: false,
    takenAt: '2026-07-20T10:15:00.000Z',
    cameraModel: 'Canon EOS R5',
    createdAt: '2026-07-20T10:20:00.000Z',
    updatedAt: '2026-07-20T10:20:00.000Z'
  },
  {
    id: 'med_sample_3',
    ownerId: 'usr_suchith_primary',
    fileName: 'night_sky_milky_way.jpg',
    originalName: 'Milky Way Galaxy Night.jpg',
    mimeType: 'image/jpeg',
    fileSize: 5120000,
    fileHash: 'hash_stars_003',
    storagePath: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1600&auto=format&fit=crop',
    thumbnailPath: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=500&auto=format&fit=crop',
    streamUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1600&auto=format&fit=crop',
    thumbnailUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=500&auto=format&fit=crop',
    downloadUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1600&auto=format&fit=crop',
    width: 3500,
    height: 2333,
    isFavorite: false,
    isArchived: false,
    isDeleted: false,
    takenAt: '2026-06-11T23:45:00.000Z',
    cameraModel: 'Nikon Z8',
    createdAt: '2026-06-11T23:50:00.000Z',
    updatedAt: '2026-06-11T23:50:00.000Z'
  },
  {
    id: 'med_sample_4',
    ownerId: 'usr_suchith_primary',
    fileName: 'nature_cinematic_4k.mp4',
    originalName: 'Cinematic Nature Showcase.mp4',
    mimeType: 'video/mp4',
    fileSize: 18450000,
    fileHash: 'hash_video_004',
    storagePath: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnailPath: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=500&auto=format&fit=crop',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=500&auto=format&fit=crop',
    downloadUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    width: 1920,
    height: 1080,
    duration: 15,
    isFavorite: true,
    isArchived: false,
    isDeleted: false,
    takenAt: '2026-08-01T14:00:00.000Z',
    createdAt: '2026-08-01T14:05:00.000Z',
    updatedAt: '2026-08-01T14:05:00.000Z'
  },
  {
    id: 'med_sample_5',
    ownerId: 'usr_suchith_primary',
    fileName: 'memopix_ambient_melody.mp3',
    originalName: 'Memopix Ambient Melody.mp3',
    mimeType: 'audio/mpeg',
    fileSize: 6200000,
    fileHash: 'hash_audio_005',
    storagePath: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    thumbnailPath: null,
    streamUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    thumbnailUrl: null,
    downloadUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    duration: 372,
    isFavorite: true,
    isArchived: false,
    isDeleted: false,
    createdAt: '2026-08-10T12:00:00.000Z',
    updatedAt: '2026-08-10T12:00:00.000Z'
  }
];

const DEFAULT_ALBUMS: Album[] = [
  {
    id: 'alb_favorites',
    title: 'Highlights & Favorites',
    description: 'Best moments from 2026',
    itemCount: 4,
    coverMedia: DEFAULT_MEDIA[0],
    createdAt: '2026-08-15T18:40:00.000Z',
    updatedAt: '2026-08-15T18:40:00.000Z',
    media: [DEFAULT_MEDIA[0], DEFAULT_MEDIA[1], DEFAULT_MEDIA[3]]
  }
];

const FIVE_TB = 5000000000000;

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

export const clientVault = {
  getUsers(): Array<User & { password?: string }> {
    try {
      const data = localStorage.getItem(USERS_KEY);
      if (!data) {
        localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));
        return DEFAULT_USERS;
      }
      return JSON.parse(data);
    } catch {
      return DEFAULT_USERS;
    }
  },

  saveUsers(users: any[]) {
    try {
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    } catch {}
  },

  getMedia(): MediaItem[] {
    try {
      const data = localStorage.getItem(MEDIA_KEY);
      if (!data) {
        localStorage.setItem(MEDIA_KEY, JSON.stringify(DEFAULT_MEDIA));
        return DEFAULT_MEDIA;
      }
      return JSON.parse(data);
    } catch {
      return DEFAULT_MEDIA;
    }
  },

  saveMedia(media: MediaItem[]) {
    try {
      localStorage.setItem(MEDIA_KEY, JSON.stringify(media));
    } catch {}
  },

  getAlbums(): Album[] {
    try {
      const data = localStorage.getItem(ALBUMS_KEY);
      if (!data) {
        localStorage.setItem(ALBUMS_KEY, JSON.stringify(DEFAULT_ALBUMS));
        return DEFAULT_ALBUMS;
      }
      return JSON.parse(data);
    } catch {
      return DEFAULT_ALBUMS;
    }
  },

  saveAlbums(albums: Album[]) {
    try {
      localStorage.setItem(ALBUMS_KEY, JSON.stringify(albums));
    } catch {}
  },

  getStorageStats(): StorageStats {
    const media = this.getMedia().filter(m => !m.isDeleted);
    let photosBytes = 0;
    let videosBytes = 0;
    let audioBytes = 0;
    let otherBytes = 0;
    let totalPhotos = 0;
    let totalVideos = 0;
    let totalAudio = 0;

    for (const m of media) {
      if (m.mimeType.startsWith('image/')) {
        photosBytes += m.fileSize;
        totalPhotos++;
      } else if (m.mimeType.startsWith('video/')) {
        videosBytes += m.fileSize;
        totalVideos++;
      } else if (m.mimeType.startsWith('audio/')) {
        audioBytes += m.fileSize;
        totalAudio++;
      } else {
        otherBytes += m.fileSize;
      }
    }

    const usedBytes = photosBytes + videosBytes + audioBytes + otherBytes;
    const remainingBytes = Math.max(0, FIVE_TB - usedBytes);
    const percentageUsed = (usedBytes / FIVE_TB) * 100;

    return {
      usedBytes,
      limitBytes: FIVE_TB,
      remainingBytes,
      percentageUsed,
      photosBytes,
      videosBytes,
      audioBytes,
      otherBytes,
      totalFiles: media.length,
      totalPhotos,
      totalVideos,
      totalAudio,
      formattedUsed: formatBytes(usedBytes),
      formattedLimit: '5.00 TB',
      formattedRemaining: formatBytes(remainingBytes)
    };
  },

  login(email: string, _password?: string) {
    const users = this.getUsers();
    const cleanEmail = (email || '').trim().toLowerCase();
    let found = users.find(u => u.email.toLowerCase() === cleanEmail);

    if (!found) {
      // Auto-create account for smooth login experience on any device
      const name = cleanEmail.split('@')[0] || 'User';
      const capitalized = name.charAt(0).toUpperCase() + name.slice(1);
      found = {
        id: `usr_${Date.now()}`,
        name: capitalized,
        email: cleanEmail,
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop',
        createdAt: new Date().toISOString()
      };
      users.push(found);
      this.saveUsers(users);
    }

    const token = `memopix_vault_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const storage = this.getStorageStats();

    localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(found));
    localStorage.setItem('memopix_user', JSON.stringify(found));
    localStorage.setItem('memopix_token', token);

    return {
      success: true,
      data: {
        user: found,
        token,
        storage
      }
    };
  },

  googleLogin(name: string, email: string, avatarUrl?: string) {
    const users = this.getUsers();
    const cleanEmail = (email || '').trim().toLowerCase();
    let found = users.find(u => u.email.toLowerCase() === cleanEmail);

    if (!found) {
      found = {
        id: `usr_g_${Date.now()}`,
        name: name || 'Google User',
        email: cleanEmail,
        avatarUrl: avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop',
        createdAt: new Date().toISOString()
      };
      users.push(found);
      this.saveUsers(users);
    }

    const token = `memopix_gtoken_${Date.now()}`;
    const storage = this.getStorageStats();

    localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(found));
    localStorage.setItem('memopix_user', JSON.stringify(found));
    localStorage.setItem('memopix_token', token);

    return {
      success: true,
      data: {
        user: found,
        token,
        storage
      }
    };
  },

  getMe() {
    let user: User | null = null;
    try {
      const saved = localStorage.getItem(ACTIVE_USER_KEY) || localStorage.getItem('memopix_user');
      if (saved) user = JSON.parse(saved);
    } catch {}

    if (!user) {
      user = DEFAULT_USERS[0];
    }

    return {
      success: true,
      data: {
        user,
        storage: this.getStorageStats()
      }
    };
  },

  register(data: { name: string; email: string; password?: string }) {
    const users = this.getUsers();
    const cleanEmail = (data.email || '').trim().toLowerCase();
    let found = users.find(u => u.email.toLowerCase() === cleanEmail);

    if (!found) {
      found = {
        id: `usr_${Date.now()}`,
        name: data.name || 'New Member',
        email: cleanEmail,
        password: data.password || 'password123',
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop',
        createdAt: new Date().toISOString()
      };
      users.push(found);
      this.saveUsers(users);
    }

    return this.login(cleanEmail);
  },

  listMedia(params: { view?: string; albumId?: string; search?: string }) {
    let all = this.getMedia();
    const view = params.view || 'photos';
    const search = (params.search || '').toLowerCase().trim();

    if (view === 'trash') {
      all = all.filter(m => m.isDeleted);
    } else if (view === 'archive') {
      all = all.filter(m => !m.isDeleted && m.isArchived);
    } else if (view === 'favorites') {
      all = all.filter(m => !m.isDeleted && !m.isArchived && m.isFavorite);
    } else if (view === 'videos') {
      all = all.filter(m => !m.isDeleted && !m.isArchived && m.mimeType.startsWith('video/'));
    } else if (view === 'audio') {
      all = all.filter(m => !m.isDeleted && !m.isArchived && m.mimeType.startsWith('audio/'));
    } else if (view === 'album' && params.albumId) {
      const albums = this.getAlbums();
      const alb = albums.find(a => a.id === params.albumId);
      const mediaIds = (alb?.media || []).map(m => m.id);
      all = all.filter(m => !m.isDeleted && mediaIds.includes(m.id));
    } else {
      // photos or default
      all = all.filter(m => !m.isDeleted && !m.isArchived);
    }

    if (search) {
      all = all.filter(m =>
        m.originalName.toLowerCase().includes(search) ||
        (m.cameraModel && m.cameraModel.toLowerCase().includes(search))
      );
    }

    return {
      success: true,
      data: {
        media: all,
        pagination: {
          total: all.length,
          page: 1,
          limit: 100,
          totalPages: 1
        }
      }
    };
  },

  async addUploadedFile(file: File): Promise<MediaItem> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const isImg = file.type.startsWith('image/');
        const isVid = file.type.startsWith('video/');
        const isAud = file.type.startsWith('audio/');

        const newItem: MediaItem = {
          id: `med_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          ownerId: 'usr_current',
          fileName: file.name,
          originalName: file.name,
          mimeType: file.type || (isVid ? 'video/mp4' : isAud ? 'audio/mpeg' : 'image/jpeg'),
          fileSize: file.size,
          fileHash: `hash_${Date.now()}`,
          storagePath: dataUrl,
          thumbnailPath: isImg ? dataUrl : null,
          streamUrl: dataUrl,
          thumbnailUrl: isImg ? dataUrl : null,
          downloadUrl: dataUrl,
          width: isImg ? 1920 : undefined,
          height: isImg ? 1080 : undefined,
          isFavorite: false,
          isArchived: false,
          isDeleted: false,
          takenAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        const media = this.getMedia();
        media.unshift(newItem);
        this.saveMedia(media);
        resolve(newItem);
      };
      reader.readAsDataURL(file);
    });
  },

  updateMedia(id: string, updates: Partial<MediaItem>) {
    const media = this.getMedia();
    const item = media.find(m => m.id === id);
    if (item) {
      Object.assign(item, updates, { updatedAt: new Date().toISOString() });
      this.saveMedia(media);
    }
    return { success: true, data: item };
  },

  trashMedia(id: string) {
    return this.updateMedia(id, { isDeleted: true, deletedAt: new Date().toISOString() });
  },

  restoreMedia(id: string) {
    return this.updateMedia(id, { isDeleted: false, deletedAt: null });
  },

  deletePermanentMedia(id: string) {
    const media = this.getMedia().filter(m => m.id !== id);
    this.saveMedia(media);
    return { success: true, message: 'Item permanently deleted' };
  },

  emptyTrash() {
    const media = this.getMedia().filter(m => !m.isDeleted);
    this.saveMedia(media);
    return { success: true, message: 'Trash emptied' };
  },

  bulkAction(action: string, mediaIds: string[]) {
    const media = this.getMedia();
    for (const m of media) {
      if (mediaIds.includes(m.id)) {
        if (action === 'favorite') m.isFavorite = true;
        else if (action === 'unfavorite') m.isFavorite = false;
        else if (action === 'archive') m.isArchived = true;
        else if (action === 'unarchive') m.isArchived = false;
        else if (action === 'trash') {
          m.isDeleted = true;
          m.deletedAt = new Date().toISOString();
        } else if (action === 'restore') {
          m.isDeleted = false;
          m.deletedAt = null;
        }
      }
    }
    this.saveMedia(media);
    return { success: true, count: mediaIds.length };
  }
};
