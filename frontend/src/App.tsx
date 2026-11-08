import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './context/AuthContext';
import { useToast } from './context/ToastContext';
import { MediaItem, Album } from './types';
import { mediaApi, getApiBase } from './services/api';

// Layout & UI Components
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { BottomNavigation } from './components/BottomNavigation';
import { MultiSelectBar } from './components/MultiSelectBar';
import { UploadModal } from './components/UploadModal';
import { PhotoViewer } from './components/PhotoViewer';
import { VideoPlayer } from './components/VideoPlayer';
import { PersistentMiniPlayer } from './components/PersistentMiniPlayer';
import { SplashScreen } from './components/SplashScreen';
import { ShareModal } from './components/ShareModal';
import { CreateAlbumModal } from './components/CreateAlbumModal';
import { AddToAlbumModal } from './components/AddToAlbumModal';
import { AddToPlaylistModal } from './components/AddToPlaylistModal';
import { MobileDrawer } from './components/MobileDrawer';
import { RenameModal } from './components/RenameModal';
import { useMusicPlayer } from './context/MusicPlayerContext';

// Pages
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { PhotosPage } from './pages/PhotosPage';
import { AllMediaPage } from './pages/AllMediaPage';
import { VideosPage } from './pages/VideosPage';
import { AudioPage } from './pages/AudioPage';
import { FoldersPage } from './pages/FoldersPage';
import { AlbumsPage } from './pages/AlbumsPage';
import { AlbumDetailPage } from './pages/AlbumDetailPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { ArchivePage } from './pages/ArchivePage';
import { TrashPage } from './pages/TrashPage';
import { StoragePage } from './pages/StoragePage';
import { SettingsPage } from './pages/SettingsPage';
import { SharedViewPage } from './pages/SharedViewPage';
import { GoogleCallbackPage } from './pages/GoogleCallbackPage';
import { GoogleSignInPage } from './pages/GoogleSignInPage';

