import { z } from 'zod';

export const createAlbumSchema = z.object({
  title: z.string().min(1, 'Album title is required').max(100, 'Album title is too long'),
  description: z.string().max(500).optional(),
  mediaIds: z.array(z.string()).optional()
});

export const updateAlbumSchema = z.object({
  title: z.string().min(1, 'Album title is required').max(100).optional(),
  description: z.string().max(500).optional(),
  coverMediaId: z.string().optional().nullable()
});

export const addMediaToAlbumSchema = z.object({
  mediaIds: z.array(z.string()).min(1, 'At least one media ID is required')
});

export const createShareLinkSchema = z.object({
  mediaId: z.string().optional(),
  albumId: z.string().optional(),
  expiresInDays: z.number().int().min(0).max(365).optional(), // 0 = never, 1, 7, 30
  allowDownload: z.boolean().default(true)
}).refine(data => data.mediaId || data.albumId, {
  message: 'Must provide either a mediaId or albumId to share'
});

export const updateShareLinkSchema = z.object({
  expiresInDays: z.number().int().min(0).max(365).optional().nullable(),
  allowDownload: z.boolean().optional(),
  isActive: z.boolean().optional()
});

export const bulkActionSchema = z.object({
  action: z.enum(['favorite', 'unfavorite', 'archive', 'unarchive', 'trash', 'restore', 'delete_permanent']),
  mediaIds: z.array(z.string()).min(1, 'At least one media ID must be selected')
});
