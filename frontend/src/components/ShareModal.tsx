import React, { useState, useEffect } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  Calendar,
  Download,
  Lock,
  Globe,
  Trash2,
  Power
} from 'lucide-react';
import { shareApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import { MediaItem, Album } from '../types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  media?: MediaItem | null;
  album?: Album | null;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  media,
  album
}) => {
  const [accessType, setAccessType] = useState<'private' | 'public'>('public');
  const [expiresInDays, setExpiresInDays] = useState<number>(7);
  const [allowDownload, setAllowDownload] = useState<boolean>(true);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { success, error } = useToast();

  useEffect(() => {
    setGeneratedLink(null);
    setCopied(false);
  }, [media?.id, album?.id]);

  if (!isOpen || (!media && !album)) return null;

  const handleCreateShareLink = async () => {
    setIsLoading(true);
    try {
      const res = await shareApi.create({
        mediaId: media?.id,
        albumId: album?.id,
        expiresInDays,
        allowDownload
      });

      if (res.success && res.data) {
        setGeneratedLink(res.data.publicUrl);
        success('Secure share link created!');
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to generate share link.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const title = media ? media.originalName : album ? album.title : 'Memory';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#121824] border border-gray-200 dark:border-[#26334D] rounded-3xl max-w-md w-full p-6 shadow-2xl overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-500">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-gray-900 dark:text-white">
                Share Memory
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[220px]">
                {title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-5">
          {/* Access Mode */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2 block">
              Who can access?
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAccessType('private')}
                className={`flex items-center gap-2.5 p-3 rounded-2xl border text-xs font-semibold transition-all ${
                  accessType === 'private'
                    ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/30 text-brand-600 dark:text-brand-400'
                    : 'border-gray-200 dark:border-[#26334D] text-gray-600 dark:text-gray-400 hover:border-gray-300'
                }`}
              >
                <Lock className="w-4 h-4" />
                <span>Only me</span>
              </button>

              <button
                type="button"
                onClick={() => setAccessType('public')}
                className={`flex items-center gap-2.5 p-3 rounded-2xl border text-xs font-semibold transition-all ${
                  accessType === 'public'
                    ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/30 text-brand-600 dark:text-brand-400'
                    : 'border-gray-200 dark:border-[#26334D] text-gray-600 dark:text-gray-400 hover:border-gray-300'
                }`}
              >
                <Globe className="w-4 h-4" />
                <span>Anyone with link</span>
              </button>
            </div>
          </div>

          {accessType === 'public' && (
            <>
              {/* Expiration Options */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2 block">
                  Link Expiration
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { label: 'Never', days: 0 },
                    { label: '1 Day', days: 1 },
                    { label: '7 Days', days: 7 },
                    { label: '30 Days', days: 30 }
                  ].map(opt => (
                    <button
                      key={opt.days}
                      type="button"
                      onClick={() => setExpiresInDays(opt.days)}
                      className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                        expiresInDays === opt.days
                          ? 'border-brand-500 bg-brand-500 text-white shadow-md'
                          : 'border-gray-200 dark:border-[#26334D] text-gray-700 dark:text-gray-300 hover:border-gray-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Allow Download Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-[#1A2234] border border-gray-200 dark:border-[#26334D] rounded-2xl">
                <div className="flex items-center gap-2.5">
                  <Download className="w-4 h-4 text-brand-500" />
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white">
                      Allow Download
                    </p>
                    <p className="text-[11px] text-gray-400">
                      Recipients can save original files
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setAllowDownload(prev => !prev)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                    allowDownload ? 'bg-brand-500 justify-end' : 'bg-gray-300 dark:bg-gray-700 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 bg-white rounded-full shadow-md" />
                </button>
              </div>

              {/* Generated Link Display */}
              {generatedLink ? (
                <div className="space-y-2 pt-2">
                  <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    Public Share URL:
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={generatedLink}
                      className="flex-1 px-3 py-2 bg-gray-100 dark:bg-[#1A2234] border border-gray-200 dark:border-[#26334D] rounded-xl text-xs text-gray-700 dark:text-gray-300 select-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="px-3.5 py-2 bg-brand-500 hover:bg-brand-600 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all shrink-0"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleCreateShareLink}
                  disabled={isLoading}
                  className="w-full py-3 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 active:scale-95 text-white text-xs font-bold rounded-2xl shadow-lg shadow-brand-500/25 transition-all disabled:opacity-50"
                >
                  {isLoading ? 'Creating Share Link...' : 'Create Share Link'}
                </button>
              )}
            </>
          )}

          {accessType === 'private' && (
            <div className="p-4 bg-gray-50 dark:bg-[#1A2234] border border-gray-200 dark:border-[#26334D] rounded-2xl text-center space-y-2">
              <Lock className="w-6 h-6 text-gray-400 mx-auto" />
              <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                This memory is completely private.
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                Only your authenticated MEMOPIX account can access and view this file.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
