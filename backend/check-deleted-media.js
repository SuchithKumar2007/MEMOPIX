const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAll() {
  const all = await prisma.media.findMany({
    select: {
      id: true,
      originalName: true,
      category: true,
      isDeleted: true,
      isArchived: true,
      ownerId: true,
      owner: { select: { email: true } },
      createdAt: true
    }
  });
  console.log(`Total rows in prisma.media: ${all.length}`);
  for (const m of all) {
    console.log(`[${m.category}] "${m.originalName}" | isDeleted: ${m.isDeleted} | isArchived: ${m.isArchived} | owner: ${m.owner?.email}`);
  }
}

checkAll().catch(console.error).finally(() => prisma.$disconnect());
