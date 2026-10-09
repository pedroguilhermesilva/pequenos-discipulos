import { NextResponse } from 'next/server';
import { requireCurrentUser } from '@/lib/auth/get-current-user';
import { container } from '@/lib/container';
import { AdaptationNotFound, UnauthorizedError } from '@/lib/domain/errors';
import { getFamilyModerationMessage } from '@/lib/moderation/status-labels';

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireCurrentUser();
    const { id } = await context.params;
    const adaptation = await container.repositories.adaptations.findById(id);
    if (!adaptation) throw new AdaptationNotFound();

    const isOwner =
      adaptation.createdByUserId === user.id ||
      (await container.repositories.userStories.findByUserAndAdaptation(user.id, id)) !== null;

    if (!isOwner && adaptation.status !== 'community' && adaptation.status !== 'as_default') {
      throw new UnauthorizedError('Esta versão não está disponível.');
    }

    const viewerVote = await container.repositories.votes.findByUserAndAdaptation(user.id, id);
    const userVote: 1 | -1 | null =
      viewerVote?.value === -1 ? -1 : viewerVote?.value === 1 ? 1 : null;

    return NextResponse.json({
      ok: true,
      data: {
        status: adaptation.status,
        voteScore: adaptation.voteScore,
        voteCount: adaptation.voteCount,
        isCreatedByViewer: adaptation.createdByUserId === user.id,
        userVote,
        moderationReason: adaptation.moderationReason,
        message: getFamilyModerationMessage(adaptation.status, adaptation.moderationReason),
      },
    });
  } catch (error) {
    if (error instanceof AdaptationNotFound) {
      return NextResponse.json(
        { ok: false, code: error.code, message: error.message },
        { status: 404 }
      );
    }
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        { ok: false, code: error.code, message: error.message },
        { status: 403 }
      );
    }
    console.error(error);
    return NextResponse.json(
      { ok: false, code: 'INTERNAL_ERROR', message: 'Falha ao consultar status.' },
      { status: 500 }
    );
  }
}
