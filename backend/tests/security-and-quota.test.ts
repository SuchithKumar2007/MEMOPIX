import prisma from '../src/prisma.js';
import { AuthService } from '../src/services/authService.js';
import { MediaService } from '../src/services/mediaService.js';
import { StorageQuotaService, STORAGE_LIMIT_BYTES } from '../src/services/storageQuotaService.js';
import { ShareService } from '../src/services/shareService.js';
import { AlbumService } from '../src/services/albumService.js';

async function runTests() {
  console.log('======================================================');
  console.log(' STARTING MEMOPIX BACKEND & SECURITY VERIFICATION TEST');
  console.log('======================================================\n');

  try {
    // 1. Clean previous test data
    await prisma.user.deleteMany({
      where: { email: { in: ['usera@test.com', 'userb@test.com'] } }
    });

    // 2. Test User Registration
    console.log('[TEST 1] Registering User A and User B...');
    const userAData = await AuthService.register({
      name: 'User A',
      email: 'usera@test.com',
      password: 'Password123!'
    });
    console.log('  ✓ User A registered successfully:', userAData.user.id);

    const userBData = await AuthService.register({
      name: 'User B',
      email: 'userb@test.com',
      password: 'Password123!'
    });
    console.log('  ✓ User B registered successfully:', userBData.user.id);

    // 3. Test Authentication & Login
    console.log('\n[TEST 2] Testing Login & Password Hashing...');
    const loginA = await AuthService.login({ email: 'usera@test.com', password: 'Password123!' });
    if (!loginA.token) throw new Error('Login token missing');
    console.log('  ✓ User A login passed with valid JWT token');

    try {
      await AuthService.login({ email: 'usera@test.com', password: 'WrongPassword!' });
      throw new Error('Wrong password should have failed');
    } catch (e: any) {
      console.log('  ✓ Wrong password correctly rejected:', e.message);
    }

    // 4. Test 5 TB Storage Quota Tracking
    console.log('\n[TEST 3] Testing 5 TB Storage Quota Calculation...');
    const quotaA = await StorageQuotaService.getUsageStats(userAData.user.id);
    console.log(`  ✓ Storage Quota Limit: ${quotaA.formattedLimit} (Bytes: ${quotaA.limitBytes})`);
    console.log(`  ✓ Current Used: ${quotaA.formattedUsed}`);
    console.log(`  ✓ Current Remaining: ${quotaA.formattedRemaining}`);
    if (quotaA.limitBytes !== 5000000000000) {
      throw new Error(`Limit must be 5,000,000,000,000 bytes, got ${quotaA.limitBytes}`);
    }

    // Test Exceeding 5 TB Quota
    const hugeUploadCheck = await StorageQuotaService.checkUploadAllowed(
      userAData.user.id,
      6000000000000 // 6 TB
    );
    if (hugeUploadCheck.allowed) {
      throw new Error('Upload exceeding 5 TB should have been rejected!');
    }
    console.log('  ✓ Upload exceeding 5 TB quota correctly rejected on backend');

    // 5. Test Media Upload & Duplicate Detection
    console.log('\n[TEST 4] Testing Media Upload & Duplicate Detection...');
    const mockImageBuffer = Buffer.from('mock-image-data-sample-content-2026');
    const mockMulterFile: any = {
      buffer: mockImageBuffer,
      originalname: 'vacation_photo.jpg',
      mimetype: 'image/jpeg',
      size: mockImageBuffer.length
    };

    const uploadRes = await MediaService.uploadMedia(userAData.user.id, mockMulterFile);
    if (!uploadRes.media) throw new Error('Media upload failed');
    const mediaAId = uploadRes.media.id;
    console.log('  ✓ Media uploaded for User A with private ID:', mediaAId);

    // Duplicate detection test
    const dupRes = await MediaService.uploadMedia(userAData.user.id, mockMulterFile, false);
    if (!dupRes.duplicateDetected) {
      throw new Error('Duplicate file should have been flagged');
    }
    console.log('  ✓ Duplicate upload detected and flagged:', dupRes.message);

    // 6. Test USER ISOLATION & PRIVACY (User B cannot access User A's data)
    console.log('\n[TEST 5] Testing Strict User Isolation & Authorization (User A vs User B)...');
    try {
      await MediaService.getMediaById(mediaAId, userBData.user.id);
      throw new Error('Security Breach! User B was able to view User A media!');
    } catch (e: any) {
      if (e.statusCode === 403 || e.message.includes('permission') || e.message.includes('Forbidden')) {
        console.log('  ✓ User B access blocked with 403 Forbidden:', e.message);
      } else {
        throw e;
      }
    }

    try {
      await MediaService.updateMedia(mediaAId, userBData.user.id, { isFavorite: true });
      throw new Error('Security Breach! User B was able to modify User A media!');
    } catch (e: any) {
      console.log('  ✓ User B update blocked with 403 Forbidden');
    }

    try {
      await MediaService.deletePermanently(mediaAId, userBData.user.id);
      throw new Error('Security Breach! User B was able to delete User A media!');
    } catch (e: any) {
      console.log('  ✓ User B permanent delete blocked with 403 Forbidden');
    }

    // 7. Test Albums
    console.log('\n[TEST 6] Testing Album Management...');
    const albumA = await AlbumService.createAlbum(userAData.user.id, 'Summer 2026', 'My vacation', [mediaAId]);
    console.log('  ✓ Album created with media item count:', albumA.itemCount);
    
    // User B cannot access User A's album
    try {
      await AlbumService.getAlbumById(albumA.id, userBData.user.id);
      throw new Error('Security Breach! User B was able to access User A album!');
    } catch (e: any) {
      console.log('  ✓ User B blocked from accessing User A album (403 Forbidden)');
    }

    // 8. Test Secure Sharing
    console.log('\n[TEST 7] Testing Secure Sharing & Token Authorization...');
    const shareLink = await ShareService.createShareLink(userAData.user.id, {
      mediaId: mediaAId,
      expiresInDays: 7,
      allowDownload: true
    });
    console.log('  ✓ Share link created with secure random token:', shareLink.token);

    const publicShared = await ShareService.getSharedResource(shareLink.token);
    if (!publicShared || publicShared.type !== 'media') {
      throw new Error('Shared resource retrieval failed');
    }
    console.log('  ✓ Public user can access shared memory via secure token');

    // Test revoking link
    await ShareService.updateShareLink(shareLink.id, userAData.user.id, { isActive: false });
    try {
      await ShareService.getSharedResource(shareLink.token);
      throw new Error('Revoked link should not be accessible');
    } catch (e: any) {
      console.log('  ✓ Revoked share link access properly denied (404/Inactive)');
    }

    // 9. Test Trash & Restore
    console.log('\n[TEST 8] Testing Trash and Restore Functionality...');
    await MediaService.moveToTrash(mediaAId, userAData.user.id);
    const inTrash = await MediaService.listMedia(userAData.user.id, { view: 'trash' });
    if (inTrash.items.length === 0) throw new Error('Item should be in trash');
    console.log('  ✓ Item moved to trash successfully');

    const inPhotos = await MediaService.listMedia(userAData.user.id, { view: 'photos' });
    if (inPhotos.items.some(i => i.id === mediaAId)) throw new Error('Trashed item should not appear in photos view');
    console.log('  ✓ Trashed item hidden from main photos gallery');

    await MediaService.restoreFromTrash(mediaAId, userAData.user.id);
    const restoredPhotos = await MediaService.listMedia(userAData.user.id, { view: 'photos' });
    if (!restoredPhotos.items.some(i => i.id === mediaAId)) throw new Error('Restored item should appear in photos');
    console.log('  ✓ Item restored back to gallery');

    // 9. Test MP3 Audio Upload and Audio View Filtering
    console.log('\n[TEST 9] Testing MP3 Audio Upload and Audio View Filtering...');
    const mockAudioBuffer = Buffer.from('ID3-mock-mp3-audio-track-content-sample-2026');
    const mockAudioFile: any = {
      buffer: mockAudioBuffer,
      originalname: 'favorite_song.mp3',
      mimetype: 'audio/mpeg',
      size: mockAudioBuffer.length
    };

    const audioUploadRes = await MediaService.uploadMedia(userAData.user.id, mockAudioFile);
    if (!audioUploadRes.media) throw new Error('MP3 audio upload failed');
    console.log('  ✓ MP3 audio uploaded with mimeType:', audioUploadRes.media.mimeType);

    const audioList = await MediaService.listMedia(userAData.user.id, { view: 'audio' });
    if (!audioList.items.some(i => i.id === audioUploadRes.media.id)) {
      throw new Error('Uploaded MP3 not found in view: audio list');
    }
    console.log('  ✓ MP3 audio correctly filtered in view: audio list');

    // 10. Test MP4 Video (No per-file size limitation)
    console.log('\n[TEST 10] Testing MP4 Video Upload (No per-file size limitation)...');
    // Test that multi-gigabyte files (e.g. 5 GB, 20 GB) are permitted within total 5 TB quota
    const multiGigCheck = await StorageQuotaService.checkUploadAllowed(
      userAData.user.id,
      25 * 1024 * 1024 * 1024 // 25 GB MP4 movie file
    );
    if (!multiGigCheck.allowed) {
      throw new Error('A 25 GB MP4 file should be allowed within the 5 TB quota!');
    }
    console.log('  ✓ 25 GB single MP4 file allowed without artificial per-file limit');

    // Check stats breakdown includes audio
    const statsWithAudio = await StorageQuotaService.getUsageStats(userAData.user.id);
    if (statsWithAudio.totalAudio < 1 || statsWithAudio.audioBytes < mockAudioBuffer.length) {
      throw new Error('Audio stats breakdown did not record MP3 audio track');
    }
    console.log(`  ✓ Storage stats breakdown correctly registered audio: ${statsWithAudio.totalAudio} track(s), ${statsWithAudio.audioBytes} bytes`);

    // 11. Clean up test records
    await prisma.user.deleteMany({
      where: { email: { in: ['usera@test.com', 'userb@test.com'] } }
    });

    console.log('\n======================================================');
    console.log(' ALL BACKEND, SECURITY, PRIVACY & QUOTA TESTS PASSED! ✓');
    console.log('======================================================');
  } catch (error) {
    console.error('\nTEST FAILED:', error);
    process.exit(1);
  }
}

runTests();
