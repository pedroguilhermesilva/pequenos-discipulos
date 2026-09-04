import { NextResponse } from 'next/server';
import { requireCurrentUser, getCurrentChildProfileId } from '@/lib/auth/get-current-user';
import { container } from '@/lib/container';
import { DomainError } from '@/lib/domain/errors';
import { generateStoryInputSchema } from '@/lib/domain/schemas';
import { DEFAULT_BIBLE_VERSION_ID } from '@/lib/stories/bible-versions';

export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
    const body = await request.json();
    const childProfileId =
      (typeof body.childProfileId === 'string' ? body.childProfileId : null) ??
      (await getCurrentChildProfileId());

    const payload = generateStoryInputSchema.parse({
      ...body,
      bibleVersionId:
        typeof body.bibleVersionId === 'string' && body.bibleVersionId
          ? body.bibleVersionId
          : DEFAULT_BIBLE_VERSION_ID,
      childProfileId: childProfileId ?? undefined,
    });

    const result = await container.services.storyGeneration.generateOrReuse({
      userId: user.id,
      tier: user.subscriptionTier,
      payload,
    });

    return NextResponse.json({ ok: true, data: result });
  } catch (error) {
    if (error instanceof DomainError) {
      return NextResponse.json(
        { ok: false, code: error.code, message: error.message },
        { status: error.code === 'GENERATION_LIMIT_EXCEEDED' ? 402 : 400 }
      );
    }

    console.error(error);
    return NextResponse.json(
      { ok: false, code: 'VALIDATION_ERROR', message: 'Falha ao gerar história.' },
      { status: 500 }
    );
  }
}
