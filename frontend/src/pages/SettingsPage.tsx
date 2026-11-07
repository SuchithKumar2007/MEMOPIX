import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Lock,
  Shield,
  Moon,
  Sun,
  Monitor,
  Share2,
  HardDrive,
  CheckCircle2,
  LogOut,
  Server
} from 'lucide-react';
import { PasswordInput } from '../components/PasswordInput';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { userApi, getApiBase } from '../services/api';

export const SettingsPage: React.FC = () => {
  const { user, logout, refreshProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const { success, error } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Backend server failover state
  const [activeServerUrl, setActiveServerUrl] = useState<string>(() => getApiBase());
  const [customBackendInput, setCustomBackendInput] = useState<string>(() => localStorage.getItem('memopix_custom_backend_url') || '');
  const [isTestingBackend, setIsTestingBackend] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'checking' | 'idle'>('idle');

  useEffect(() => {
    checkActiveBackend();
  }, []);

  const checkActiveBackend = async () => {
    setConnectionStatus('checking');
    try {
      const base = getApiBase();
      const res = await fetch(`${base}/health`, { method: 'GET' });
      if (res.ok) {
        setConnectionStatus('connected');
      } else {
        setConnectionStatus('idle');
      }
    } catch {
      setConnectionStatus('idle');
    }
  };

  const handleTestAndSaveBackend = async () => {
    const raw = customBackendInput.trim();
    if (!raw) {
      error('Please enter a valid backend server URL.');
      return;
    }
    setIsTestingBackend(true);
    try {
      const clean = raw.replace(/\/$/, '');
      const testUrl = clean.endsWith('/api') ? `${clean}/health` : `${clean}/api/health`;
      const res = await fetch(testUrl, { method: 'GET' });
      if (!res.ok) throw new Error('Health check failed');
      localStorage.setItem('memopix_custom_backend_url', clean);
      setActiveServerUrl(getApiBase());
      setConnectionStatus('connected');
      success('Connected successfully! Backend failover applied.');
    } catch {
      error('Could not reach backend at that URL. Check the address and try again.');
    } finally {
      setIsTestingBackend(false);
    }
  };

  const handleResetBackend = () => {
    localStorage.removeItem('memopix_custom_backend_url');
    setCustomBackendInput('');
    setActiveServerUrl(getApiBase());
    checkActiveBackend();
    success('Reset to default Render production backend.');
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      await userApi.updateProfile({ name: name.trim(), avatarUrl: avatarUrl.trim() || undefined });
      await refreshProfile();
      success('Profile updated successfully.');
    } catch {
      error('Failed to update profile.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      error('New password must contain at least 8 characters.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      error('New passwords do not match.');
      return;
    }

    setIsChangingPassword(true);
    try {
      await userApi.changePassword({ currentPassword, newPassword, confirmNewPassword });
      success('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      error(err.response?.data?.message || 'Current password does not match.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-8 pb-16">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
          Settings & Account
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Manage your MEMOPIX profile, security, and cloud preferences
        </p>
      </div>

      {/* Account Profile Section */}
      <section className="bg-white dark:bg-[#121824] border border-gray-200 dark:border-[#26334D] rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-[#26334D]">
          <div className="p-2.5 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-500">
            <UserIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              Account Information
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Your registered email and display name
            </p>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5 block">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#1A2234] border border-gray-200 dark:border-[#26334D] focus:border-brand-500 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5 block">
                Email Address
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-4 py-2.5 bg-gray-100 dark:bg-[#1A2234]/50 border border-gray-200 dark:border-[#26334D] rounded-xl text-sm text-gray-500 dark:text-gray-400 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isUpdatingProfile}
              className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              {isUpdatingProfile ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </section>

      {/* Security: Change Password */}
      <section className="bg-white dark:bg-[#121824] border border-gray-200 dark:border-[#26334D] rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-[#26334D]">
          <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-500">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              Security & Password
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Update your password to keep your memories secure
            </p>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <PasswordInput
            label="Current Password"
            name="currentPassword"
            required
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
            placeholder="••••••••"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <PasswordInput
              label="New Password"
              name="newPassword"
              required
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              helperText="Minimum 8 characters"
            />

            <PasswordInput
              label="Confirm New Password"
              name="confirmNewPassword"
              required
              value={confirmNewPassword}
              onChange={e => setConfirmNewPassword(e.target.value)}
              placeholder="Repeat new password"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isChangingPassword}
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              {isChangingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </section>

      {/* Privacy & Appearance */}
      <section className="bg-white dark:bg-[#121824] border border-gray-200 dark:border-[#26334D] rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-[#26334D]">
          <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-500">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              Privacy & Appearance
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Default access and theme settings
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#1A2234] rounded-2xl border border-gray-200 dark:border-[#26334D]">
            <div>
              <p className="text-xs font-bold text-gray-900 dark:text-white">
                Default Media Visibility
              </p>
              <p className="text-[11px] text-gray-400">
                All uploaded photos and videos are private by default
              </p>
            </div>
            <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-full">
              PRIVATE
            </span>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-[#1A2234] rounded-2xl border border-gray-200 dark:border-[#26334D] space-y-3">
            <div>
              <p className="text-xs font-bold text-gray-900 dark:text-white">
                Theme Preference
              </p>
              <p className="text-[11px] text-gray-400">
                Choose how MEMOPIX looks on your device
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs font-bold border transition-all ${
                  theme === 'light'
                    ? 'border-brand-500 bg-white text-gray-900 shadow-sm'
                    : 'border-transparent text-gray-500 hover:bg-gray-200 dark:hover:bg-[#26334D]'
                }`}
              >
                <Sun className="w-4 h-4" />
                <span>Light</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs font-bold border transition-all ${
                  theme === 'dark'
                    ? 'border-brand-500 bg-brand-500 text-white shadow-sm'
                    : 'border-transparent text-gray-500 hover:bg-gray-200 dark:hover:bg-[#26334D]'
                }`}
              >
                <Moon className="w-4 h-4" />
                <span>Dark</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme('system')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs font-bold border transition-all ${
                  theme === 'system'
                    ? 'border-brand-500 bg-white dark:bg-[#26334D] text-gray-900 dark:text-white shadow-sm'
                    : 'border-transparent text-gray-500 hover:bg-gray-200 dark:hover:bg-[#26334D]'
                }`}
              >
                <Monitor className="w-4 h-4" />
                <span>System</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Cloud Server & Failover Connection */}
      <section className="bg-white dark:bg-[#121824] border border-gray-200 dark:border-[#26334D] rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-[#26334D]">
          <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              Cloud Backend & Server Failover
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Active API endpoint and zero-downtime failover settings
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-gray-50 dark:bg-[#1A2234] rounded-2xl border border-gray-200 dark:border-[#26334D] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-900 dark:text-white">
                  Active Server URL
                </p>
                <p className="text-[11px] text-gray-400 font-mono">
                  {activeServerUrl}
                </p>
              </div>
              <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full flex items-center gap-1.5 ${
                connectionStatus === 'connected'
                  ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                  : connectionStatus === 'checking'
                  ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'
                }`} />
                {connectionStatus === 'connected' ? 'ONLINE' : connectionStatus === 'checking' ? 'CHECKING...' : 'STANDBY'}
              </span>
            </div>

            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={customBackendInput}
                onChange={e => setCustomBackendInput(e.target.value)}
                placeholder="e.g. https://memopix-backend.koyeb.app"
                className="flex-1 bg-white dark:bg-[#121824] border border-gray-200 dark:border-[#26334D] rounded-xl px-3 py-2 text-xs font-mono text-gray-900 dark:text-white outline-none focus:border-brand-500"
              />
              <button
                type="button"
                onClick={handleTestAndSaveBackend}
                disabled={isTestingBackend}
                className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50"
              >
                {isTestingBackend ? 'Testing...' : 'Test & Apply'}
              </button>
              {localStorage.getItem('memopix_custom_backend_url') && (
                <button
                  type="button"
                  onClick={handleResetBackend}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 text-gray-600 dark:text-gray-300 rounded-xl text-xs font-bold transition-all"
                  title="Reset to default Render backend"
                >
                  Reset
                </button>
              )}
            </div>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed">
              💡 If Render free tier ever slows down or exhausts monthly bandwidth, deploy your backend for free on Koyeb (50 GB/month, no card required) and paste its URL here to switch seamlessly with zero downtime.
            </p>
          </div>
        </div>
      </section>

      {/* Logout Action */}
      <div className="flex justify-end">
        <button
          onClick={logout}
          className="flex items-center gap-2 px-5 py-2.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-300 text-xs font-bold rounded-xl transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out from Account</span>
        </button>
      </div>
    </div>
  );
};
