const { MediaService } = require('./dist/services/mediaService');
const prisma = require('./dist/prisma').default;

async function test() {
  const res1 = await MediaService.listMedia('2899f01c-bfe0-4114-9850-7782ab86a6af', { view: 'all' });
  console.log(`suchith@2007.com sees: ${res1.items.length} media items`);

  const res2 = await MediaService.listMedia('7e43e689-641d-4514-adec-372cc9f83ed3', { view: 'all' });
  console.log(`suchith2007kumar@gmail.com sees: ${res2.items.length} media items`);
}

test().catch(console.error).finally(() => prisma.$disconnect());