export const App: React.FC = () => {
  const { user, token, isLoading, refreshStorage } = useAuth();
  const { success, error } = useToast();
  const { playTrack } = useMusicPlayer();

  // Navigation & View State
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [currentTab, setCurrentTab] = useState<string>(() => {
    try {
      return localStorage.getItem('memopix_active_tab') || 'all';
    } catch {
      return 'all';
    }
  });
  const [authRoute, setAuthRoute] = useState<'login' | 'register' | 'forgot-password' | 'google-signin'>('login');
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [reloadTrigger, setReloadTrigger] = useState<number>(0);

  // Persist active tab across app closes / app switches
  useEffect(() => {
    try {
      if (currentTab) {
        localStorage.setItem('memopix_active_tab', currentTab);
      }
    } catch {}
  }, [currentTab]);

  // Proactively ping backend to wake up cloud instance immediately on app open
  useEffect(() => {
    try {
      const apiBase = getApiBase();
      fetch(`${apiBase}/health`, { signal: AbortSignal.timeout(10000) }).catch(() => {});
    } catch {}
  }, []);

  // Selection & Modal States
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeMedia, setActiveMedia] = useState<MediaItem | null>(null);
  const [currentMediaList, setCurrentMediaList] = useState<MediaItem[]>([]);
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [uploadFolderId, setUploadFolderId] = useState<string | null>(null);
  const [isCreateAlbumOpen, setIsCreateAlbumOpen] = useState<boolean>(false);
  const [isAddToAlbumOpen, setIsAddToAlbumOpen] = useState<boolean>(false);
  const [isAddToPlaylistOpen, setIsAddToPlaylistOpen] = useState<boolean>(false);
  const [shareMedia, setShareMedia] = useState<MediaItem | null>(null);
  const [shareAlbum, setShareAlbum] = useState<Album | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);
  const [renameTarget, setRenameTarget] = useState<MediaItem | null>(null);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState<boolean>(false);

  // Trigger reload of active list (memoized to prevent child subscription re-triggers)
  const triggerReload = useCallback(() => setReloadTrigger(prev => prev + 1), []);
  const handleUploadComplete = useCallback(() => {
    triggerReload();
    refreshStorage();
  }, [triggerReload, refreshStorage]);

  // Handle URL routes for public share, Google OAuth callback, and password reset
  const pathname = window.location.pathname;
  const isPublicShare = pathname.startsWith('/share/');
  const isGoogleCallback = pathname.startsWith('/auth/google/callback');
  const isResetPassword = pathname.startsWith('/reset-password') || (pathname === '/' && window.location.search.includes('token=') && !isGoogleCallback);

  if (isGoogleCallback) {
    return <GoogleCallbackPage />;
  }

  if (isPublicShare) {
    return <SharedViewPage />;
  }

  if (isResetPassword) {
    return <ResetPasswordPage onNavigate={r => setAuthRoute(r as any)} />;
  }

  // Loading state (only shown if splash screen has already completed)
  if (isLoading && !showSplash) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0B0F17] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-brand-500/20 text-brand-500 flex items-center justify-center animate-pulse">
            <div className="w-6 h-6 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
          </div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
            Connecting to MEMOPIX Cloud...
          </p>
        </div>
      </div>
    );
  }

  // Unauthenticated routes
  if (!user || !token) {
    return (
      <>
        {showSplash && (
          <SplashScreen 
            isLoading={isLoading} 
            onFinish={() => setShowSplash(false)} 
          />
        )}
        {authRoute === 'google-signin' && <GoogleSignInPage onBack={() => setAuthRoute('login')} />}
        {authRoute === 'register' && <RegisterPage onNavigate={r => setAuthRoute(r as any)} />}
        {authRoute === 'forgot-password' && <ForgotPasswordPage onNavigate={r => setAuthRoute(r as any)} />}
        {authRoute === 'login' && <LoginPage onNavigate={r => setAuthRoute(r as any)} />}
      </>
    );
  }

  // Multi-Selection Handlers
  const handleToggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectGroup = (ids: string[]) => {
    const allSelected = ids.every(id => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !ids.includes(id)));
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...ids])));
    }
  };

  const handleClearSelection = () => setSelectedIds([]);

  // Media Click Handler
  const handleClickMedia = (media: MediaItem, list: MediaItem[]) => {
    const isAudio = media.mimeType?.startsWith('audio/') || 
      media.originalName?.toLowerCase().endsWith('.mp3') || 
      media.originalName?.toLowerCase().endsWith('.wav') ||
      media.originalName?.toLowerCase().endsWith('.m4a');

    if (isAudio) {
      playTrack(media, list);
    } else {
      setActiveMedia(media);
      setCurrentMediaList(list);
    }
  };

  // Favorite Toggle Handler
  const handleFavoriteToggle = async (id: string, isFav: boolean) => {
    try {
      await mediaApi.update(id, { isFavorite: isFav });
      if (activeMedia && activeMedia.id === id) {
        setActiveMedia({ ...activeMedia, isFavorite: isFav });
      }
      triggerReload();
    } catch {
      error('Failed to update favorite status.');
    }
  };

  // Rename Media Handler
  const handleRenameMedia = async (id: string, newName: string) => {
    try {
      await mediaApi.update(id, { originalName: newName });
      if (activeMedia && activeMedia.id === id) {
        setActiveMedia({ ...activeMedia, originalName: newName });
      }
      success(`Renamed to "${newName}".`);
      triggerReload();
    } catch {
      error('Failed to rename file.');
    }
  };

  // Trash Media Handler
  const handleTrashMedia = async (id: string) => {
    try {
      await mediaApi.trash(id);
      success('Moved to Trash.');
      setActiveMedia(null);
      await refreshStorage();
      triggerReload();
    } catch {
      error('Failed to move item to trash.');
    }
  };

  // Share Handlers
  const handleOpenShareMedia = (media: MediaItem) => {
    setShareMedia(media);
    setShareAlbum(null);
    setIsShareModalOpen(true);
  };

  const handleOpenShareAlbum = (album: Album) => {
    setShareAlbum(album);
    setShareMedia(null);
    setIsShareModalOpen(true);
  };

  // Bulk Actions
  const handleBulkDownloadZip = async () => {
    if (selectedIds.length === 0) return;
    try {
      success('Preparing ZIP export...');
      const response = await mediaApi.downloadZip(selectedIds);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `memopix_export_${Date.now()}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      success('Download started!');
    } catch {
      error('Failed to export ZIP.');
    }
  };

  const handleBulkFavorite = async () => {
    try {
      await mediaApi.bulkAction('favorite', selectedIds);
      success(`Favorited ${selectedIds.length} item(s).`);
      handleClearSelection();
      triggerReload();
    } catch {
      error('Bulk favorite failed.');
    }
  };

  const handleBulkArchive = async () => {
    try {
      await mediaApi.bulkAction('archive', selectedIds);
      success(`Archived ${selectedIds.length} item(s).`);
      handleClearSelection();
      triggerReload();
    } catch {
      error('Bulk archive failed.');
    }
  };

  const handleBulkUnarchive = async (idsToUnarchive?: string[]) => {
    const ids = idsToUnarchive || selectedIds;
    if (ids.length === 0) return;
    try {
      await mediaApi.bulkAction('unarchive', ids);
      success(`Unarchived ${ids.length} item(s) — restored to gallery.`);
      handleClearSelection();
      triggerReload();
    } catch {
      error('Failed to unarchive items.');
    }
  };

  const handleSingleArchive = async (id: string, archive: boolean) => {
    try {
      await mediaApi.bulkAction(archive ? 'archive' : 'unarchive', [id]);
      success(archive ? 'Memory archived.' : 'Restored from archive.');
      if (activeMedia && activeMedia.id === id) {
        setActiveMedia({ ...activeMedia, isArchived: archive });
      }
      triggerReload();
    } catch {
      error(archive ? 'Failed to archive.' : 'Failed to unarchive.');
    }
  };

  const handleOpenRename = (media: MediaItem) => {
    setRenameTarget(media);
    setIsRenameModalOpen(true);
  };

  const handleBulkTrash = async () => {
    try {
      await mediaApi.bulkAction('trash', selectedIds);
      success(`Moved ${selectedIds.length} item(s) to Trash.`);
      handleClearSelection();
      await refreshStorage();
      triggerReload();
    } catch {
      error('Bulk delete failed.');
    }
  };

  // Tab Selection
  const handleSelectTab = (tab: string) => {
    setSelectedAlbum(null);
    setCurrentTab(tab);
    setSelectedIds([]);
  };

  const isVideoActive = activeMedia?.mimeType?.startsWith('video/');
  const isAudioActive = activeMedia?.mimeType?.startsWith('audio/') || 
    activeMedia?.originalName?.toLowerCase().endsWith('.mp3') || 
    activeMedia?.originalName?.toLowerCase().endsWith('.wav') ||
    activeMedia?.originalName?.toLowerCase().endsWith('.m4a');

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#0B0F17] text-gray-900 dark:text-gray-100 overflow-hidden font-sans transition-colors">
      {/* Splash Screen */}
      {showSplash && (
        <SplashScreen 
          isLoading={isLoading} 
          onFinish={() => setShowSplash(false)} 
        />
      )}

      {/* Sidebar Navigation (Desktop) */}
      <Sidebar currentTab={selectedAlbum ? 'albums' : currentTab} onSelectTab={handleSelectTab} />

      {/* Main App Canvas */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Navbar */}
        <Navbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenUpload={() => setIsUploadOpen(true)}
          onNavigate={handleSelectTab}
          onOpenMobileDrawer={() => setIsMobileDrawerOpen(true)}
        />

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6">
          {/* Active Tab Router */}
          {selectedAlbum ? (
            <AlbumDetailPage
              album={selectedAlbum}
              onBack={() => setSelectedAlbum(null)}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onSelectGroup={handleSelectGroup}
              onClickMedia={handleClickMedia}
              onShareAlbum={handleOpenShareAlbum}
              onOpenUpload={() => setIsUploadOpen(true)}
              onFavorite={handleFavoriteToggle}
              onRename={handleOpenRename}
              reloadTrigger={reloadTrigger}
            />
          ) : currentTab === 'all' ? (
            <AllMediaPage
              searchQuery={searchQuery}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onSelectGroup={handleSelectGroup}
              onClickMedia={handleClickMedia}
              onOpenUpload={() => setIsUploadOpen(true)}
              onFavorite={handleFavoriteToggle}
              onRename={handleOpenRename}
              reloadTrigger={reloadTrigger}
            />
          ) : currentTab === 'photos' ? (
            <PhotosPage
              searchQuery={searchQuery}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onSelectGroup={handleSelectGroup}
              onClickMedia={handleClickMedia}
              onOpenUpload={() => setIsUploadOpen(true)}
              onFavorite={handleFavoriteToggle}
              onRename={handleOpenRename}
              reloadTrigger={reloadTrigger}
            />
          ) : currentTab === 'videos' ? (
            <VideosPage
              searchQuery={searchQuery}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onSelectGroup={handleSelectGroup}
              onClickMedia={handleClickMedia}
              onOpenUpload={() => setIsUploadOpen(true)}
              onFavorite={handleFavoriteToggle}
              onRename={handleOpenRename}
              reloadTrigger={reloadTrigger}
            />
          ) : currentTab === 'audio' ? (
            <AudioPage
              searchQuery={searchQuery}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onSelectGroup={handleSelectGroup}
              onClickMedia={handleClickMedia}
              onOpenUpload={() => setIsUploadOpen(true)}
              onFavorite={handleFavoriteToggle}
              onRename={handleOpenRename}
              reloadTrigger={reloadTrigger}
            />
          ) : currentTab === 'folders' ? (
            <FoldersPage
              onOpenUpload={(folderId) => {
                setUploadFolderId(folderId || null);
                setIsUploadOpen(true);
              }}
              onClickMedia={handleClickMedia}
              reloadTrigger={reloadTrigger}
            />
          ) : currentTab === 'albums' ? (
            <AlbumsPage
              onSelectAlbum={album => setSelectedAlbum(album)}
              onOpenCreateAlbum={() => setIsCreateAlbumOpen(true)}
              onShareAlbum={handleOpenShareAlbum}
              reloadTrigger={reloadTrigger}
            />
          ) : currentTab === 'favorites' ? (
            <FavoritesPage
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onSelectGroup={handleSelectGroup}
              onClickMedia={handleClickMedia}
              onFavorite={handleFavoriteToggle}
              onRename={handleOpenRename}
              reloadTrigger={reloadTrigger}
            />
          ) : currentTab === 'archive' ? (
            <ArchivePage
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onSelectGroup={handleSelectGroup}
              onClickMedia={handleClickMedia}
              onFavorite={handleFavoriteToggle}
              onUnarchive={handleBulkUnarchive}
              onRename={handleOpenRename}
              reloadTrigger={reloadTrigger}
            />
          ) : currentTab === 'trash' ? (
            <TrashPage
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onSelectGroup={handleSelectGroup}
              onClickMedia={handleClickMedia}
              reloadTrigger={reloadTrigger}
              onActionComplete={triggerReload}
            />
          ) : currentTab === 'storage' ? (
            <StoragePage />
          ) : currentTab === 'settings' ? (
            <SettingsPage />
          ) : (
            <PhotosPage
              searchQuery={searchQuery}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onSelectGroup={handleSelectGroup}
              onClickMedia={handleClickMedia}
              onOpenUpload={() => setIsUploadOpen(true)}
              onFavorite={handleFavoriteToggle}
              onRename={handleOpenRename}
              reloadTrigger={reloadTrigger}
            />
          )}
        </main>
      </div>

      {/* Persistent Background Music Mini-Player (Desktop & Mobile) */}
      <PersistentMiniPlayer />

      {/* Floating Multi-Select Toolbar */}
      <MultiSelectBar
        selectedCount={selectedIds.length}
        currentTab={currentTab}
        onClear={handleClearSelection}
        onDownloadZip={handleBulkDownloadZip}
        onFavorite={handleBulkFavorite}
        onArchive={handleBulkArchive}
        onUnarchive={handleBulkUnarchive}
        onAddToAlbum={() => setIsAddToAlbumOpen(true)}
        onAddToPlaylist={() => setIsAddToPlaylistOpen(true)}
        onTrash={handleBulkTrash}
        onRename={() => {
          const found = currentMediaList.find(m => m.id === selectedIds[0]);
          if (found) {
            handleOpenRename(found);
          } else {
            mediaApi.getById(selectedIds[0]).then(res => {
              if (res.success && res.data) handleOpenRename(res.data);
            }).catch(() => {});
          }
        }}
      />

      {/* Bottom Navigation (Mobile) */}
      <BottomNavigation
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        onOpenMobileMenu={() => setIsMobileDrawerOpen(true)}
      />

      {/* Fullscreen Photo Viewer */}
      {activeMedia && !isVideoActive && !isAudioActive && (
        <PhotoViewer
          media={activeMedia}
          mediaList={currentMediaList}
          onClose={() => setActiveMedia(null)}
          onNavigate={m => setActiveMedia(m)}
          onFavorite={handleFavoriteToggle}
          onTrash={handleTrashMedia}
          onShare={handleOpenShareMedia}
          onRename={handleRenameMedia}
          onArchive={handleSingleArchive}
        />
      )}

      {/* Fullscreen Video Player */}
      {activeMedia && isVideoActive && (
        <VideoPlayer
          media={activeMedia}
          onClose={() => setActiveMedia(null)}
          onFavorite={handleFavoriteToggle}
          onTrash={handleTrashMedia}
          onShare={handleOpenShareMedia}
          onRename={handleRenameMedia}
          onArchive={handleSingleArchive}
        />
      )}

      {/* Mobile Vertical Navigation Drawer */}
      <MobileDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        currentTab={selectedAlbum ? 'albums' : currentTab}
        onSelectTab={handleSelectTab}
      />

      {/* Rename File Modal */}
      <RenameModal
        isOpen={isRenameModalOpen}
        media={renameTarget}
        onClose={() => {
          setIsRenameModalOpen(false);
          setRenameTarget(null);
        }}
        onSave={handleRenameMedia}
      />

      {/* Upload Modal (Resumable 5 TB Upload Engine) */}
      <UploadModal
        isOpen={isUploadOpen}
        folderId={uploadFolderId}
        onClose={() => {
          setIsUploadOpen(false);
          setUploadFolderId(null);
        }}
        onUploadComplete={handleUploadComplete}
      />

      {/* Create Album Modal */}
      <CreateAlbumModal
        isOpen={isCreateAlbumOpen}
        onClose={() => setIsCreateAlbumOpen(false)}
        onAlbumCreated={triggerReload}
        initialMediaIds={selectedIds.length > 0 ? selectedIds : undefined}
      />

      {/* Add To Album Modal */}
      <AddToAlbumModal
        isOpen={isAddToAlbumOpen}
        onClose={() => setIsAddToAlbumOpen(false)}
        mediaIds={selectedIds}
        onSuccess={() => {
          handleClearSelection();
          triggerReload();
        }}
      />

      {/* Add To Playlist Modal */}
      <AddToPlaylistModal
        isOpen={isAddToPlaylistOpen}
        onClose={() => setIsAddToPlaylistOpen(false)}
        mediaIds={selectedIds}
        onSuccess={() => {
          handleClearSelection();
          triggerReload();
        }}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => {
          setIsShareModalOpen(false);
          setShareMedia(null);
          setShareAlbum(null);
        }}
        media={shareMedia}
        album={shareAlbum}
      />
    </div>
  );
};

export default App;
