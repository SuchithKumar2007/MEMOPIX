import React, { useEffect, useState } from 'react';
import { ShieldCheck, HardDrive, Sparkles, Film, Image as ImageIcon, Music, Zap, Lock } from 'lucide-react';

interface SplashScreenProps {
  onFinish?: () => void;
  minDuration?: number; // milliseconds
  isLoading?: boolean;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinish,
  minDuration = 2200,
  isLoading = false
}) => {
  const [progress, setProgress] = useState<number>(0);
  const [statusText, setStatusText] = useState<string>('Initializing MEMOPIX Secure Core...');
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);
  const [isDone, setIsDone] = useState<boolean>(false);

  useEffect(() => {
    const startTime = Date.now();
    const interval = 25; // 40fps progress tick

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      let pct = Math.min(Math.round((elapsed / minDuration) * 100), 100);

      // If app is still loading after min duration, hold at 96%
      if (pct >= 96 && isLoading) {
        pct = 96;
        setStatusText('Connecting to 5 TB Private Vault...');
      } else if (pct < 25) {
        setStatusText('Initializing MEMOPIX Secure Core...');
      } else if (pct < 55) {
        setStatusText('Mounting 5,000 GB High-Speed Storage Engine...');
      } else if (pct < 85) {
        setStatusText('Preparing Photos, Unlimited Videos & Music Studio...');
      } else {
        setStatusText('Welcome to MEMOPIX');
      }

      setProgress(pct);

      if (elapsed >= minDuration && !isLoading) {
        clearInterval(timer);
        setProgress(100);
        setStatusText('Welcome to MEMOPIX');
        setIsFadingOut(true);
        setTimeout(() => {
          setIsDone(true);
          onFinish?.();
        }, 650);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [minDuration, isLoading, onFinish]);

  if (isDone) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#05070D] text-white selection:bg-brand-500 overflow-hidden transition-all duration-700 ease-out ${
        isFadingOut ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Background ambient lighting halos */}
      <div className="absolute -top-48 -left-48 w-[500px] h-[500px] bg-gradient-to-br from-brand-600/25 to-cyan-500/10 rounded-full blur-[140px] pointer-events-none animate-pulse" />
      <div className="absolute -bottom-48 -right-48 w-[500px] h-[500px] bg-gradient-to-tl from-purple-600/25 to-pink-500/10 rounded-full blur-[140px] pointer-events-none animate-pulse" style={{ animationDelay: '1.2s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] bg-cyan-500/15 rounded-full blur-[120px] pointer-events-none" />

      {/* Cybernetic background grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293d14_1px,transparent_1px),linear-gradient(to_bottom,#1f293d14_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Main Content Container */}
      <div className="relative z-10 flex flex-col items-center max-w-sm w-full px-6 text-center space-y-7">
        
        {/* Animated Brand Emblem with multi-layered glowing rings */}
        <div className="relative group">
          {/* Outer rotating pulse aura */}
          <div className="absolute -inset-6 rounded-full bg-gradient-to-r from-brand-500 via-cyan-400 to-purple-600 opacity-30 blur-xl animate-pulse" />
          
          {/* Orbital spinning decorative ring */}
          <div className="absolute -inset-3 rounded-3xl border border-cyan-400/20 animate-spin" style={{ animationDuration: '12s' }} />

          {/* Logo container card */}
          <div className="relative w-28 h-28 rounded-3xl bg-gradient-to-b from-[#141B2D] via-[#0E1424] to-[#080C16] border border-white/15 shadow-[0_0_40px_rgba(12,142,233,0.35)] flex items-center justify-center p-3.5 backdrop-blur-2xl">
            <img
              src="/icon-192.png"
              alt="MEMOPIX Logo"
              className="w-20 h-20 object-contain drop-shadow-[0_0_25px_rgba(12,142,233,0.7)] transform hover:scale-105 transition-transform duration-300"
            />
          </div>

          {/* Feature Badge: Photos */}
          <div 
            className="absolute -top-2.5 -right-2.5 w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-400/50 backdrop-blur-md flex items-center justify-center shadow-[0_0_12px_rgba(34,211,238,0.4)] animate-bounce" 
            style={{ animationDuration: '3s' }}
            title="High-Resolution Photos"
          >
            <ImageIcon className="w-4 h-4 text-cyan-300" />
          </div>

          {/* Feature Badge: Videos */}
          <div 
            className="absolute -bottom-2.5 -left-2.5 w-8 h-8 rounded-full bg-purple-500/20 border border-purple-400/50 backdrop-blur-md flex items-center justify-center shadow-[0_0_12px_rgba(168,85,247,0.4)] animate-bounce" 
            style={{ animationDuration: '3.5s', animationDelay: '0.6s' }}
            title="Unlimited HD/4K MP4 Videos"
          >
            <Film className="w-4 h-4 text-purple-300" />
          </div>

          {/* Feature Badge: Music */}
          <div 
            className="absolute -bottom-2.5 -right-2.5 w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-400/50 backdrop-blur-md flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.4)] animate-bounce" 
            style={{ animationDuration: '4s', animationDelay: '1.2s' }}
            title="MP3 Music Studio"
          >
            <Music className="w-4 h-4 text-emerald-300" />
          </div>
        </div>

        {/* Brand Title & Tagline */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-brand-500/10 via-cyan-500/10 to-purple-500/10 border border-cyan-400/30 text-[11px] font-bold text-cyan-300 backdrop-blur-md shadow-inner">
            <Sparkles className="w-3 h-3 text-cyan-400 animate-spin" style={{ animationDuration: '5s' }} />
            <span>5 TB PRIVATE CLOUD</span>
            <span className="w-1 h-1 rounded-full bg-cyan-400" />
            <span className="text-[10px] text-gray-400 font-mono">ENCRYPTED</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black tracking-wider uppercase font-sans">
            <span className="text-white drop-shadow-[0_2px_12px_rgba(255,255,255,0.25)]">MEMO</span>
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent drop-shadow-[0_2px_20px_rgba(12,142,233,0.6)]">
              PIX
            </span>
          </h1>

          <p className="text-xs text-gray-400 tracking-wide font-medium">
            Preserve Every Moment • No Limits • Android & Desktop
          </p>
        </div>

        {/* Progress Bar & Real-Time Status */}
        <div className="w-full space-y-3 pt-1">
          {/* Progress bar track */}
          <div className="relative w-full h-2 bg-gray-900/90 rounded-full overflow-hidden border border-white/10 shadow-inner p-0.5">
            <div
              className="h-full bg-gradient-to-r from-brand-500 via-cyan-400 to-purple-500 rounded-full transition-all duration-150 ease-out shadow-[0_0_15px_rgba(34,211,238,0.9)]"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Dynamic Status Text & Percentage */}
          <div className="flex items-center justify-between text-[11px] text-gray-400 font-mono px-1">
            <span className="truncate text-left text-gray-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping inline-block" />
              {statusText}
            </span>
            <span className="font-bold text-cyan-400 pl-2">
              {progress}%
            </span>
          </div>
        </div>

        {/* Specs Footer Badge */}
        <div className="flex items-center justify-center gap-3 text-[10px] text-gray-400 border-t border-white/5 pt-4 w-full">
          <span className="flex items-center gap-1 text-cyan-400 font-medium">
            <HardDrive className="w-3 h-3" /> 5,000 GB
          </span>
          <span>•</span>
          <span className="flex items-center gap-1 text-purple-400 font-medium">
            <Zap className="w-3 h-3" /> Unlimited MP4
          </span>
          <span>•</span>
          <span className="flex items-center gap-1 text-emerald-400 font-medium">
            <ShieldCheck className="w-3 h-3" /> End-to-End Safe
          </span>
        </div>

      </div>
    </div>
  );
};
