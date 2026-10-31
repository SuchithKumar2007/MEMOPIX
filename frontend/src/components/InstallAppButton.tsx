import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Monitor, CheckCircle2 } from 'lucide-react';

export const InstallAppButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);

  useEffect(() => {
    // Check if running in standalone PWA window
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    ) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      console.log('[MEMOPIX] PWA install prompt ready');
    };

    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowModal(false);
      console.log('[MEMOPIX] App installed successfully');
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (isInstalled) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setIsInstalled(true);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.warn('Install prompt error:', err);
        setShowModal(true);
      }
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      <button
        onClick={handleInstallClick}
        title="Install MEMOPIX as a native app on Android, Laptop, or Windows"
        className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-brand-500/20 to-purple-500/20 hover:from-brand-500/30 hover:to-purple-500/30 text-brand-600 dark:text-cyan-400 border border-brand-500/30 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
      >
        <Download className="w-3.5 h-3.5 text-cyan-400" />
        <span className="hidden sm:inline">Install App</span>
      </button>

      {/* Interactive Install Guide Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-[#121824] border border-[#26334D] rounded-3xl p-6 shadow-2xl space-y-5 text-white animate-slide-up">
            
            {/* Close button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 p-2.5 flex items-center justify-center shadow-lg">
                <img src="/icon-192.png" alt="MEMOPIX" className="w-full h-full object-contain" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Install MEMOPIX</h3>
                <p className="text-xs text-gray-400">Full App for Android, Windows & Laptop</p>
              </div>
            </div>

            {/* Direct Trigger Button if deferredPrompt became available */}
            {deferredPrompt && (
              <button
                onClick={handleInstallClick}
                className="w-full py-3 px-4 bg-gradient-to-r from-brand-500 to-cyan-500 hover:from-brand-600 hover:to-cyan-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-brand-500/30 flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <Download className="w-4 h-4" />
                Tap to Install Immediately
              </button>
            )}

            {/* Step-by-Step Instructions */}
            <div className="space-y-3 text-xs">
              {/* Android Instructions */}
              <div className="p-3.5 rounded-2xl bg-[#1A2234] border border-[#26334D]/60 space-y-2">
                <div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm">
                  <Smartphone className="w-4 h-4" />
                  <span>On Android (Chrome / Samsung Internet)</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-gray-300 pl-1 leading-relaxed">
                  <li>Tap the <strong>three dots menu (⋮)</strong> at the top-right of your browser.</li>
                  <li>Tap <strong>"Install app"</strong> (or <strong>"Add to Home screen"</strong>).</li>
                  <li>Confirm <strong>"Install"</strong>. MEMOPIX will appear on your home screen!</li>
                </ol>
              </div>

              {/* Windows/Laptop Instructions */}
              <div className="p-3.5 rounded-2xl bg-[#1A2234] border border-[#26334D]/60 space-y-2">
                <div className="flex items-center gap-2 text-purple-400 font-semibold text-sm">
                  <Monitor className="w-4 h-4" />
                  <span>On Windows PC & Laptop (Edge / Chrome)</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-gray-300 pl-1 leading-relaxed">
                  <li>Look at your browser address bar on the right side.</li>
                  <li>Click the <strong>Install icon (🖥️ or ⬇️)</strong> in the URL bar.</li>
                  <li>Click <strong>"Install"</strong> to add MEMOPIX to your Taskbar and Desktop!</li>
                </ol>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] text-gray-400">
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> Fullscreen standalone mode
              </span>
              <span>5 TB Private Cloud</span>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
