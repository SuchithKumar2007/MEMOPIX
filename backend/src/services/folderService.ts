import prisma from '../prisma.js';

export class FolderService {
  /**
   * List folders for user
   */
  static async listFolders(userId: string, parentId?: string | null) {
    const where: any = { ownerId: userId };
    if (parentId !== undefined) {
      where.parentId = parentId;
    }

    const folders = await prisma.folder.findMany({
      where,
      include: {
        _count: {
          select: { media: true, children: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    return folders.map(f => ({
      id: f.id,
      name: f.name,
      parentId: f.parentId,
      color: f.color,
      itemCount: f._count.media + f._count.children,
      filesCount: f._count.media,
      subfoldersCount: f._count.children,
      createdAt: f.createdAt,
      updatedAt: f.updatedAt
    }));
  }

  /**
   * Create folder
   */
  static async createFolder(userId: string, name: string, parentId?: string, color?: string) {
    const folder = await prisma.folder.create({
      data: {
        name: name.trim(),
        ownerId: userId,
        parentId: parentId || null,
        color: color || '#4F46E5'
      }
    });

    return folder;
  }

  /**
   * Get folder by ID with its contents
   */
  static async getFolderById(userId: string, folderId: string) {
    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
      include: {
        children: true,
        media: {
          where: { isDeleted: false },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!folder || folder.ownerId !== userId) {
      const err: any = new Error('Folder not found or forbidden.');
      err.statusCode = !folder ? 404 : 403;
      throw err;
    }

    return folder;
  }

  /**
   * Update folder
   */
  static async updateFolder(userId: string, folderId: string, data: { name?: string; color?: string; parentId?: string | null }) {
    const folder = await prisma.folder.findUnique({ where: { id: folderId } });
    if (!folder || folder.ownerId !== userId) {
      const err: any = new Error('Folder not found or forbidden.');
      err.statusCode = !folder ? 404 : 403;
      throw err;
    }

    const updated = await prisma.folder.update({
      where: { id: folderId },
      data
    });

    return updated;
  }

  /**
   * Delete folder
   */
  static async deleteFolder(userId: string, folderId: string) {
    const folder = await prisma.folder.findUnique({ where: { id: folderId } });
    if (!folder || folder.ownerId !== userId) {
      const err: any = new Error('Folder not found or forbidden.');
      err.statusCode = !folder ? 404 : 403;
      throw err;
    }

    // Media items in this folder will have folderId set to null (preserve files)
    await prisma.media.updateMany({
      where: { folderId },
      data: { folderId: null }
    });

    await prisma.folder.delete({ where: { id: folderId } });

    return { success: true, message: 'Folder deleted.' };
  }
}
