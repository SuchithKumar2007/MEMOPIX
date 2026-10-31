import React, { useState } from 'react';
import { Cloud, Lock, CheckCircle2 } from 'lucide-react';
import { PasswordInput } from '../components/PasswordInput';
import { authApi } from '../services/api';
import { useToast } from '../context/ToastContext';

interface ResetPasswordPageProps {
  onNavigate: (route: string) => void;
}

export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({ onNavigate }) => {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { success } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (password.length < 8) {
      setErrorMsg('Password must contain at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (!token) {
      setErrorMsg('Invalid or missing reset token in URL.');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.resetPassword({
        token,
        password,
        confirmPassword
      });
      setIsSuccess(true);
      success('Password reset successfully!');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Password reset token is invalid or has expired.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0B0F17] flex items-center justify-center p-4 selection:bg-brand-500 selection:text-white transition-colors">
      <div className="max-w-md w-full bg-white dark:bg-[#121824] border border-gray-200 dark:border-[#26334D] rounded-3xl p-8 shadow-2xl space-y-6 animate-slide-up">
        <div className="text-center space-y-2">
          <img src="/logo.png" alt="MEMOPIX Logo" className="w-16 h-16 object-contain mx-auto" />
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Set New Password
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Create a secure password for your MEMOPIX account
          </p>
        </div>

        {isSuccess ? (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                Password Reset Complete!
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                You can now sign in with your new password.
              </p>
            </div>

            <button
              onClick={() => onNavigate('login')}
              className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm rounded-xl transition-all shadow-md"
            >
              Go to Login
            </button>
          </div>
        ) : (
          <>
            {errorMsg && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-600 dark:text-rose-300 font-medium">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <PasswordInput
                label="New Password"
                name="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                helperText="Minimum 8 characters"
              />

              <PasswordInput
                label="Confirm New Password"
                name="confirmPassword"
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
              />

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 active:scale-95 text-white font-bold text-sm rounded-xl shadow-lg shadow-brand-500/25 transition-all disabled:opacity-50"
              >
                {isLoading ? 'Updating Password...' : 'Reset Password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
