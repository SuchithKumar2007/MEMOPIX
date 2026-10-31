import React, { useState } from 'react';
import { Cloud, Mail, ArrowLeft, Send } from 'lucide-react';
import { authApi } from '../services/api';
import { useToast } from '../context/ToastContext';

interface ForgotPasswordPageProps {
  onNavigate: (route: string) => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const { success, error } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      error('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authApi.forgotPassword(email);
      setResetSent(true);
      if (res.data?.resetUrl) {
        setResetUrl(res.data.resetUrl);
      }
      success('Password reset link generated.');
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to request password reset.');
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
            Forgot Password?
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Enter your email to receive a password reset link
          </p>
        </div>

        {resetSent ? (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-center space-y-2">
              <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                Password Reset Link Generated!
              </p>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                If an account exists with that email, the reset link is ready.
              </p>
              {resetUrl && (
                <div className="mt-3 pt-3 border-t border-emerald-200 dark:border-emerald-800 text-left">
                  <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Direct Link (Dev Mode):</p>
                  <a
                    href={resetUrl}
                    className="text-xs text-brand-500 font-mono underline break-all"
                  >
                    {resetUrl}
                  </a>
                </div>
              )}
            </div>

            <button
              onClick={() => onNavigate('login')}
              className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs rounded-xl transition-all"
            >
              Back to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Email Address
              </label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#121824] border border-gray-300 dark:border-[#26334D] focus:border-brand-500 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all shadow-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 active:scale-95 text-white font-bold text-sm rounded-xl shadow-lg shadow-brand-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{isLoading ? 'Sending...' : 'Send Reset Link'}</span>
              <Send className="w-4 h-4" />
            </button>
          </form>
        )}

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => onNavigate('login')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Login</span>
          </button>
        </div>
      </div>
    </div>
  );
};
