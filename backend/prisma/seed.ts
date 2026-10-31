import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const usersToSeed = [
    {
      id: '2899f01c-bfe0-4114-9850-7782ab86a6af',
      email: 'suchith@2007.com',
      name: 'Suchith',
      passwordHash: '$2a$12$.hXZkESVAf9A6wYF/hsF.uApsm0K/vzxqErtyPd94EC3I7zko9kYm',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop'
    },
    {
      id: '3b0e7cf6-9a50-4dfe-ae3e-f8ff6ecd7e78',
      email: 'suchith@gmail.com',
      name: 'Suchith',
      passwordHash: '$2a$12$.hXZkESVAf9A6wYF/hsF.uApsm0K/vzxqErtyPd94EC3I7zko9kYm',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop'
    },
    {
      id: '7e43e689-641d-4514-adec-372cc9f83ed3',
      email: 'suchith2007kumar@gmail.com',
      name: 'Suchith Kumar',
      passwordHash: '$2a$12$.hXZkESVAf9A6wYF/hsF.uApsm0K/vzxqErtyPd94EC3I7zko9kYm',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop'
    }
  ];

  for (const u of usersToSeed) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (!existing) {
      await prisma.user.create({
        data: {
          id: u.id,
          email: u.email,
          name: u.name,
          passwordHash: u.passwordHash,
          avatarUrl: u.avatarUrl,
          termsAccepted: true,
          storageUsage: {
            create: {
              usedBytes: BigInt(0),
              limitBytes: BigInt('5000000000000')
            }
          }
        }
      });
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
