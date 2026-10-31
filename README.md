# MEMOPIX — 5 TB PRIVATE PHOTO & VIDEO CLOUD

> **“Every Picture Becomes Your Memories”**

MEMOPIX is a production-ready, full-stack private cloud photo and video gallery application. It delivers Google Photos-level timeline organization, high-performance media processing, strict owner-only isolation, cryptographically secure sharing, and an enforced **5 TB (5,000,000,000,000 bytes)** private storage quota.

---

## 🌟 Key Features

* **5 TB Private Storage Quota**: Every user account receives a dedicated 5 TB (5,000 GB) storage allocation strictly verified on every upload (`STORAGE_LIMIT_BYTES=5000000000000`).
* **Private Cloud Storage Architecture**: Encrypted storage driver with short-lived HMAC signed URL generation, ensuring zero unauthorized direct file access.
* **Strict User Isolation**: User A data is 100% isolated from User B. Cross-user media access attempts are blocked with `403 Forbidden`.
* **Google Photos-Style Timeline Gallery**: Date-grouped feed (Today, Yesterday, This Week, Month Year), lazy loading, smooth animations, and thumbnail caching.
* **Dedicated Video Gallery & Player**: High-definition video streaming with play/pause, seekbar, volume control, speed toggles (0.5x to 2x), and fullscreen mode.
* **Fullscreen Photo Viewer**: Fullscreen photo canvas with Zoom, Rotate, Favorite toggle, Download, Info Drawer (EXIF/Dimensions/Size/Date), and keyboard shortcuts (`ArrowLeft`, `ArrowRight`, `Escape`).
* **Multi-File Upload & Queue**: Drag-and-drop support, concurrent uploads, live progress tracking, retry, and SHA-256 duplicate detection with conflict resolution prompt.
* **Albums & Collections**: Create, update, rename, and delete albums without affecting original media.
* **Favorites, Archive & Trash**:
  * **Favorites**: One-click heart toggling and dedicated favorites gallery.
  * **Archive**: Archive memories out of the main timeline while keeping them stored and searchable.
  * **Trash**: Soft-delete system with 30-day auto-purge background schedule, immediate restore, and permanent deletion.
* **Multi-Select & Bulk Operations**: Bulk download as ZIP, bulk favorite, bulk archive, bulk add to album, and bulk delete.
* **Cryptographically Secure Sharing**: Public random token URLs (`/share/:token`) with configurable expiration (Never, 1 Day, 7 Days, 30 Days), allow/disallow download permissions, and instant link revocation.
* **Interactive Storage Dashboard**: Visual breakdown of storage used vs remaining, multi-segment progress bar, and photo/video file counts.
* **Full Authentication, Google OAuth & Remember Me**:
  * Email/Password registration with bcrypt hashing (12 rounds)
  * **Login with Google (OAuth 2.0)** with automatic user creation & 5 TB cloud provisioning
  * **Remember Me switch**: Extends JWT session duration up to 30 days
  * Password reset token flow with SHA-256 token verification
  * Interactive show/hide password visibility toggle (`Eye` / `EyeOff`)
* **Public Share & Cloud Access**:
  * Accessible locally and publicly via secure cloud tunnel (`localtunnel`)
* **Dark / Light / System Theme**: Instant theme switching with persistent storage.

---

## 🏗️ Architecture & Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Lucide React, Axios, date-fns |
| **Backend** | Node.js, Express, TypeScript, Multer, Sharp, Archiver, Helmet, Rate Limiter |
| **Database** | PostgreSQL / SQLite via Prisma ORM |
| **Storage** | Pluggable Driver (Local Private Object Storage with HMAC Signed URLs / Supabase Storage / AWS S3) |
| **Security** | Bcrypt (12 rounds), JWT sessions, SHA-256 duplicate hashing, Ownership middleware |

---

## 🚀 Quick Start Guide

### Prerequisites
* **Node.js**: v18+ (tested on Node v24)
* **npm**: v9+

### 1. Installation
Clone the repository and install all dependencies:

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Database Initialization
From the `backend` directory:

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
```

### 3. Run Development Servers
You can start both backend and frontend concurrently from the root directory:

```bash
# Run backend on http://localhost:5000
npm run dev:backend

