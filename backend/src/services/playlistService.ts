import prisma from '../prisma.js';
import { MediaService } from './mediaService.js';

export class PlaylistService {
  /**
   * List playlists for user
   */
  static async listPlaylists(userId: string) {
    const playlists = await prisma.playlist.findMany({
      where: { ownerId: userId },
      include: {
        _count: { select: { tracks: true } },
        tracks: {
          take: 1,
          include: {
            media: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    return playlists.map(p => ({
      id: p.id,
      title: p.title,
      description: p.description,
      coverUrl: p.coverUrl || (p.tracks[0]?.media ? MediaService.enrichMediaWithUrls(p.tracks[0].media, userId).thumbnailUrl : null),
      trackCount: p._count.tracks,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt
    }));
  }

  /**
   * Create playlist
   */
  static async createPlaylist(userId: string, title: string, description?: string, mediaIds: string[] = []) {
    const playlist = await prisma.playlist.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        ownerId: userId
      }
    });

    if (mediaIds.length > 0) {
      await this.addTracks(userId, playlist.id, mediaIds);
    }

    return this.getPlaylistById(userId, playlist.id);
  }

  /**
   * Get playlist details with tracks
   */
  static async getPlaylistById(userId: string, playlistId: string) {
    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId },
      include: {
        tracks: {
          orderBy: { position: 'asc' },
          include: {
            media: true
          }
        }
      }
    });

    if (!playlist || playlist.ownerId !== userId) {
      const err: any = new Error('Playlist not found or forbidden.');
      err.statusCode = !playlist ? 404 : 403;
      throw err;
    }

    const enrichedTracks = playlist.tracks.map(t => ({
      id: t.id,
      position: t.position,
      addedAt: t.addedAt,
      media: MediaService.enrichMediaWithUrls(t.media, userId)
    }));

    return {
      id: playlist.id,
      title: playlist.title,
      description: playlist.description,
      coverUrl: playlist.coverUrl,
      trackCount: enrichedTracks.length,
      tracks: enrichedTracks,
      createdAt: playlist.createdAt,
      updatedAt: playlist.updatedAt
    };
  }

  /**
   * Update playlist
   */
  static async updatePlaylist(userId: string, playlistId: string, data: { title?: string; description?: string; coverUrl?: string }) {
    const playlist = await prisma.playlist.findUnique({ where: { id: playlistId } });
    if (!playlist || playlist.ownerId !== userId) {
      const err: any = new Error('Playlist not found or forbidden.');
      err.statusCode = !playlist ? 404 : 403;
      throw err;
    }

    const updated = await prisma.playlist.update({
      where: { id: playlistId },
      data
    });

    return updated;
  }

  /**
   * Delete playlist
   */
  static async deletePlaylist(userId: string, playlistId: string) {
    const playlist = await prisma.playlist.findUnique({ where: { id: playlistId } });
    if (!playlist || playlist.ownerId !== userId) {
      const err: any = new Error('Playlist not found or forbidden.');
      err.statusCode = !playlist ? 404 : 403;
      throw err;
    }

    await prisma.playlist.delete({ where: { id: playlistId } });
    return { success: true, message: 'Playlist deleted.' };
  }

  /**
   * Add tracks to playlist
   */
  static async addTracks(userId: string, playlistId: string, mediaIds: string[]) {
    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId },
      include: { tracks: true }
    });

    if (!playlist || playlist.ownerId !== userId) {
      const err: any = new Error('Playlist not found or forbidden.');
      err.statusCode = !playlist ? 404 : 403;
      throw err;
    }

    // Verify media belongs to user
    const validMedia = await prisma.media.findMany({
      where: {
        id: { in: mediaIds },
        ownerId: userId
      },
      select: { id: true }
    });

    const existingMediaIds = new Set(playlist.tracks.map(t => t.mediaId));
    let nextPosition = playlist.tracks.length;

    for (const item of validMedia) {
      if (!existingMediaIds.has(item.id)) {
        await prisma.playlistTrack.create({
          data: {
            playlistId,
            mediaId: item.id,
            position: nextPosition++
          }
        });
      }
    }

    return this.getPlaylistById(userId, playlistId);
  }

  /**
   * Reorder tracks in playlist
   */
  static async reorderTracks(userId: string, playlistId: string, mediaIds: string[]) {
    const playlist = await prisma.playlist.findUnique({ where: { id: playlistId } });
    if (!playlist || playlist.ownerId !== userId) {
      const err: any = new Error('Playlist not found or forbidden.');
      err.statusCode = !playlist ? 404 : 403;
      throw err;
    }

    // Update position of each track in parallel
    await prisma.$transaction(
      mediaIds.map((mediaId, index) =>
        prisma.playlistTrack.updateMany({
          where: { playlistId, mediaId },
          data: { position: index }
        })
      )
    );

    return this.getPlaylistById(userId, playlistId);
  }

  /**
   * Remove track from playlist
   */
  static async removeTrack(userId: string, playlistId: string, mediaId: string) {
    const playlist = await prisma.playlist.findUnique({ where: { id: playlistId } });
    if (!playlist || playlist.ownerId !== userId) {
      const err: any = new Error('Playlist not found or forbidden.');
      err.statusCode = !playlist ? 404 : 403;
      throw err;
    }

    await prisma.playlistTrack.deleteMany({
      where: { playlistId, mediaId }
    });

    return { success: true, message: 'Track removed from playlist.' };
  }
}
