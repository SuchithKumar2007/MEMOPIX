import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

/**
 * GoogleCallbackPage
 * This page is loaded after Google redirects back with:
 *   /auth/google/callback?token=JWT&name=...&email=...
 * It stores the token, then auto-navigates to the main app.
 */
export const GoogleCallbackPage: React.FC = () => {
  const [status, setStatus] = useState<'processing' | 'error'>('processing');
  const { loginWithToken } = useAuth();
  const { success, error } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const name = params.get('name');
    const errorParam = params.get('error');

    if (errorParam) {
      setStatus('error');
      error('Google sign-in failed. Please try again.');
      setTimeout(() => { window.location.href = '/login'; }, 2500);
      return;
    }

    if (!token) {
      setStatus('error');
      error('No authentication token received.');
      setTimeout(() => { window.location.href = '/login'; }, 2500);
      return;
    }

    // Hand token to AuthContext — it will store it and fetch user profile
    loginWithToken(token).then(() => {
      success(`Welcome to MEMOPIX${name ? `, ${name}` : ''}! 🎉`);
    }).catch(() => {
      setStatus('error');
      error('Authentication failed. Please try again.');
      setTimeout(() => { window.location.href = '/login'; }, 2500);
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0B0F17] flex items-center justify-center">
      <div className="text-center space-y-4">
        <img src="/logo.png" alt="MEMOPIX" className="w-16 h-16 object-contain mx-auto" />
        {status === 'processing' ? (
          <>
            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Signing you in with Google...
            </p>
          </>
        ) : (
          <p className="text-sm font-medium text-rose-500">
            Sign-in failed. Redirecting to login...
          </p>
        )}
      </div>
    </div>
  );
};
