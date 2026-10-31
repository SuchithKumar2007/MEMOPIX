import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';

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
import { prisma } from './prisma.js';

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

// SPA Fallback: All non-API routes return index.html if present, else JSON status
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  const indexPath = path.join(frontendDist, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  res.json({
    status: 'ok',
    message: 'MEMOPIX Backend API is running.',
    frontend: process.env.FRONTEND_URL || 'https://memopix-tas.vercel.app'
  });
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

// Auto-seed existing user accounts into PostgreSQL if not present
async function seedExistingUsers() {
  const usersToSeed = [
    {
      id: '2899f01c-bfe0-4114-9850-7782ab86a6af',
      email: 'suchith@2007.com',
      name: 'Suchith',
      passwordHash: '$2a$12$.hXZkESVAf9A6wYF/hsF.uApsm0K/vzxqErtyPd94EC3I7zko9kYm',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop'
    },
    {
      id: '3b0e7cf6-9a50-4dfe-ae3e-f8ff6ecd7e78',
      email: 'suchith@gmail.com',
      name: 'Suchith',
      passwordHash: '$2a$12$pVsR0Fg5SeZd7bzZla/46.Gt/z8kbE04zinJz2yp.HM..VjNgVa2.',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop'
    },
    {
      id: '7e43e689-641d-4514-adec-372cc9f83ed3',
      email: 'suchith2007kumar@gmail.com',
      name: 'Suchith Kumar',
      passwordHash: '$2a$12$AshtXQtCJtNoj1OyoOTzV.yRlQjL4GGYkfcKkWy117GmdlSH90JGC',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop'
    }
  ];

  for (const u of usersToSeed) {
    try {
      const existing = await prisma.user.findUnique({ where: { email: u.email } });
      if (!existing) {
        await prisma.user.create({
          data: {
            id: u.id,
            email: u.email,
            name: u.name,
            passwordHash: u.passwordHash,
            avatarUrl: u.avatarUrl,
            termsAccepted: true,
            storageUsage: {
              create: {
                usedBytes: BigInt(0),
                limitBytes: BigInt('5000000000000')
              }
            }
          }
        });
        console.log(`[SEED] Automatically preserved account: ${u.email}`);
      }
    } catch (err) {
      console.warn(`[SEED WARNING] ${u.email}:`, err);
    }
  }
}
seedExistingUsers().catch(() => {});

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