# In a separate terminal, run frontend on http://localhost:5173
npm run dev:frontend
```

### 4. Build for Production
To generate production builds for both services:

```bash
npm run build
```

---

## 🔒 Security & User Isolation Verification

A comprehensive automated test suite is included to verify authentication, 5 TB quota enforcement, trash purging, and strict User A vs User B data isolation.

To run the automated security tests:

```bash
cd backend
npm test
```

Test Results Output:
```text
======================================================
 STARTING MEMOPIX BACKEND & SECURITY VERIFICATION TEST
======================================================

[TEST 1] Registering User A and User B...
  ✓ User A registered successfully
  ✓ User B registered successfully

[TEST 2] Testing Login & Password Hashing...
  ✓ User A login passed with valid JWT token
  ✓ Wrong password correctly rejected

[TEST 3] Testing 5 TB Storage Quota Calculation...
  ✓ Storage Quota Limit: 5.00 TB (Bytes: 5000000000000)
  ✓ Current Remaining: 5.00 TB
  ✓ Upload exceeding 5 TB quota correctly rejected on backend

[TEST 4] Testing Media Upload & Duplicate Detection...
  ✓ Media uploaded for User A with private ID
  ✓ Duplicate upload detected and flagged

[TEST 5] Testing Strict User Isolation & Authorization (User A vs User B)...
  ✓ User B access blocked with 403 Forbidden
  ✓ User B update blocked with 403 Forbidden
  ✓ User B permanent delete blocked with 403 Forbidden

[TEST 6] Testing Album Management...
  ✓ Album created with media item count
  ✓ User B blocked from accessing User A album (403 Forbidden)

[TEST 7] Testing Secure Sharing & Token Authorization...
  ✓ Share link created with secure random token
  ✓ Public user can access shared memory via secure token
  ✓ Revoked share link access properly denied (404/Inactive)

[TEST 8] Testing Trash and Restore Functionality...
  ✓ Item moved to trash successfully
  ✓ Trashed item hidden from main photos gallery
  ✓ Item restored back to gallery

======================================================
 ALL BACKEND, SECURITY, PRIVACY & QUOTA TESTS PASSED! ✓
======================================================
```

---

## 📡 REST API Summary

### Authentication (`/api/auth`)
* `POST /api/auth/register` — Register new account with 5 TB quota
* `POST /api/auth/login` — Sign in and issue JWT token
* `POST /api/auth/logout` — Invalidate session
* `GET  /api/auth/me` — Authenticated profile & storage stats
* `POST /api/auth/forgot-password` — Generate secure password reset link
* `POST /api/auth/reset-password` — Update password via reset token

### Media (`/api/media`)
* `GET    /api/media` — List timeline media with search and views (`photos`, `videos`, `favorites`, `archive`, `trash`)
* `POST   /api/media/upload` — Multi-file upload with quota check & duplicate detection
* `GET    /api/media/:id` — Single media metadata
* `GET    /api/media/:id/download` — Download media
* `PATCH  /api/media/:id` — Favorite, archive, or rename
* `DELETE /api/media/:id` — Move to trash
* `POST   /api/media/:id/restore` — Restore from trash
* `DELETE /api/media/:id/permanent` — Permanently delete file
* `POST   /api/media/empty-trash` — Permanently empty trash
* `POST   /api/media/bulk` — Perform bulk actions
* `POST   /api/media/bulk-download` — Stream multi-file ZIP archive

### Albums (`/api/albums`)
* `GET    /api/albums` — List user albums
* `POST   /api/albums` — Create album
* `GET    /api/albums/:id` — Get album details with media
* `PATCH  /api/albums/:id` — Update title/cover
* `DELETE /api/albums/:id` — Delete album (preserves media)
* `POST   /api/albums/:id/media` — Add media to album
* `DELETE /api/albums/:id/media/:mediaId` — Remove media from album

### Secure Sharing (`/api/share`)
* `POST   /api/share` — Create public share link with expiration
* `GET    /api/share/my-links` — List user's active links
* `PATCH  /api/share/:id` — Update expiration or revoke link
* `DELETE /api/share/:id` — Delete link
* `GET    /api/share/public/:token` — Public viewer endpoint
* `GET    /api/share/public/:token/download` — Public download endpoint

### Storage (`/api/storage`)
* `GET    /api/storage/usage` — 5 TB quota metrics and breakdown
* `POST   /api/storage/recalculate` — Recalculate usage from database

---

## 📄 License
MIT License. Built for the MEMOPIX Cloud Platform.
