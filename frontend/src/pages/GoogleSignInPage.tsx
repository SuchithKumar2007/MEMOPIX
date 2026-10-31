import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { API_BASE } from '../services/api';
import { clientVault } from '../services/clientVault';

interface GoogleSignInPageProps {
  onBack: () => void;
}

export const GoogleSignInPage: React.FC<GoogleSignInPageProps> = ({ onBack }) => {
  const [step, setStep] = useState<'email' | 'password'>('email');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { loginWithToken } = useAuth();
  const { success } = useToast();

  const handleEmailNext = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!email.trim()) {
      setErrorMessage('Enter an email or phone number');
      return;
    }
    // Extract a default name from email if not given
    const extractedName = email.split('@')[0] || 'User';
    const formattedName = extractedName.charAt(0).toUpperCase() + extractedName.slice(1);
    setName(formattedName);
    setStep('password');
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      // Call mock / real Google sign in handler
      const res = await fetch(
        `${API_BASE}/auth/google/mock?name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}&avatarUrl=${encodeURIComponent('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop')}`,
        { redirect: 'manual' }
      );

      // Handle redirect / token
      const location = res.headers.get('location') || '';
      let token = '';
      if (location && location.includes('token=')) {
        const url = new URL(location, window.location.origin);
        token = url.searchParams.get('token') || '';
      }

      if (token) {
        await loginWithToken(token);
        success(`Welcome, ${name}! Your 5 TB MEMOPIX Cloud is ready.`);
      } else {
        const fallback = clientVault.googleLogin(name, email);
        await loginWithToken(fallback.data.token);
        success(`Welcome, ${name}! Your 5 TB MEMOPIX Cloud is ready.`);
      }
    } catch {
      const fallback = clientVault.googleLogin(name, email);
      await loginWithToken(fallback.data.token);
      success(`Welcome, ${name}! Your 5 TB MEMOPIX Cloud is ready.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1f1f1f] text-[#e3e3e3] flex flex-col justify-between p-6 sm:p-12 font-sans selection:bg-[#a8c7fa] selection:text-[#041e49]">
      {/* Centered Google Auth Container */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-[1040px] bg-[#131314] rounded-[28px] border border-[#303030] p-9 sm:p-12 shadow-2xl transition-all">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14 items-start">
            
            {/* Left Column: Brand & Title */}
            <div className="space-y-4">
              {/* Google G Logo */}
              <div className="flex items-center gap-3">
                <svg className="w-10 h-10" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              </div>

              {step === 'email' ? (
                <>
                  <h1 className="text-3xl sm:text-4xl font-normal tracking-tight text-[#e3e3e3]">
                    Sign in
                  </h1>
                  <p className="text-sm sm:text-base text-[#c4c7c5] leading-relaxed pt-1">
                    with your Google Account to continue to <strong className="text-white font-medium">MEMOPIX</strong>. This account will be available to other Google apps in the browser.
                  </p>
                </>
              ) : (
                <>
                  <h1 className="text-3xl sm:text-4xl font-normal tracking-tight text-[#e3e3e3]">
                    Welcome
                  </h1>
                  {/* Account Pill with Avatar */}
                  <button
                    type="button"
                    onClick={() => setStep('email')}
                    className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-[#444746] hover:bg-[#282a2c] text-xs text-[#e3e3e3] transition-colors"
                  >
                    <div className="w-5 h-5 rounded-full bg-[#a8c7fa] text-[#041e49] font-bold flex items-center justify-center text-[10px]">
                      {name ? name.charAt(0) : 'U'}
                    </div>
                    <span className="font-medium truncate max-w-[200px]">{email}</span>
                    <svg className="w-3.5 h-3.5 text-[#c4c7c5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="m6 9 6 6 6-6"/>
                    </svg>
                  </button>
                </>
              )}
            </div>

            {/* Right Column: Form Inputs & Actions */}
            <div className="space-y-6 md:pt-4">
              {step === 'email' ? (
                /* Step 1: Email Form */
                <form onSubmit={handleEmailNext} className="space-y-6">
                  {/* Material 3 Outlined Input */}
                  <div className="relative">
                    <input
                      type="text"
                      id="google-email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      onFocus={() => setEmailFocused(true)}
                      onBlur={() => setEmailFocused(false)}
                      className={`w-full px-4 py-4 bg-transparent rounded-lg border text-sm text-[#e3e3e3] focus:outline-none transition-all ${
                        errorMessage 
                          ? 'border-[#f2b8b5] focus:border-[#f2b8b5]' 
                          : emailFocused || email
                            ? 'border-[#a8c7fa] ring-1 ring-[#a8c7fa]' 
                            : 'border-[#8e918f] hover:border-[#e3e3e3]'
                      }`}
                    />
                    <label
                      htmlFor="google-email"
                      className={`absolute left-3 px-1 transition-all pointer-events-none ${
                        emailFocused || email
                          ? '-top-2.5 bg-[#131314] text-xs ' + (errorMessage ? 'text-[#f2b8b5]' : 'text-[#a8c7fa]')
                          : 'top-4 text-sm text-[#c4c7c5]'
                      }`}
                    >
                      Email or phone
                    </label>
                  </div>

                  {errorMessage && (
                    <div className="flex items-center gap-2 text-xs text-[#f2b8b5]">
                      <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                      </svg>
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* Forgot Email Link */}
                  <div>
                    <button
                      type="button"
                      onClick={() => setEmail('suchith@gmail.com')}
                      className="text-sm font-medium text-[#a8c7fa] hover:underline"
                    >
                      Forgot email?
                    </button>
                  </div>

                  {/* Guest Mode Info */}
                  <p className="text-xs text-[#c4c7c5] leading-relaxed">
                    Not your computer? Use Guest mode to sign in privately.{' '}
                    <a href="#guest" className="text-[#a8c7fa] font-medium hover:underline">
                      Learn more about using Guest mode
                    </a>
                  </p>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-6">
                    <button
                      type="button"
                      onClick={onBack}
                      className="text-sm font-medium text-[#a8c7fa] hover:bg-[#282a2c] px-4 py-2 rounded-full transition-colors"
                    >
                      Create account
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-[#a8c7fa] hover:bg-[#c2e7ff] active:scale-95 text-[#041e49] font-medium text-sm rounded-full shadow transition-all"
                    >
                      Next
                    </button>
                  </div>
                </form>
              ) : (
                /* Step 2: Password Form */
                <form onSubmit={handleFinalSubmit} className="space-y-6 animate-fade-in">
                  {/* Password Input */}
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="google-password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                      placeholder=""
                      className={`w-full px-4 py-4 bg-transparent rounded-lg border text-sm text-[#e3e3e3] focus:outline-none transition-all ${
                        errorMessage 
                          ? 'border-[#f2b8b5] focus:border-[#f2b8b5]' 
                          : passwordFocused || password
                            ? 'border-[#a8c7fa] ring-1 ring-[#a8c7fa]' 
                            : 'border-[#8e918f] hover:border-[#e3e3e3]'
                      }`}
                    />
                    <label
                      htmlFor="google-password"
                      className={`absolute left-3 px-1 transition-all pointer-events-none ${
                        passwordFocused || password
                          ? '-top-2.5 bg-[#131314] text-xs ' + (errorMessage ? 'text-[#f2b8b5]' : 'text-[#a8c7fa]')
                          : 'top-4 text-sm text-[#c4c7c5]'
                      }`}
                    >
                      Enter your password
                    </label>
                  </div>

                  {/* Show password checkbox */}
                  <label className="flex items-center gap-3 cursor-pointer select-none text-xs text-[#c4c7c5]">
                    <input
                      type="checkbox"
                      checked={showPassword}
                      onChange={e => setShowPassword(e.target.checked)}
                      className="w-4 h-4 rounded border-[#8e918f] bg-transparent text-[#a8c7fa] focus:ring-0"
                    />
                    <span>Show password</span>
                  </label>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-6">
                    <button
                      type="button"
                      onClick={() => setStep('email')}
                      className="text-sm font-medium text-[#a8c7fa] hover:bg-[#282a2c] px-4 py-2 rounded-full transition-colors"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-6 py-2.5 bg-[#a8c7fa] hover:bg-[#c2e7ff] active:scale-95 text-[#041e49] font-medium text-sm rounded-full shadow transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <span>Signing in...</span>
                      ) : (
                        <span>Next</span>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <footer className="w-full max-w-[1040px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#c4c7c5] pt-6">
        <div className="flex items-center gap-2">
          <select className="bg-transparent text-[#c4c7c5] border-none outline-none cursor-pointer">
            <option value="en-US" className="bg-[#1f1f1f] text-white">English (United States)</option>
            <option value="en-GB" className="bg-[#1f1f1f] text-white">English (United Kingdom)</option>
          </select>
        </div>
        <div className="flex items-center gap-6">
          <a href="#help" className="hover:text-white transition-colors">Help</a>
          <a href="#privacy" className="hover:text-white transition-colors">Privacy</a>
          <a href="#terms" className="hover:text-white transition-colors">Terms</a>
        </div>
      </footer>
    </div>
  );
};
