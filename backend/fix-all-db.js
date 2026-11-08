// Fix ALL database issues:
// 1. Remove duplicate media records
// 2. Remove ghost/orphan records (no fileData in DB)
// 3. Keep only real files

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixAll() {
  console.log('=== MEMOPIX DB FIX SCRIPT ===\n');

  // Step 1: Show current state
  const allMedia = await prisma.media.findMany({
    where: { isDeleted: false },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      originalName: true,
      category: true,
      fileSize: true,
      ownerId: true,
      fileData: true,
      fileHash: true,
      createdAt: true,
    }
  });

  console.log(`Total active media records: ${allMedia.length}`);
  allMedia.forEach(m => {
    const hasData = m.fileData ? `DB:${Math.round(Number(m.fileData.length)/1024)}KB` : 'NO_DATA';
    console.log(`  [${m.category}] ${m.originalName} | size:${m.fileSize} | ${hasData} | owner:${m.ownerId.substring(0,8)}... | id:${m.id}`);
  });

  const toDelete = [];

  // Step 2: Find duplicates by originalName + category
  const groups = {};
  for (const m of allMedia) {
    const key = `${m.originalName.toLowerCase()}|${m.category}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(m);
  }

  for (const [key, group] of Object.entries(groups)) {
    if (group.length > 1) {
      console.log(`\nDuplicate found: "${key}" (${group.length} copies)`);
      // Sort: keep the one WITH fileData first, then largest size, then newest
      group.sort((a, b) => {
        const aHas = a.fileData ? 1 : 0;
        const bHas = b.fileData ? 1 : 0;
        if (aHas !== bHas) return bHas - aHas;
        return Number(b.fileSize || 0) - Number(a.fileSize || 0);
      });
      const keep = group[0];
      console.log(`  KEEP: ${keep.id} "${keep.originalName}" (fileData=${keep.fileData ? 'YES' : 'NO'})`);
      for (let i = 1; i < group.length; i++) {
        console.log(`  DELETE duplicate: ${group[i].id} "${group[i].originalName}" (fileData=${group[i].fileData ? 'YES' : 'NO'})`);
        toDelete.push(group[i].id);
      }
    }
  }

  // Step 3: Find ghost audio records (audio with NO fileData - can't stream remotely)
  const ghostAudio = allMedia.filter(m => 
    m.category === 'audio' && !m.fileData && !toDelete.includes(m.id)
  );
  if (ghostAudio.length > 0) {
    console.log('\nGhost AUDIO records (no fileData - cannot stream from cloud):');
    ghostAudio.forEach(a => {
      console.log(`  DELETE ghost audio: ${a.id} | ${a.originalName} | size:${a.fileSize}`);
      toDelete.push(a.id);
    });
  }

  // Step 4: Execute deletions
  if (toDelete.length > 0) {
    console.log(`\nDeleting ${toDelete.length} records: [${toDelete.join(', ')}]`);
    
    // Delete related records first
    await prisma.shareLink.deleteMany({ where: { mediaId: { in: toDelete } } });
    await prisma.albumMedia.deleteMany({ where: { mediaId: { in: toDelete } } });
    await prisma.playlistTrack.deleteMany({ where: { mediaId: { in: toDelete } } });
    
    const result = await prisma.media.deleteMany({ where: { id: { in: toDelete } } });
    console.log(`Deleted ${result.count} records successfully!`);
  } else {
    console.log('\nNo duplicates or ghosts to delete.');
  }

  // Step 5: Show final state
  const finalMedia = await prisma.media.findMany({
    where: { isDeleted: false },
    orderBy: { category: 'asc' },
    select: { id: true, originalName: true, category: true, fileSize: true, fileData: true }
  });
  console.log(`\n=== FINAL STATE: ${finalMedia.length} active records ===`);
  finalMedia.forEach(m => {
    const hasData = m.fileData ? `DB:${Math.round(Number(m.fileData.length)/1024)}KB` : 'NO_DB_DATA';
    console.log(`  [${m.category}] ${m.originalName} | size:${m.fileSize} | ${hasData}`);
  });
}

fixAll()
  .catch(e => console.error('ERROR:', e))
  .finally(() => prisma.$disconnect());
