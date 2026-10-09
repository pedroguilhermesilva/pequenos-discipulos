/**
 * Upserts sample community adaptations for staging/preview testing.
 * Safe to run multiple times — does not delete existing rows.
 *
 * Usage: DATABASE_URL=... DIRECT_URL=... npx tsx scripts/ensure-staging-community-versions.ts
 */
import { PrismaClient } from '@prisma/client';
import { A_ESTRELA_DE_MATEUS_PAGES } from '../src/lib/stories/story-viewer-pages';
import { DEFAULT_BIBLE_VERSION_ID } from '@/lib/stories/bible-versions';

const prisma = new PrismaClient();
const content = { pages: A_ESTRELA_DE_MATEUS_PAGES };

async function main() {
  const passage = await prisma.passage.upsert({
    where: { slug: 'mateus-2-1-3' },
    update: {},
    create: {
      slug: 'mateus-2-1-3',
      reference: 'Mateus 2:1–3',
      book: 'Mateus',
      preview: 'Os magos seguem a estrela até Belém.',
      sourceText: { verses: ['Versículo seed para testes.'] },
    },
  });

  await prisma.passageAdaptation.upsert({
    where: {
      passageId_bibleVersionId_verseFrom_verseTo_ageTier_languageStyle_contentType_version: {
        passageId: passage.id,
        bibleVersionId: DEFAULT_BIBLE_VERSION_ID,
        verseFrom: 1,
        verseTo: 3,
        ageTier: 'TIER_3_5',
        languageStyle: 'rhymes',
        contentType: 'text',
        version: 1,
      },
    },
    update: { status: 'as_default', voteScore: 5, voteCount: 20 },
    create: {
      passageId: passage.id,
      bibleVersionId: DEFAULT_BIBLE_VERSION_ID,
      verseFrom: 1,
      verseTo: 3,
      ageTier: 'TIER_3_5',
      languageStyle: 'rhymes',
      contentType: 'text',
      content,
      status: 'as_default',
      version: 1,
      title: 'A Estrela de Mateus (Padrão)',
      voteScore: 5,
      voteCount: 20,
      adaptationNote: 'Versão padrão da comunidade para testes.',
    },
  });

  console.log('Community staging samples ensured for passage', passage.slug);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
