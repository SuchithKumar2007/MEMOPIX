import prisma from '../prisma.js';
import { MediaService } from './mediaService.js';

export class AlbumService {
  /**
   * List all albums for a user
   */
  static async listAlbums(userId: string) {
    const albums = await prisma.album.findMany({
      where: { ownerId: userId },
      include: {
        _count: {
          select: { items: true }
        },
        items: {
          take: 1,
          include: { media: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    return albums.map(album => {
      let coverMedia = null;
      if (album.items.length > 0 && album.items[0].media) {
        coverMedia = MediaService.enrichMediaWithUrls(album.items[0].media, userId);
      }

      return {
        id: album.id,
        title: album.title,
        description: album.description,
        itemCount: album._count.items,
        coverMedia,
        createdAt: album.createdAt,
        updatedAt: album.updatedAt
      };
    });
  }

  /**
   * Create a new album
   */
  static async createAlbum(userId: string, title: string, description?: string, mediaIds?: string[]) {
    const album = await prisma.album.create({
      data: {
        ownerId: userId,
        title: title.trim(),
        description: description?.trim() || null
      }
    });

    if (mediaIds && mediaIds.length > 0) {
      // Verify media belong to user
      const ownedMedia = await prisma.media.findMany({
        where: { id: { in: mediaIds }, ownerId: userId },
        select: { id: true }
      });

      for (const m of ownedMedia) {
        await prisma.albumMedia.upsert({
          where: {
            albumId_mediaId: {
              albumId: album.id,
              mediaId: m.id
            }
          },
          create: {
            albumId: album.id,
            mediaId: m.id
          },
          update: {}
        });
      }
    }

    return this.getAlbumById(album.id, userId);
  }

  /**
   * Get single album with its media items
   */
  static async getAlbumById(albumId: string, userId: string) {
    const album = await prisma.album.findUnique({
      where: { id: albumId },
      include: {
        items: {
          include: {
            media: true
          },
          orderBy: { addedAt: 'desc' }
        }
      }
    });

    if (!album) {
      const error: any = new Error('Album not found.');
      error.statusCode = 404;
      throw error;
    }

    if (album.ownerId !== userId) {
      const error: any = new Error('Forbidden. You do not own this album.');
      error.statusCode = 403;
      throw error;
    }

    const items = album.items
      .filter(item => !item.media.isDeleted)
      .map(item => MediaService.enrichMediaWithUrls(item.media, userId));

    return {
      id: album.id,
      title: album.title,
      description: album.description,
      itemCount: items.length,
      media: items,
      createdAt: album.createdAt,
      updatedAt: album.updatedAt
    };
  }

  /**
   * Update album title/description
   */
  static async updateAlbum(
    albumId: string,
    userId: string,
    data: { title?: string; description?: string; coverMediaId?: string | null }
  ) {
    const album = await prisma.album.findUnique({ where: { id: albumId } });
    if (!album || album.ownerId !== userId) {
      const error: any = new Error('Album not found or forbidden.');
      error.statusCode = !album ? 404 : 403;
      throw error;
    }

    const updated = await prisma.album.update({
      where: { id: albumId },
      data: {
        title: data.title?.trim() || album.title,
        description: data.description !== undefined ? data.description : album.description,
        coverMediaId: data.coverMediaId !== undefined ? data.coverMediaId : album.coverMediaId
      }
    });

    return updated;
  }

  /**
   * Delete album (does not delete original media files)
   */
  static async deleteAlbum(albumId: string, userId: string) {
    const album = await prisma.album.findUnique({ where: { id: albumId } });
    if (!album || album.ownerId !== userId) {
      const error: any = new Error('Album not found or forbidden.');
      error.statusCode = !album ? 404 : 403;
      throw error;
    }

    await prisma.album.delete({ where: { id: albumId } });
    return { success: true, message: 'Album deleted successfully. Your media remains safe.' };
  }

  /**
   * Add media items to album
   */
  static async addMediaToAlbum(albumId: string, userId: string, mediaIds: string[]) {
    const album = await prisma.album.findUnique({ where: { id: albumId } });
    if (!album || album.ownerId !== userId) {
      const error: any = new Error('Album not found or forbidden.');
      error.statusCode = !album ? 404 : 403;
      throw error;
    }

    const ownedMedia = await prisma.media.findMany({
      where: { id: { in: mediaIds }, ownerId: userId },
      select: { id: true }
    });

    if (ownedMedia.length === 0) {
      return { count: 0, message: 'No valid media to add.' };
    }

    for (const m of ownedMedia) {
      await prisma.albumMedia.upsert({
        where: {
          albumId_mediaId: {
            albumId,
            mediaId: m.id
          }
        },
        create: {
          albumId,
          mediaId: m.id
        },
        update: {}
      });
    }

    return { success: true, addedCount: ownedMedia.length };
  }

  /**
   * Remove media items from album
   */
  static async removeMediaFromAlbum(albumId: string, userId: string, mediaId: string) {
    const album = await prisma.album.findUnique({ where: { id: albumId } });
    if (!album || album.ownerId !== userId) {
      const error: any = new Error('Album not found or forbidden.');
      error.statusCode = !album ? 404 : 403;
      throw error;
    }

    await prisma.albumMedia.deleteMany({
      where: { albumId, mediaId }
    });

    return { success: true, message: 'Media removed from album.' };
  }
}
