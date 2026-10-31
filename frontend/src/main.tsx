import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { MusicPlayerProvider } from './context/MusicPlayerContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <MusicPlayerProvider>
            <App />
          </MusicPlayerProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  </React.StrictMode>
);

// Register PWA Service Worker for Android, Windows, and Laptops
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => console.log('MEMOPIX PWA ServiceWorker active:', reg.scope))
      .catch((err) => console.log('MEMOPIX ServiceWorker error:', err));
  });
}
