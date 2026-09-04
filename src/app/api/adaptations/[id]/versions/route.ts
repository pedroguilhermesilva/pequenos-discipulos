import { NextResponse } from 'next/server';
import { container } from '@/lib/container';
import { DomainError } from '@/lib/domain/errors';

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const versions = await container.services.votes.listCommunityVersions(id);
    return NextResponse.json({
      ok: true,
      data: versions.map((v) => ({
        id: v.id,
        title: v.title,
        voteScore: v.voteScore,
        voteCount: v.voteCount,
        adaptationNote: v.adaptationNote,
        status: v.status,
      })),
    });
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
