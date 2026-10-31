import React, { useState } from 'react';
import {
  HardDrive,
  Image,
  Video,
  Music,
  File,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { StorageStats } from '../types';
import { storageApi } from '../services/api';
import { formatBytes } from '../utils/formatters';
import { useToast } from '../context/ToastContext';

interface StorageCardProps {
  storage: StorageStats | null;
  onRefresh: () => void;
}

export const StorageCard: React.FC<StorageCardProps> = ({ storage, onRefresh }) => {
  const [isRecalculating, setIsRecalculating] = useState(false);
  const { success, error } = useToast();

  const handleRecalculate = async () => {
    setIsRecalculating(true);
    try {
      await storageApi.recalculate();
      success('Storage quota recalculated directly from database!');
      onRefresh();
    } catch (err: any) {
      error('Failed to recalculate storage.');
    } finally {
      setIsRecalculating(false);
    }
  };

  const used = storage?.usedBytes || 0;
  const limit = storage?.limitBytes || 5000000000000;
  const remaining = storage?.remainingBytes || 5000000000000;
  const percent = storage?.percentageUsed || 0;

  const photosBytes = storage?.photosBytes || 0;
  const videosBytes = storage?.videosBytes || 0;
  const audioBytes = storage?.audioBytes || 0;
  const otherBytes = storage?.otherBytes || 0;

  const photosPct = limit > 0 ? (photosBytes / limit) * 100 : 0;
  const videosPct = limit > 0 ? (videosBytes / limit) * 100 : 0;
  const audioPct = limit > 0 ? (audioBytes / limit) * 100 : 0;
  const otherPct = limit > 0 ? (otherBytes / limit) * 100 : 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* 5 TB Storage Overview Banner */}
      <div className="bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 text-white rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
              <HardDrive className="w-7 h-7 text-brand-200" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight">
                Your 5 TB Private Storage
              </h2>
              <p className="text-xs text-brand-100 font-medium">
                5,000 GB High-Performance Cloud Quota
              </p>
            </div>
          </div>

          <button
            onClick={handleRecalculate}
            disabled={isRecalculating}
            className="flex items-center gap-2 px-4 py-2 bg-white/15 hover:bg-white/25 active:scale-95 rounded-xl text-xs font-bold backdrop-blur-md transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRecalculating ? 'animate-spin' : ''}`} />
            <span>Recalculate</span>
          </button>
        </div>

        {/* Big numbers */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 relative z-10">
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl">
            <p className="text-xs text-brand-100 font-medium mb-1">Storage Used</p>
            <p className="text-2xl font-black">{storage?.formattedUsed || '0 B'}</p>
            <p className="text-[11px] text-brand-200 mt-0.5">{percent}% of 5 TB</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl">
            <p className="text-xs text-brand-100 font-medium mb-1">Storage Available</p>
            <p className="text-2xl font-black">{storage?.formattedRemaining || '5.00 TB'}</p>
            <p className="text-[11px] text-emerald-300 mt-0.5">Ready for memories</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl">
            <p className="text-xs text-brand-100 font-medium mb-1">Total Quota</p>
            <p className="text-2xl font-black">5.00 TB</p>
            <p className="text-[11px] text-brand-200 mt-0.5">5,000,000,000,000 B</p>
          </div>
        </div>

        {/* Multi-Segment Visual Progress Bar */}
        <div className="space-y-2 relative z-10">
          <div className="w-full bg-black/30 h-3.5 rounded-full overflow-hidden flex p-0.5 backdrop-blur-sm">
            <div
              className="bg-sky-400 h-full rounded-l-full transition-all duration-500"
              style={{ width: `${Math.max(photosPct, photosBytes > 0 ? 1 : 0)}%` }}
              title={`Photos: ${formatBytes(photosBytes)}`}
            />
            <div
              className="bg-amber-400 h-full transition-all duration-500"
              style={{ width: `${Math.max(videosPct, videosBytes > 0 ? 1 : 0)}%` }}
              title={`Videos: ${formatBytes(videosBytes)}`}
            />
            <div
              className="bg-purple-400 h-full transition-all duration-500"
              style={{ width: `${Math.max(audioPct, audioBytes > 0 ? 1 : 0)}%` }}
              title={`Music & Audio: ${formatBytes(audioBytes)}`}
            />
            <div
              className="bg-emerald-400 h-full rounded-r-full transition-all duration-500"
              style={{ width: `${Math.max(otherPct, otherBytes > 0 ? 1 : 0)}%` }}
              title={`Other: ${formatBytes(otherBytes)}`}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between text-xs text-brand-100 font-medium pt-1">
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                Photos ({formatBytes(photosBytes)})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                Videos ({formatBytes(videosBytes)})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                Audio ({formatBytes(audioBytes)})
              </span>
            </div>
            <span>{storage?.formattedRemaining || '5 TB'} remaining</span>
          </div>
        </div>
      </div>

      {/* Breakdown Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#121824] border border-gray-200 dark:border-[#26334D] p-5 rounded-3xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-sky-50 dark:bg-sky-950/40 text-sky-500 rounded-2xl">
            <Image className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Photos
            </p>
            <p className="text-xl font-extrabold text-gray-900 dark:text-white">
              {storage?.totalPhotos || 0}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatBytes(photosBytes)}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#121824] border border-gray-200 dark:border-[#26334D] p-5 rounded-3xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-500 rounded-2xl">
            <Video className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Videos (No Limit)
            </p>
            <p className="text-xl font-extrabold text-gray-900 dark:text-white">
              {storage?.totalVideos || 0}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatBytes(videosBytes)}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#121824] border border-gray-200 dark:border-[#26334D] p-5 rounded-3xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 dark:bg-purple-950/40 text-purple-500 rounded-2xl">
            <Music className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Music & Audio
            </p>
            <p className="text-xl font-extrabold text-gray-900 dark:text-white">
              {storage?.totalAudio || 0}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatBytes(audioBytes)}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#121824] border border-gray-200 dark:border-[#26334D] p-5 rounded-3xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 rounded-2xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Security Level
            </p>
            <p className="text-xl font-extrabold text-gray-900 dark:text-white">
              Private 256-bit
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              Owner-Only Isolation
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
