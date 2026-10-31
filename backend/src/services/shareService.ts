import prisma from '../prisma.js';
import { generateSecureRandomToken } from '../utils/token.js';
import { StorageService } from './storageService.js';

export class ShareService {
  /**
   * Creates a secure share link for media or album
   */
  static async createShareLink(
    userId: string,
    params: {
      mediaId?: string;
      albumId?: string;
      expiresInDays?: number;
      allowDownload?: boolean;
    }
  ) {
    // 1. Verify ownership
    if (params.mediaId) {
      const media = await prisma.media.findUnique({ where: { id: params.mediaId } });
      if (!media || media.ownerId !== userId || media.isDeleted) {
        const error: any = new Error('Media not found or forbidden.');
        error.statusCode = !media ? 404 : 403;
        throw error;
      }
    } else if (params.albumId) {
      const album = await prisma.album.findUnique({ where: { id: params.albumId } });
      if (!album || album.ownerId !== userId) {
        const error: any = new Error('Album not found or forbidden.');
        error.statusCode = !album ? 404 : 403;
        throw error;
      }
    }

    const rawToken = generateSecureRandomToken(24);
    let expiresAt: Date | null = null;

    if (params.expiresInDays && params.expiresInDays > 0) {
      expiresAt = new Date(Date.now() + params.expiresInDays * 24 * 60 * 60 * 1000);
    }

    const shareLink = await prisma.shareLink.create({
      data: {
        tokenHash: rawToken,
        ownerId: userId,
        mediaId: params.mediaId || null,
        albumId: params.albumId || null,
        expiresAt,
        allowDownload: params.allowDownload !== undefined ? params.allowDownload : true,
        isActive: true
      }
    });

    const publicUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/share/${rawToken}`;

    return {
      id: shareLink.id,
      token: rawToken,
      publicUrl,
      expiresAt: shareLink.expiresAt,
      allowDownload: shareLink.allowDownload,
      isActive: shareLink.isActive,
      createdAt: shareLink.createdAt
    };
  }

  /**
   * Access public shared item via secure token
   */
  static async getSharedResource(token: string) {
    const link = await prisma.shareLink.findUnique({
      where: { tokenHash: token },
      include: {
        media: true,
        album: {
          include: {
            items: {
              include: { media: true },
              orderBy: { addedAt: 'desc' }
            }
          }
        }
      }
    });

    if (!link || !link.isActive) {
      const error: any = new Error('Share link is inactive or has been revoked by the owner.');
      error.statusCode = 404;
      throw error;
    }

    if (link.expiresAt && link.expiresAt < new Date()) {
      const error: any = new Error('Share link has expired.');
      error.statusCode = 410;
      throw error;
    }

    // Increment view count
    await prisma.shareLink.update({
      where: { id: link.id },
      data: { viewCount: { increment: 1 } }
    });

    if (link.media && !link.media.isDeleted) {
      const signedStreamUrl = StorageService.getSignedMediaUrl(link.media.id, link.ownerId, 7200);
      const signedThumbUrl = link.media.thumbnailPath 
        ? StorageService.getSignedThumbnailUrl(link.media.id, link.ownerId, 7200)
        : signedStreamUrl;

      return {
        type: 'media',
        allowDownload: link.allowDownload,
        expiresAt: link.expiresAt,
        item: {
          title: link.media.originalName,
          mimeType: link.media.mimeType,
          fileSize: Number(link.media.fileSize),
          width: link.media.width,
          height: link.media.height,
          streamUrl: signedStreamUrl,
          thumbnailUrl: signedThumbUrl,
          downloadUrl: link.allowDownload ? `/api/share/${token}/download` : null,
          createdAt: link.media.createdAt
        }
      };
    }

    if (link.album) {
      const items = link.album.items
        .filter(i => !i.media.isDeleted)
        .map(i => ({
          title: i.media.originalName,
          mimeType: i.media.mimeType,
          fileSize: Number(i.media.fileSize),
          streamUrl: StorageService.getSignedMediaUrl(i.media.id, link.ownerId, 7200),
          thumbnailUrl: i.media.thumbnailPath 
            ? StorageService.getSignedThumbnailUrl(i.media.id, link.ownerId, 7200)
            : StorageService.getSignedMediaUrl(i.media.id, link.ownerId, 7200),
          createdAt: i.media.createdAt
        }));

      return {
        type: 'album',
        allowDownload: link.allowDownload,
        expiresAt: link.expiresAt,
        album: {
          title: link.album.title,
          description: link.album.description,
          itemCount: items.length,
          items
        }
      };
    }

    const error: any = new Error('Shared resource no longer exists.');
    error.statusCode = 404;
    throw error;
  }

  /**
   * List share links created by the user
   */
  static async listUserShareLinks(userId: string) {
    const links = await prisma.shareLink.findMany({
      where: { ownerId: userId },
      include: {
        media: { select: { id: true, originalName: true, mimeType: true } },
        album: { select: { id: true, title: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return links.map(l => ({
      id: l.id,
      token: l.tokenHash,
      publicUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/share/${l.tokenHash}`,
      resourceType: l.mediaId ? 'media' : 'album',
      resourceName: l.media ? l.media.originalName : (l.album ? l.album.title : 'Unknown'),
      expiresAt: l.expiresAt,
      allowDownload: l.allowDownload,
      isActive: l.isActive,
      viewCount: l.viewCount,
      createdAt: l.createdAt
    }));
  }

  /**
   * Update share link properties (disable/enable, change expiry or download)
   */
  static async updateShareLink(
    shareLinkId: string,
    userId: string,
    data: { isActive?: boolean; allowDownload?: boolean; expiresInDays?: number | null }
  ) {
    const link = await prisma.shareLink.findUnique({ where: { id: shareLinkId } });
    if (!link || link.ownerId !== userId) {
      const error: any = new Error('Share link not found or forbidden.');
      error.statusCode = !link ? 404 : 403;
      throw error;
    }

    let expiresAt = link.expiresAt;
    if (data.expiresInDays !== undefined) {
      expiresAt = data.expiresInDays && data.expiresInDays > 0
        ? new Date(Date.now() + data.expiresInDays * 24 * 60 * 60 * 1000)
        : null;
    }

    const updated = await prisma.shareLink.update({
      where: { id: shareLinkId },
      data: {
        isActive: data.isActive !== undefined ? data.isActive : link.isActive,
        allowDownload: data.allowDownload !== undefined ? data.allowDownload : link.allowDownload,
        expiresAt
      }
    });

    return updated;
  }

  /**
   * Revoke & Delete share link
   */
  static async deleteShareLink(shareLinkId: string, userId: string) {
    const link = await prisma.shareLink.findUnique({ where: { id: shareLinkId } });
    if (!link || link.ownerId !== userId) {
      const error: any = new Error('Share link not found or forbidden.');
      error.statusCode = !link ? 404 : 403;
      throw error;
    }

    await prisma.shareLink.delete({ where: { id: shareLinkId } });
    return { success: true, message: 'Share link permanently removed.' };
  }
}
