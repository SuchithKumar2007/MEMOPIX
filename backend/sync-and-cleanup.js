const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const STORAGE_ROOT = path.resolve(__dirname, 'storage_data');

function getAbsolutePath(relPath) {
  if (path.isAbsolute(relPath)) return relPath;
  return path.join(STORAGE_ROOT, relPath);
}

async function run() {
  console.log('=== SYNCING MEDIA TO NEON POSTGRESQL ===');
  const items = await prisma.media.findMany({
    where: { isDeleted: false }
  });

  console.log(`Found ${items.length} active media items.`);

  const toDelete = [];

  for (const m of items) {
    const absPath = getAbsolutePath(m.storagePath);
    const existsOnDisk = fs.existsSync(absPath);
    const hasDbData = m.fileData && m.fileData.length > 0;

    console.log(`Checking [${m.category}] "${m.originalName}" (id: ${m.id})`);
    console.log(`  disk: ${existsOnDisk ? 'YES' : 'NO'}, neonBytes: ${hasDbData ? m.fileData.length : 0}`);

    if (existsOnDisk && !hasDbData) {
      const stats = fs.statSync(absPath);
      if (stats.size <= 25 * 1024 * 1024) {
        console.log(`  -> Uploading bytes from disk to Neon DB (${stats.size} bytes)...`);
        const buf = fs.readFileSync(absPath);
        await prisma.media.update({
          where: { id: m.id },
          data: { fileData: buf }
        });
        console.log(`  -> Synced to Neon DB successfully!`);
      }
    } else if (!existsOnDisk && hasDbData) {
      console.log(`  -> Restoring file from Neon DB to local disk...`);
      fs.mkdirSync(path.dirname(absPath), { recursive: true });
      fs.writeFileSync(absPath, m.fileData);
      console.log(`  -> Restored to ${absPath}`);
    } else if (!existsOnDisk && !hasDbData) {
      console.log(`  -> GHOST RECORD: Missing on disk AND in Neon DB. Marking for cleanup.`);
      toDelete.push(m.id);
    }
  }

  if (toDelete.length > 0) {
    console.log(`\nCleaning up ${toDelete.length} ghost records:`, toDelete);
    await prisma.shareLink.deleteMany({ where: { mediaId: { in: toDelete } } });
    await prisma.albumMedia.deleteMany({ where: { mediaId: { in: toDelete } } });
    await prisma.playlistTrack.deleteMany({ where: { mediaId: { in: toDelete } } });
    const res = await prisma.media.deleteMany({ where: { id: { in: toDelete } } });
    console.log(`Deleted ${res.count} ghost records.`);
  }

  console.log('\n=== CURRENT VALID MEDIA IN NEON POSTGRESQL ===');
  const valid = await prisma.media.findMany({
    where: { isDeleted: false },
    select: { id: true, originalName: true, category: true, fileSize: true, fileData: true }
  });
  for (const v of valid) {
    console.log(`- [${v.category}] ${v.originalName} (${v.fileSize} bytes) | in Neon: ${v.fileData ? v.fileData.length + ' bytes' : 'disk only'}`);
  }
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
