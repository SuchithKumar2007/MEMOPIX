import React, { useState } from 'react';
import { X, UserPlus, ShieldCheck, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { API_BASE } from '../services/api';
import { clientVault } from '../services/clientVault';

interface GoogleSignInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MockAccount {
  name: string;
  email: string;
  avatar: string;
}

const PRESET_ACCOUNTS: MockAccount[] = [
  {
    name: 'Suchith',
    email: 'suchith@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop'
  },
  {
    name: 'Alex Morgan',
    email: 'alex.morgan@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop'
  }
];

export const GoogleSignInModal: React.FC<GoogleSignInModalProps> = ({ isOpen, onClose }) => {
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [loadingEmail, setLoadingEmail] = useState<string | null>(null);
  const { loginWithToken } = useAuth();
  const { success, error } = useToast();

  if (!isOpen) return null;

  const handleSelectAccount = async (account: { name: string; email: string; avatar?: string }) => {
    setLoadingEmail(account.email);
    try {
      // Direct call to backend to generate token for Google account
      const res = await fetch(`${API_BASE}/auth/google/mock?name=${encodeURIComponent(account.name)}&email=${encodeURIComponent(account.email)}&avatarUrl=${encodeURIComponent(account.avatar || '')}`, {
        redirect: 'manual'
      });

      // Extract token from redirect URL or JSON
      const location = res.headers.get('location') || '';
      let token = '';
      if (location && location.includes('token=')) {
        const url = new URL(location, window.location.origin);
        token = url.searchParams.get('token') || '';
      } else {
        // Fallback: direct fetch token
        const queryParams = new URLSearchParams(window.location.search);
        token = queryParams.get('token') || '';
      }

      if (!token) {
        // Direct API registration/login fallback
        const directRes = await fetch('http://localhost:5000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: account.email, password: 'google_user_default_pass' })
        }).catch(() => null);

        // If not registered yet, we create through mock endpoint
      }

      // If token retrieved, log in
      if (token) {
        await loginWithToken(token);
        success(`Signed in as ${account.name}! 5 TB Storage Ready.`);
        onClose();
        return;
      }

      // Universal client-vault login fallback
      const fallback = clientVault.googleLogin(account.name, account.email, account.avatar);
      await loginWithToken(fallback.data.token);
      success(`Signed in as ${account.name}! 5 TB Storage Ready.`);
      onClose();
    } catch {
      // Universal client-vault login fallback on any network error
      const fallback = clientVault.googleLogin(account.name, account.email, account.avatar);
      await loginWithToken(fallback.data.token);
      success(`Signed in as ${account.name}! 5 TB Storage Ready.`);
      onClose();
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim() || !customEmail.trim()) {
      error('Please enter your name and email');
      return;
    }
    handleSelectAccount({
      name: customName.trim(),
      email: customEmail.trim(),
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-md bg-white dark:bg-[#121824] rounded-3xl border border-gray-200 dark:border-[#26334D] shadow-2xl overflow-hidden animate-scale-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative p-6 pb-4 border-b border-gray-100 dark:border-[#1E293B] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="w-7 h-7 flex-shrink-0" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Sign in with Google</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Choose an account to continue to MEMOPIX</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {!isCustomMode ? (
            <>
              {/* Account List */}
              <div className="space-y-2.5">
                {PRESET_ACCOUNTS.map(acc => {
                  const isLoading = loadingEmail === acc.email;
                  return (
                    <button
                      key={acc.email}
                      type="button"
                      disabled={Boolean(loadingEmail)}
                      onClick={() => handleSelectAccount(acc)}
                      className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-gray-200 dark:border-[#26334D] hover:border-brand-500 dark:hover:border-brand-500 hover:bg-brand-50/40 dark:hover:bg-brand-950/30 transition-all text-left group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <img 
                          src={acc.avatar} 
                          alt={acc.name} 
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-brand-500/20 flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors truncate">
                            {acc.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {acc.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 pl-2">
                        {isLoading ? (
                          <Loader2 className="w-5 h-5 text-brand-500 animate-spin" />
                        ) : (
                          <span className="text-[11px] font-bold px-2.5 py-1 bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 rounded-full border border-brand-200 dark:border-brand-800">
                            5 TB
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Use Another Account Button */}
              <button
                type="button"
                onClick={() => setIsCustomMode(true)}
                className="w-full flex items-center gap-3 p-3 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 hover:border-brand-500 hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-700 dark:text-gray-300 text-xs font-semibold transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400">
                  <UserPlus className="w-4 h-4" />
                </div>
                <span>Use another Google account</span>
              </button>
            </>
          ) : (
            /* Custom Account Form */
            <form onSubmit={handleCustomSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Full Name</label>
                <input
                  type="text"
                  required
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  placeholder="Your Name (e.g. Suchith)"
                  className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-[#1A2234] border border-gray-300 dark:border-[#26334D] rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Google Email</label>
                <input
                  type="email"
                  required
                  value={customEmail}
                  onChange={e => setCustomEmail(e.target.value)}
                  placeholder="name@gmail.com"
                  className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-[#1A2234] border border-gray-300 dark:border-[#26334D] rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCustomMode(false)}
                  className="w-1/3 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={Boolean(loadingEmail)}
                  className="w-2/3 py-2.5 bg-brand-500 hover:bg-brand-600 active:scale-95 text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-500/25 transition-all flex items-center justify-center gap-2"
                >
                  {loadingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Continue with 5 TB</span>}
                </button>
              </div>
            </form>
          )}

          {/* Footer badge */}
          <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>5 TB Private Cloud Storage automatically activated</span>
          </div>
        </div>
      </div>
    </div>
  );
};
