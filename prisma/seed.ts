import { PrismaClient } from '@prisma/client';
import { A_ESTRELA_DE_MATEUS_PAGES } from '../src/lib/stories/story-viewer-pages';
import { getStoryQuiz } from '../src/lib/stories/story-quiz';
import { DEFAULT_PREFERENCES } from '../src/lib/onboarding/defaults';

const prisma = new PrismaClient();

const DEV_USER_ID = process.env.DEV_USER_ID ?? 'dev-user-1';
import { DEFAULT_BIBLE_VERSION_ID } from '@/lib/stories/bible-versions';

const DEFAULT_BIBLE_VERSION = DEFAULT_BIBLE_VERSION_ID;

async function main() {
  const preferences = {
    ...DEFAULT_PREFERENCES,
    bibleVersionId: DEFAULT_BIBLE_VERSION,
  };

  const user = await prisma.user.upsert({
    where: { id: DEV_USER_ID },
    update: {
      email: 'dev@pequenos-discipulos.local',
      fullName: 'Conta de desenvolvimento',
    },
    create: {
      id: DEV_USER_ID,
      email: 'dev@pequenos-discipulos.local',
      fullName: 'Conta de desenvolvimento',
      subscriptionTier: 'free',
    },
  });

  const child = await prisma.childProfile.upsert({
    where: { id: 'dev-child-1' },
    update: {
      name: preferences.childName,
      preferences,
    },
    create: {
      id: 'dev-child-1',
      userId: user.id,
      name: preferences.childName,
      avatarColor: 'laranja',
      preferences,
      hasCreatedStory: true,
    },
  });

  const passage = await prisma.passage.upsert({
    where: { slug: 'mateus-2-1-3' },
    update: {
      reference: 'Mateus 2:1–3',
      book: 'Mateus',
      preview: 'Os magos seguem a estrela até Belém para adorar o menino Jesus.',
    },
    create: {
      slug: 'mateus-2-1-3',
      reference: 'Mateus 2:1–3',
      book: 'Mateus',
      preview: 'Os magos seguem a estrela até Belém para adorar o menino Jesus.',
      sourceText: {
        verses: [
          'E, tendo nascido Jesus em Belém de Judeia, no tempo do rei Herodes, eis que uns magos vieram do oriente a Jerusalém.',
          'Onde está aquele que é nascido rei dos judeus? Porque vimos a sua estrela no oriente, e viemos a adorá-lo.',
        ],
      },
    },
  });

  const content = { pages: A_ESTRELA_DE_MATEUS_PAGES };
  const tiers = [
    { ageTier: 'TIER_3_5' as const, appTier: '3-5' as const },
    { ageTier: 'TIER_6_8' as const, appTier: '6-8' as const },
    { ageTier: 'TIER_9_11' as const, appTier: '9-11' as const },
  ];

  for (const { ageTier, appTier } of tiers) {
    const quiz = getStoryQuiz('1', appTier) ?? undefined;

    await prisma.passageAdaptation.upsert({
      where: {
        passageId_bibleVersionId_verseFrom_verseTo_ageTier_languageStyle_contentType_version: {
          passageId: passage.id,
          bibleVersionId: DEFAULT_BIBLE_VERSION,
          verseFrom: 1,
          verseTo: 3,
          ageTier,
          languageStyle: 'rhymes',
          contentType: 'text',
          version: 1,
        },
      },
      update: {
        content,
        quiz,
        status: 'community',
        title: 'A Estrela de Mateus',
      },
      create: {
        passageId: passage.id,
        bibleVersionId: DEFAULT_BIBLE_VERSION,
        verseFrom: 1,
        verseTo: 3,
        ageTier,
        languageStyle: 'rhymes',
        contentType: 'text',
        content,
        quiz,
        adaptationNote:
          'O foco foi mantido na luz e na jornada, simplificando conflitos políticos.',
        status: 'community',
        version: 1,
        title: 'A Estrela de Mateus',
        voteScore: 4.9,
        voteCount: 12,
      },
    });
  }

  const adaptation = await prisma.passageAdaptation.findFirstOrThrow({
    where: {
      passageId: passage.id,
      ageTier: 'TIER_3_5',
      contentType: 'text',
    },
  });

  const userStory = await prisma.userStory.upsert({
    where: { id: 'dev-story-1' },
    update: {
      isFavorite: true,
      adaptationId: adaptation.id,
    },
    create: {
      id: 'dev-story-1',
      userId: user.id,
      childProfileId: child.id,
      adaptationId: adaptation.id,
      isFavorite: true,
    },
  });

  await prisma.readingProgress.upsert({
    where: { userStoryId: userStory.id },
    update: { currentPage: 2, totalPages: 4 },
    create: {
      userStoryId: userStory.id,
      currentPage: 2,
      totalPages: 4,
    },
  });

  console.log('Seed complete:', { userId: user.id, childId: child.id, adaptationId: adaptation.id });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
