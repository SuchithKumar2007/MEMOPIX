import { PrismaClient } from '@prisma/client';

// BigInt JSON serialization fix
(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

const rawPrisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

/**
 * Resilient Prisma Client with Neon PostgreSQL auto-reconnect & query retry.
 * Handles Neon cold starts, idle socket timeouts, and connection pool resets.
 */
export const prisma = rawPrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        try {
          return await query(args);
        } catch (error: any) {
          const msg = (error?.message || '').toLowerCase();
          const code = error?.code || '';
          const isConnectionError =
            code === 'P1001' || // Can't reach database server
            code === 'P1002' || // Database server timed out
            code === 'P1008' || // Operations timed out
            code === 'P1017' || // Server closed the connection
            code === 'P2024' || // Connection pool timed out
            msg.includes('connection terminated') ||
            msg.includes('connection closed') ||
            msg.includes('server closed the connection') ||
            msg.includes('econnreset') ||
            msg.includes('etimedout') ||
            msg.includes('socket has been ended') ||
            msg.includes('client was closed');

          if (isConnectionError) {
            console.warn(`[NEON RETRY] Database connection dropped during ${String(model)}.${String(operation)}. Reconnecting...`);
            try {
              await rawPrisma.$disconnect().catch(() => {});
              await new Promise(resolve => setTimeout(resolve, 1000));
              await rawPrisma.$connect().catch(() => {});
            } catch {}
            // Retry the query once with fresh connection
            return await query(args);
          }
          throw error;
        }
      }
    }
  }
}) as unknown as PrismaClient;

export default prisma;
