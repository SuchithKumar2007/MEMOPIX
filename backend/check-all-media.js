const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function show() {
  const allMedia = await prisma.media.findMany({
    select: {
      id: true,
      originalName: true,
      category: true,
      ownerId: true,
      owner: {
        select: {
          email: true
        }
      }
    }
  });
  console.log(`Total media in Neon: ${allMedia.length}`);
  for (const m of allMedia) {
    console.log(`- [${m.category}] "${m.originalName}" -> Owner: ${m.owner?.email}`);
  }
}

show().catch(console.error).finally(() => prisma.$disconnect());
