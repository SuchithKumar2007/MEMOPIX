import prisma from '../prisma.js';

export const STORAGE_LIMIT_BYTES = BigInt(process.env.STORAGE_LIMIT_BYTES || '5000000000000'); // 5 TB = 5,000,000,000,000 bytes

export interface StorageUsageStats {
  usedBytes: number;
  limitBytes: number;
  remainingBytes: number;
  percentageUsed: number;
  photosBytes: number;
  videosBytes: number;
  audioBytes: number;
  otherBytes: number;
  totalFiles: number;
  totalPhotos: number;
  totalVideos: number;
  totalAudio: number;
  formattedUsed: string;
  formattedLimit: string;
  formattedRemaining: string;
}

export function formatBytes(bytes: number | bigint): string {
  const num = typeof bytes === 'bigint' ? Number(bytes) : bytes;
  if (num === 0) return '0 B';
  const k = 1000; // Decimal standard for storage: 5 TB = 5000 GB = 5000000 MB
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(num) / Math.log(k));
  const val = num / Math.pow(k, i);
  return `${val.toFixed(2)} ${sizes[i]}`;
}

export class StorageQuotaService {
  /**
   * Initializes or fetches a user's storage quota record
   */
  static async getOrCreateStorageRecord(userId: string) {
    let record = await prisma.storageUsage.findUnique({
      where: { userId }
    });

    if (!record) {
      record = await prisma.storageUsage.create({
        data: {
          userId,
          usedBytes: BigInt(0),
          limitBytes: STORAGE_LIMIT_BYTES
        }
      });
    }

    return record;
  }

  /**
   * Checks if an incoming upload of `fileSizeBytes` will fit within the 5 TB limit
   */
  static async checkUploadAllowed(userId: string, incomingFileSizeBytes: number | bigint): Promise<{
    allowed: boolean;
    currentUsed: bigint;
    limit: bigint;
    remaining: bigint;
    required: bigint;
  }> {
    const record = await this.getOrCreateStorageRecord(userId);
    const incomingBigInt = BigInt(incomingFileSizeBytes);
    const limit = record.limitBytes;
    const currentUsed = record.usedBytes;
    const remaining = limit > currentUsed ? limit - currentUsed : BigInt(0);

    const allowed = (currentUsed + incomingBigInt) <= limit;

    return {
      allowed,
      currentUsed,
      limit,
      remaining,
      required: incomingBigInt
    };
  }

  /**
   * Updates the user's storage usage record by delta (+bytes or -bytes)
   */
  static async updateUsage(userId: string, deltaBytes: number | bigint): Promise<void> {
    const record = await this.getOrCreateStorageRecord(userId);
    const delta = BigInt(deltaBytes);
    let newUsed = record.usedBytes + delta;
    if (newUsed < BigInt(0)) newUsed = BigInt(0);

    await prisma.storageUsage.update({
      where: { userId },
      data: { usedBytes: newUsed }
    });
  }

  /**
   * Recalculates storage usage directly from the user's media database records
   */
  static async recalculateUsage(userId: string): Promise<bigint> {
    const allUserMedia = await prisma.media.findMany({
      where: { ownerId: userId },
      select: { fileSize: true }
    });

    let total = BigInt(0);
    for (const m of allUserMedia) {
      total += m.fileSize;
    }

    await prisma.storageUsage.upsert({
      where: { userId },
      create: {
        userId,
        usedBytes: total,
        limitBytes: STORAGE_LIMIT_BYTES
      },
      update: {
        usedBytes: total
      }
    });

    return total;
  }

  /**
   * Returns a comprehensive breakdown of user storage
   */
  static async getUsageStats(userId: string): Promise<StorageUsageStats> {
    const record = await this.getOrCreateStorageRecord(userId);
    
    // Fetch all active and non-deleted media for breakdown
    const media = await prisma.media.findMany({
      where: { ownerId: userId, isDeleted: false },
      select: { mimeType: true, fileSize: true }
    });

    let photosBytes = 0;
    let videosBytes = 0;
    let audioBytes = 0;
    let otherBytes = 0;
    let totalPhotos = 0;
    let totalVideos = 0;
    let totalAudio = 0;

    for (const item of media) {
      const size = Number(item.fileSize);
      if (item.mimeType.startsWith('image/')) {
        photosBytes += size;
        totalPhotos++;
      } else if (item.mimeType.startsWith('video/')) {
        videosBytes += size;
        totalVideos++;
      } else if (item.mimeType.startsWith('audio/') || item.mimeType === 'audio/mpeg' || item.mimeType === 'audio/mp3') {
        audioBytes += size;
        totalAudio++;
      } else {
        otherBytes += size;
      }
    }

    const usedBytes = Number(record.usedBytes);
    const limitBytes = Number(record.limitBytes);
    const remainingBytes = Math.max(0, limitBytes - usedBytes);
    const percentageUsed = Number(((usedBytes / limitBytes) * 100).toFixed(2));

    return {
      usedBytes,
      limitBytes,
      remainingBytes,
      percentageUsed,
      photosBytes,
      videosBytes,
      audioBytes,
      otherBytes,
      totalFiles: media.length,
      totalPhotos,
      totalVideos,
      totalAudio,
      formattedUsed: formatBytes(usedBytes),
      formattedLimit: formatBytes(limitBytes),
      formattedRemaining: formatBytes(remainingBytes)
    };
  }
}
