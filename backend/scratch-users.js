const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const users = await prisma.user.findMany({
    include: {
      _count: {
        select: {
          media: true
        }
      }
    }
  });
  console.log('Users in DB:');
  for (const u of users) {
    console.log(`- ${u.email} (id: ${u.id}): ${u._count.media} media items`);
  }

  const mediaSample = await prisma.media.findMany({
    take: 5,
    select: {
      id: true,
      userId: true,
      originalName: true,
      mimeType: true,
      fileSize: true,
      isDeleted: true
    }
  });
  console.log('Sample media items:', mediaSample);
}

check().catch(console.error).finally(() => prisma.$disconnect());
