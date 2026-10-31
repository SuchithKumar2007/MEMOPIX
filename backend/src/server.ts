import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import path from 'path';

const frontendDist = path.resolve(__dirname, '../../frontend/dist');

dotenv.config();

import authRoutes from './routes/authRoutes.js';
import mediaRoutes from './routes/mediaRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import albumRoutes from './routes/albumRoutes.js';
import shareRoutes from './routes/shareRoutes.js';
import storageRoutes from './routes/storageRoutes.js';
import userRoutes from './routes/userRoutes.js';
import resumableUploadRoutes from './routes/resumableUploadRoutes.js';
import folderRoutes from './routes/folderRoutes.js';
import playlistRoutes from './routes/playlistRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { MediaService } from './services/mediaService.js';
import passport from 'passport';
import { setupGoogleStrategy } from './config/googleStrategy.js';

// Initialize Google OAuth strategy
setupGoogleStrategy();

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL || ''
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(null, true); // Dev-friendly fallback
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(passport.initialize());

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Rate Limiting for Auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests from this IP, please try again later.' }
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    app: 'MEMOPIX Private Cloud',
    version: '1.0.0',
    quota: '5 TB (5,000,000,000,000 bytes)',
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/uploads', resumableUploadRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/albums', albumRoutes);
app.use('/api/share', shareRoutes);
app.use('/api/storage', storageRoutes);
app.use('/api/user', userRoutes);

// Serve static frontend files from dist
app.use(express.static(frontendDist));

// SPA Fallback: All non-API routes return index.html
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(frontendDist, 'index.html'));
});

// Global Error Handler
app.use(errorHandler);

// Background job: Purge trash items older than 30 days every 24 hours
const TRASH_PURGE_INTERVAL = 24 * 60 * 60 * 1000;
setInterval(() => {
  MediaService.autoPurgeExpiredTrash().catch(err => {
    console.error('[TRASH PURGE ERROR]', err);
  });
}, TRASH_PURGE_INTERVAL);

// Initial trash purge on boot
MediaService.autoPurgeExpiredTrash().catch(() => {});

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(` MEMOPIX BACKEND RUNNING ON http://localhost:${PORT}`);
    console.log(` Storage Quota: 5 TB (5,000,000,000,000 bytes)`);
    console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`====================================================`);
  });
}

export default app;
