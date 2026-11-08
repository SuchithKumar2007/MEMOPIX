const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

async function test() {
  const all = await prisma.media.findMany({
    select: {
      id: true,
      originalName: true,
      category: true,
      storagePath: true,
      fileSize: true,
      fileData: true
    }
  });

  console.log(`Checking storage status for ${all.length} items:`);
  for (const m of all) {
    const localPath = path.resolve(__dirname, 'storage_data', m.storagePath);
    const exists = fs.existsSync(localPath);
    const dataSize = m.fileData ? m.fileData.length : 0;
    console.log(`- [${m.category}] "${m.originalName}" (${m.id}): disk=${exists}, dbBytes=${dataSize}`);
  }
}

test().catch(console.error).finally(() => prisma.$disconnect());
