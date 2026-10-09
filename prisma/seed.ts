import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { A_ESTRELA_DE_MATEUS_PAGES } from '../src/lib/stories/story-viewer-pages';
import { getStoryQuiz } from '../src/lib/stories/story-quiz';
import { DEFAULT_PREFERENCES } from '../src/lib/onboarding/defaults';
import { DEFAULT_BIBLE_VERSION_ID } from '@/lib/stories/bible-versions';
import { CURRENT_CONSENT_VERSION } from '@/lib/privacy/constants';

const prisma = new PrismaClient();

const DEV_USER_ID = process.env.DEV_USER_ID ?? 'dev-user-1';
const DEV_PASSWORD = 'devpassword123';

async function main() {
  const passwordHash = await bcrypt.hash(DEV_PASSWORD, 12);
  const preferences = {
    ...DEFAULT_PREFERENCES,
    bibleVersionId: DEFAULT_BIBLE_VERSION_ID,
  };

  const user = await prisma.user.upsert({
    where: { id: DEV_USER_ID },
    update: {
      email: 'dev@pequenos-discipulos.local',
      name: 'Conta de desenvolvimento',
      fullName: 'Conta de desenvolvimento',
      passwordHash,
      consentAcceptedAt: new Date(),
      consentVersion: CURRENT_CONSENT_VERSION,
    },
    create: {
      id: DEV_USER_ID,
      email: 'dev@pequenos-discipulos.local',
      name: 'Conta de desenvolvimento',
      fullName: 'Conta de desenvolvimento',
      passwordHash,
      subscriptionTier: 'free',
      consentAcceptedAt: new Date(),
      consentVersion: CURRENT_CONSENT_VERSION,
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
    const isDefaultTier = ageTier === 'TIER_3_5';

    await prisma.passageAdaptation.upsert({
      where: {
        passageId_bibleVersionId_verseFrom_verseTo_ageTier_languageStyle_contentType_version: {
          passageId: passage.id,
          bibleVersionId: DEFAULT_BIBLE_VERSION_ID,
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
        status: isDefaultTier ? 'as_default' : 'community',
        title: 'A Estrela de Mateus',
        createdByUserId: user.id,
        voteScore: isDefaultTier ? 5 : 4.9,
        voteCount: isDefaultTier ? 20 : 12,
      },
      create: {
        passageId: passage.id,
        bibleVersionId: DEFAULT_BIBLE_VERSION_ID,
        verseFrom: 1,
        verseTo: 3,
        ageTier,
        languageStyle: 'rhymes',
        contentType: 'text',
        content,
        quiz,
        adaptationNote:
          'O foco foi mantido na luz e na jornada, simplificando conflitos políticos.',
        status: isDefaultTier ? 'as_default' : 'community',
        version: 1,
        title: 'A Estrela de Mateus',
        voteScore: isDefaultTier ? 5 : 4.9,
        voteCount: isDefaultTier ? 20 : 12,
        createdByUserId: user.id,
      },
    });

    await prisma.passageAdaptation.upsert({
      where: {
        passageId_bibleVersionId_verseFrom_verseTo_ageTier_languageStyle_contentType_version: {
          passageId: passage.id,
          bibleVersionId: DEFAULT_BIBLE_VERSION_ID,
          verseFrom: 1,
          verseTo: 3,
          ageTier,
          languageStyle: 'simple',
          contentType: 'text',
          version: 2,
        },
      },
      update: {
        content,
        quiz,
        status: 'community',
        title: 'Os Reis Magos e a Estrela',
        voteScore: 4.2,
        voteCount: 6,
        adaptationNote: 'Versão alternativa com linguagem mais simples para a mesma passagem.',
        createdByUserId: user.id,
      },
      create: {
        passageId: passage.id,
        bibleVersionId: DEFAULT_BIBLE_VERSION_ID,
        verseFrom: 1,
        verseTo: 3,
        ageTier,
        languageStyle: 'simple',
        contentType: 'text',
        content,
        quiz,
        adaptationNote: 'Versão alternativa com linguagem mais simples para a mesma passagem.',
        status: 'community',
        version: 2,
        title: 'Os Reis Magos e a Estrela',
        voteScore: 4.2,
        voteCount: 6,
        createdByUserId: user.id,
      },
    });
  }

  const jonasPassage = await prisma.passage.upsert({
    where: { slug: 'jonas-1-3' },
    update: {
      reference: 'Jonas 1:1–3',
      book: 'Jonas',
      preview: 'Deus chama Jonas para ir a Nínive, mas ele tenta fugir de outro jeito.',
    },
    create: {
      slug: 'jonas-1-3',
      reference: 'Jonas 1:1–3',
      book: 'Jonas',
      preview: 'Deus chama Jonas para ir a Nínive, mas ele tenta fugir de outro jeito.',
      sourceText: {
        verses: [
          'Veio a palavra do Senhor a Jonas, filho de Amitai, dizendo:',
          'Levanta-te, e vai à grande cidade de Nínive, e clama contra ela, porque a sua malícia subiu até mim.',
        ],
      },
    },
  });

  await prisma.passageAdaptation.upsert({
    where: {
      passageId_bibleVersionId_verseFrom_verseTo_ageTier_languageStyle_contentType_version: {
        passageId: jonasPassage.id,
        bibleVersionId: DEFAULT_BIBLE_VERSION_ID,
        verseFrom: 1,
        verseTo: 3,
        ageTier: 'TIER_6_8',
        languageStyle: 'simple',
        contentType: 'text',
        version: 1,
      },
    },
    update: {
      status: 'community',
      title: 'Jonas e o Grande Peixe',
      voteScore: 4.6,
      voteCount: 9,
      adaptationNote: 'Deus chama Jonas com carinho, mesmo quando ele tenta ir para o outro lado.',
      createdByUserId: user.id,
      content,
    },
    create: {
      passageId: jonasPassage.id,
      bibleVersionId: DEFAULT_BIBLE_VERSION_ID,
      verseFrom: 1,
      verseTo: 3,
      ageTier: 'TIER_6_8',
      languageStyle: 'simple',
      contentType: 'text',
      content,
      status: 'community',
      version: 1,
      title: 'Jonas e o Grande Peixe',
      voteScore: 4.6,
      voteCount: 9,
      adaptationNote: 'Deus chama Jonas com carinho, mesmo quando ele tenta ir para o outro lado.',
      createdByUserId: user.id,
    },
  });

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

  console.log('Seed complete:', {
    userId: user.id,
    childId: child.id,
    adaptationId: adaptation.id,
    devLogin: 'dev@pequenos-discipulos.local / devpassword123',
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
