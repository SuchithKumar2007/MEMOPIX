const { MediaService } = require('./dist/services/mediaService');
const prisma = require('./dist/prisma').default;

async function check() {
  const all = await MediaService.listMedia('7e43e689-641d-4514-adec-372cc9f83ed3', { view: 'all' });
  console.log(`Current active items in Neon: ${all.items.length}`);
  for (const m of all.items) {
    console.log(`- [${m.category}] ${m.originalName} (${m.id})`);
  }
}

check().catch(console.error).finally(() => prisma.$disconnect());
