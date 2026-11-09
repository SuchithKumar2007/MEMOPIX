const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  console.time('with fileData (old)');
  const oldRes = await prisma.media.findMany();
  console.timeEnd('with fileData (old)');

  console.time('without fileData (new)');
  const newRes = await prisma.media.findMany({
    select: {
      id: true,
      ownerId: true,
      folderId: true,
      fileName: true,
      originalName: true,
      mimeType: true,
      category: true,
      fileSize: true,
      fileHash: true,
      storagePath: true,
      thumbnailPath: true,
      width: true,
      height: true,
      duration: true,
      isFavorite: true,
      isArchived: true,
      isDeleted: true,
      deletedAt: true,
      takenAt: true,
      cameraModel: true,
      createdAt: true,
      updatedAt: true
    }
  });
  console.timeEnd('without fileData (new)');
}

test().finally(() => prisma.$disconnect());
