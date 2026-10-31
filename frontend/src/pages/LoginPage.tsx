import React, { useState, useEffect } from 'react';
import { Mail, ArrowRight, Server, CheckCircle2, AlertCircle, Sparkles, Settings } from 'lucide-react';
import { PasswordInput } from '../components/PasswordInput';
import { GoogleSignInModal } from '../components/GoogleSignInModal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { API_BASE, getApiBase } from '../services/api';

interface LoginPageProps {
  onNavigate: (route: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showServerModal, setShowServerModal] = useState(false);
  const [customServerUrl, setCustomServerUrl] = useState(
    () => localStorage.getItem('memopix_custom_backend_url') || ''
  );
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  const { login } = useAuth();
  const { success } = useToast();

  // Check health of currently targeted backend
  useEffect(() => {
    let isMounted = true;
    const checkServer = async () => {
      try {
        const base = getApiBase();
        const res = await fetch(`${base}/health`, { signal: AbortSignal.timeout(4000) });
        if (res.ok && isMounted) {
          setServerStatus('online');
        } else if (isMounted) {
          setServerStatus('offline');
        }
      } catch {
        if (isMounted) setServerStatus('offline');
      }
    };
    checkServer();
    return () => { isMounted = false; };
  }, [customServerUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    try {
      await login({ email: email.trim(), password, rememberMe });
      success('Welcome back to MEMOPIX!');
    } catch (err: any) {
      const serverMsg = err?.response?.data?.message;
      if (serverMsg) {
        setErrorMsg(serverMsg);
      } else {
        setErrorMsg('Login failed. Please check your email and password.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveServerUrl = () => {
    if (customServerUrl.trim()) {
      localStorage.setItem('memopix_custom_backend_url', customServerUrl.trim());
    } else {
      localStorage.removeItem('memopix_custom_backend_url');
    }
    setShowServerModal(false);
    window.location.reload();
  };

  const handleQuickFill = () => {
    setEmail('suchith@gmail.com');
    setPassword('password123');
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen bg-[#070A11] flex items-center justify-center p-4 selection:bg-brand-500 selection:text-white relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-brand-500/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-purple-600/15 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-md w-full bg-[#121824] border border-[#26334D] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative z-10 animate-slide-up backdrop-blur-xl">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="relative inline-block">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-b from-[#1E293B] to-[#0F172A] border border-white/10 shadow-xl flex items-center justify-center p-2.5 mx-auto">
              <img src="/icon-192.png" alt="MEMOPIX Logo" className="w-full h-full object-contain" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-brand-500/20 border border-brand-400 flex items-center justify-center">
              <Sparkles className="w-2.5 h-2.5 text-cyan-300" />
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            <span>MEMO</span>
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
              PIX
            </span>
          </h1>

          <p className="text-xs text-gray-400">
            Sign in to access your 5 TB private memory cloud
          </p>

          {/* Connection status pill */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-gray-300">
            <span
              className={`w-2 h-2 rounded-full ${
                serverStatus === 'online'
                  ? 'bg-emerald-400 animate-pulse'
                  : serverStatus === 'offline'
                  ? 'bg-rose-400'
                  : 'bg-amber-400 animate-ping'
              }`}
            />
            <span className="capitalize">
              {serverStatus === 'online' ? 'Cloud Server Online' : serverStatus === 'offline' ? 'Server Offline' : 'Connecting...'}
            </span>
            <button
              type="button"
              onClick={() => setShowServerModal(true)}
              className="text-gray-400 hover:text-cyan-400 transition-colors ml-1"
              title="Configure Server Address"
            >
              <Settings className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* 1-Click Google Login Button */}
        <button
          type="button"
          onClick={() => setIsGoogleModalOpen(true)}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#1A2234] hover:bg-[#222C42] border border-[#26334D] hover:border-gray-500 rounded-2xl text-sm font-semibold text-white transition-all shadow-md active:scale-95 group"
        >
          <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span>Continue with Google</span>
        </button>

        <GoogleSignInModal 
          isOpen={isGoogleModalOpen} 
          onClose={() => setIsGoogleModalOpen(false)} 
        />

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#26334D]" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[#121824] px-3 text-gray-500 font-semibold tracking-wider">
              Or sign in with email
            </span>
          </div>
        </div>

        {/* Error Alert with troubleshooting advice */}
        {errorMsg && (
          <div className="p-3.5 bg-rose-950/60 border border-rose-800/80 rounded-2xl text-xs text-rose-300 font-medium flex items-start gap-2.5 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p>{errorMsg}</p>
              {serverStatus === 'offline' && (
                <button
                  type="button"
                  onClick={() => setShowServerModal(true)}
                  className="text-cyan-400 underline font-semibold hover:text-cyan-300 block pt-0.5"
                >
                  Configure Server Address
                </button>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300">
              Email Address
            </label>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 text-gray-500 absolute left-3.5 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="suchith@gmail.com"
                className="w-full pl-10 pr-4 py-2.5 bg-[#1A2234] border border-[#26334D] focus:border-cyan-400 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 transition-all shadow-inner"
              />
            </div>
          </div>

          <PasswordInput
            label="Password"
            name="password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
          />

          {/* Remember Me + Forgot Password row */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-[#26334D] bg-[#1A2234] text-brand-500 focus:ring-brand-500/30"
              />
              <span className="text-xs font-medium text-gray-400">Remember me</span>
            </label>
            <button
              type="button"
              onClick={() => onNavigate('forgot-password')}
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 hover:underline"
            >
              Forgot Password?
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-brand-500 via-cyan-500 to-purple-600 hover:opacity-95 active:scale-95 text-white font-bold text-sm rounded-xl shadow-lg shadow-brand-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>{isLoading ? 'Connecting to Vault...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Fill Account */}
        <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
          <button
            type="button"
            onClick={handleQuickFill}
            className="text-gray-400 hover:text-cyan-400 transition-colors flex items-center gap-1 font-medium"
          >
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>Auto-fill Account</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('register')}
            className="font-bold text-cyan-400 hover:text-cyan-300 hover:underline"
          >
            Create Account
          </button>
        </div>
      </div>

      {/* Server Settings Modal (Vital for Android APK / Network connection) */}
      {showServerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="max-w-md w-full bg-[#121824] border border-[#26334D] rounded-3xl p-6 shadow-2xl space-y-4 text-white animate-slide-up">
            <div className="flex items-center gap-2 text-cyan-400">
              <Server className="w-5 h-5" />
              <h3 className="font-bold text-base">Backend Server Configuration</h3>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed">
              When running on an Android phone, APK, or remote laptop, you can specify your server address below:
            </p>

            <div className="space-y-1.5">
              <label className="text-xs text-gray-300 font-medium">Server Address (URL or IP)</label>
              <input
                type="text"
                value={customServerUrl}
                onChange={e => setCustomServerUrl(e.target.value)}
                placeholder="e.g. http://192.168.29.61:5000 or Cloudflare link"
                className="w-full px-3.5 py-2.5 bg-[#1A2234] border border-[#26334D] rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
              />
              <p className="text-[11px] text-gray-500">
                Leave empty to use automatic local defaults.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleSaveServerUrl}
                className="flex-1 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs rounded-xl transition-all shadow-md"
              >
                Save & Connect
              </button>
              <button
                type="button"
                onClick={() => setShowServerModal(false)}
                className="px-4 py-2.5 bg-[#1A2234] hover:bg-[#222C42] border border-[#26334D] text-gray-300 font-bold text-xs rounded-xl transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
