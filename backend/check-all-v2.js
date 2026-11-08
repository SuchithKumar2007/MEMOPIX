// Check ALL media including soft-deleted, find videos
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAll() {
  // All records regardless of isDeleted
  const all = await prisma.media.findMany({
    orderBy: { createdAt: 'asc' },
    select: {
      id: true, originalName: true, category: true,
      fileSize: true, fileData: true, isDeleted: true,
      deletedAt: true, ownerId: true
    }
  });
  
  console.log(`Total records in DB (including deleted): ${all.length}`);
  all.forEach(m => {
    const hasData = m.fileData ? `DB:${Math.round(Number(m.fileData.length)/1024)}KB` : 'NO_DATA';
    const deleted = m.isDeleted ? ' [DELETED]' : '';
    console.log(`  [${m.category}]${deleted} ${m.originalName} | ${hasData} | owner:${m.ownerId.substring(0,8)}...`);
  });
}

checkAll()
  .catch(e => console.error('ERROR:', e))
  .finally(() => prisma.$disconnect());
