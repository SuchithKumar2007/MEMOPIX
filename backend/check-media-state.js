const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const media = await prisma.media.findMany({
    where: { isDeleted: false },
    select: {
      id: true,
      originalName: true,
      category: true,
      fileSize: true,
      fileData: true,
      storagePath: true,
      ownerId: true
    }
  });

  console.log(`Active media count: ${media.length}`);
  for (const m of media) {
    console.log(`- [${m.category}] "${m.originalName}" size=${m.fileSize} bytes, dbBytes=${m.fileData ? m.fileData.length : 0}, path=${m.storagePath}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
