/**
 * Benchmark profile-switch DB work. Requires DATABASE_URL.
 *
 *   npx tsx scripts/profile-switch-benchmark.ts
 */
import { prisma } from '../src/lib/db/prisma';
import {
  estimateSwitchLatencyMs,
  LEGACY_PROFILE_SWITCH_PATH,
  OPTIMIZED_PROFILE_SWITCH_PATH,
} from '../src/lib/profiles/profile-switch-path';

const DEV_USER_ID = process.env.DEV_USER_ID ?? 'dev-user-1';

async function time<T>(label: string, fn: () => Promise<T>): Promise<{ ms: number; value: T }> {
  const start = performance.now();
  const value = await fn();
  const ms = Math.round(performance.now() - start);
  console.log(`  ${label}: ${ms}ms`);
  return { ms, value };
}

async function legacyDbWork(profileId: string, userId: string) {
  await time('requireCurrentUser (User.findUnique)', () =>
    prisma.user.findUniqueOrThrow({ where: { id: userId } })
  );
  await time('childProfiles.findById', () =>
    prisma.childProfile.findUnique({ where: { id: profileId } })
  );
  await time('requireCurrentUser again (list)', () =>
    prisma.user.findUniqueOrThrow({ where: { id: userId } })
  );
  await time('childProfiles.listByUser', () =>
    prisma.childProfile.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } })
  );
}

async function optimizedDbWork(profileId: string, userId: string) {
  await time('childProfiles.findById (ownership only)', () =>
    prisma.childProfile.findUnique({ where: { id: profileId } })
  );
}

async function homeLibraryDbWork(userId: string, childProfileId: string) {
  await time('legacy library (User + Child + list stories)', async () => {
    await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    await prisma.childProfile.findUnique({ where: { id: childProfileId } });
    await prisma.userStory.findMany({
      where: { userId, childProfileId },
      include: { adaptation: { include: { passage: true } }, progress: true },
      orderBy: { updatedAt: 'desc' },
    });
  });

  await time('optimized library (list stories only)', () =>
    prisma.userStory.findMany({
      where: { userId, childProfileId },
      include: { adaptation: { include: { passage: true } }, progress: true },
      orderBy: { updatedAt: 'desc' },
    })
  );
}

async function main() {
  const profiles = await prisma.childProfile.findMany({
    where: { userId: DEV_USER_ID },
    orderBy: { createdAt: 'asc' },
  });

  if (profiles.length < 2) {
    console.error('Need at least 2 child profiles for benchmark.');
    process.exit(1);
  }

  const target = profiles[1]!;
  console.log('\n=== Profile switch DB benchmark ===\n');
  console.log(`User: ${DEV_USER_ID}, target profile: ${target.name} (${target.id})\n`);

  console.log('Legacy blocking DB work (before navigation):');
  const legacyStart = performance.now();
  await legacyDbWork(target.id, DEV_USER_ID);
  const legacyDbMs = Math.round(performance.now() - legacyStart);

  console.log('\nOptimized background DB work (cookie persist):');
  const optimizedStart = performance.now();
  await optimizedDbWork(target.id, DEV_USER_ID);
  const optimizedDbMs = Math.round(performance.now() - optimizedStart);

  console.log('\n/home library fetch comparison:');
  await homeLibraryDbWork(DEV_USER_ID, target.id);

  const dbQueryMs = Math.round((legacyDbMs / 4 + optimizedDbMs) / 2);
  const previewLike = {
    serverRttMs: 180,
    dbQueryMs,
    routerRefreshMs: 120,
    clientNavMs: 60,
    neonColdStartMs: 0,
  };

  const legacyEstimate = estimateSwitchLatencyMs(LEGACY_PROFILE_SWITCH_PATH, previewLike);
  const optimizedEstimate = estimateSwitchLatencyMs(OPTIMIZED_PROFILE_SWITCH_PATH, previewLike);

  console.log('\n=== Estimated time-to-/home (measured dbQueryMs=%d) ===', dbQueryMs);
  console.log(
    JSON.stringify(
      {
        legacy: { ...legacyEstimate, measuredBlockingDbMs: legacyDbMs },
        optimized: { ...optimizedEstimate, measuredBackgroundDbMs: optimizedDbMs },
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
