import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Temporary directory for streaming incoming multi-gigabyte files to disk
const UPLOAD_TEMP_DIR = path.resolve(process.cwd(), process.env.LOCAL_STORAGE_PATH || './storage_data', 'temp');
if (!fs.existsSync(UPLOAD_TEMP_DIR)) {
  fs.mkdirSync(UPLOAD_TEMP_DIR, { recursive: true });
}

// Allow image, video (MP4 has no file size limit), and audio (MP3, WAV, etc.) formats
const ALLOWED_MIMES = [
  // Images
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
  'image/svg+xml',
  'image/bmp',
  'image/tiff',
  // Videos (MP4 and other formats — NO PER-FILE LIMIT, bounded only by 5 TB quota)
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'video/x-msvideo',
  'video/mpeg',
  'video/ogg',
  'video/3gpp',
  'video/x-matroska',
  // Audio (MP3 & Music Formats)
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/wave',
  'audio/x-wav',
  'audio/aac',
  'audio/ogg',
  'audio/flac',
  'audio/m4a',
  'audio/x-m4a',
  'audio/mp4'
];

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_TEMP_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `upload_${uniqueSuffix}_${cleanName}`);
  }
});

export const uploadMiddleware = multer({
  storage,
  limits: {
    // 5 TB total quota check enforced at service layer
    fileSize: 5000000000000
  },
  fileFilter: (_req, _file, cb) => {
    // Accept all user uploads: photos, videos, audio, documents, and folder files
    cb(null, true);
  }
});
