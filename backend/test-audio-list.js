const { MediaService } = require('./dist/services/mediaService');
const prisma = require('./dist/prisma').default;

async function checkAudio() {
  const users = [
    { email: 'suchith@2007.com', id: '2899f01c-bfe0-4114-9850-7782ab86a6af' },
    { email: 'suchith@gmail.com', id: '3b0e7cf6-9a50-4dfe-ae3e-f8ff6ecd7e78' },
    { email: 'suchith2007kumar@gmail.com', id: '7e43e689-641d-4514-adec-372cc9f83ed3' }
  ];

  for (const u of users) {
    const list = await MediaService.listMedia(u.id, { view: 'audio' });
    console.log(`\nUser: ${u.email}`);
    console.log(`Total audio: ${list.items.length}`);
    for (const item of list.items) {
      console.log(`- "${item.originalName}" (${item.id})`);
      console.log(`  streamUrl: ${item.streamUrl}`);
    }
  }
}

checkAudio().catch(console.error).finally(() => prisma.$disconnect());
