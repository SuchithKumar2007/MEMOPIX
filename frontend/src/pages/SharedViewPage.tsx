import React, { useState, useEffect } from 'react';
import { Cloud, Download, Heart, Eye, Play, Lock, AlertCircle, Calendar, HardDrive } from 'lucide-react';
import { shareApi } from '../services/api';
import { formatBytes, formatDuration } from '../utils/formatters';
import { format, parseISO } from 'date-fns';

export const SharedViewPage: React.FC = () => {
  const [token, setToken] = useState<string>('');
  const [resource, setResource] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // Extract token from URL /share/:token or ?token=
    const pathname = window.location.pathname;
    const parts = pathname.split('/share/');
    let shareToken = '';

    if (parts.length > 1) {
      shareToken = parts[1].split('/')[0];
    } else {
      const searchParams = new URLSearchParams(window.location.search);
      shareToken = searchParams.get('token') || '';
    }

    setToken(shareToken);

    if (shareToken) {
      loadSharedResource(shareToken);
    } else {
      setIsLoading(false);
      setErrorMsg('No share token provided.');
    }
  }, []);

  const loadSharedResource = async (shareToken: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await shareApi.getPublic(shareToken);
      if (res.success && res.data) {
        setResource(res.data);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'This share link has expired or has been disabled.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0B0F17] flex items-center justify-center p-4">
        <div className="text-center space-y-3 animate-pulse">
          <div className="w-12 h-12 rounded-2xl bg-brand-500/20 text-brand-500 flex items-center justify-center mx-auto">
            <Cloud className="w-6 h-6 animate-spin" />
          </div>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Loading shared memory...
          </p>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0B0F17] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-[#121824] border border-gray-200 dark:border-[#26334D] rounded-3xl p-8 text-center shadow-xl space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-500 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Link Unavailable
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {errorMsg}
          </p>
          <a
            href="/login"
            className="inline-block px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs rounded-xl transition-all shadow-md mt-2"
          >
            Go to MEMOPIX Cloud
          </a>
        </div>
      </div>
    );
  }

  const isMedia = resource?.type === 'media';
  const item = isMedia ? resource.item : null;
  const album = !isMedia ? resource.album : null;
  const isVideo = item?.mimeType?.startsWith('video/');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0B0F17] text-gray-900 dark:text-gray-100 flex flex-col selection:bg-brand-500 selection:text-white">
      {/* Top Public Header */}
      <header className="h-16 px-6 bg-white/80 dark:bg-[#121824]/80 backdrop-blur-md border-b border-gray-200 dark:border-[#26334D] flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="MEMOPIX Logo" className="w-9 h-9 object-contain" />
          <div>
            <span className="font-extrabold text-base tracking-tight">MEMOPIX</span>
            <span className="ml-2 text-[10px] uppercase font-bold bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 px-1.5 py-0.5 rounded-full">
              Shared
            </span>
          </div>
        </div>

        {resource?.allowDownload && isMedia && item && (
          <a
            href={item.downloadUrl}
            download={item.title}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Download</span>
          </a>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full p-4 sm:p-6 space-y-6">
        {isMedia && item && (
          <div className="bg-white dark:bg-[#121824] border border-gray-200 dark:border-[#26334D] rounded-3xl overflow-hidden shadow-xl">
            {/* Viewer Stage */}
            <div className="aspect-video sm:aspect-[16/10] bg-black/90 flex items-center justify-center relative overflow-hidden">
              {isVideo ? (
                <video
                  src={item.streamUrl}
                  controls
                  className="max-h-full max-w-full rounded-lg shadow-2xl"
                />
              ) : (
                <img
                  src={item.streamUrl}
                  alt={item.title}
                  className="max-h-full max-w-full object-contain shadow-2xl"
                />
              )}
            </div>

            {/* Meta Footer */}
            <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                  {item.title}
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {formatBytes(item.fileSize)} • {format(parseISO(item.createdAt), 'MMMM d, yyyy')}
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800 self-start sm:self-auto">
                <span>✓ Verified Secure Memory</span>
              </div>
            </div>
          </div>
        )}

        {!isMedia && album && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                {album.title}
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Shared Album • {album.itemCount} items
                {album.description && ` • ${album.description}`}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {album.items.map((mediaItem: any, idx: number) => (
                <div
                  key={idx}
                  className="aspect-square bg-gray-100 dark:bg-[#1A2234] rounded-2xl overflow-hidden border border-gray-200 dark:border-[#26334D] shadow-sm"
                >
                  <img
                    src={mediaItem.thumbnailUrl || mediaItem.streamUrl}
                    alt={mediaItem.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="py-6 text-center text-xs text-gray-400 border-t border-gray-200 dark:border-[#26334D]">
        MEMOPIX Cloud — “Every Picture Becomes Your Memories”
      </footer>
    </div>
  );
};
