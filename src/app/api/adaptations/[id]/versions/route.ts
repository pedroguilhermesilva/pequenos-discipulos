import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth/get-current-user';
import { container } from '@/lib/container';
import { DomainError } from '@/lib/domain/errors';

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const versions = await container.services.votes.listCommunityVersions(id);

    let userId: string | null = null;
    try {
      userId = await getCurrentUserId();
    } catch {
      userId = null;
    }

    const enriched = await Promise.all(
      versions.map(async (version) => {
        let userVote: 1 | -1 | null = null;
        let isOwner = false;

        if (userId) {
          const vote = await container.repositories.votes.findByUserAndAdaptation(
            userId,
            version.id
          );
          userVote = vote?.value === -1 ? -1 : vote?.value === 1 ? 1 : null;
          isOwner =
            version.createdByUserId === userId ||
            (await container.repositories.userStories.findByUserAndAdaptation(
              userId,
              version.id
            )) !== null;
        }

        return {
          id: version.id,
          title: version.title,
          voteScore: version.voteScore,
          voteCount: version.voteCount,
          adaptationNote: version.adaptationNote,
          status: version.status,
          userVote,
          isOwner,
        };
      })
    );

    return NextResponse.json({ ok: true, data: enriched });
  } catch (error) {
    if (error instanceof DomainError) {
      return NextResponse.json(
        { ok: false, code: error.code, message: error.message },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: false, message: 'Erro ao listar versões.' }, { status: 500 });
  }
}
