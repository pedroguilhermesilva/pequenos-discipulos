import { NextResponse } from 'next/server';
import { requireCurrentUser } from '@/lib/auth/get-current-user';
import { container } from '@/lib/container';
import { DomainError } from '@/lib/domain/errors';

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
    const body = (await request.json()) as {
      adaptationId?: string;
      value?: number;
      parentUnlocked?: boolean;
      action?: 'vote' | 'family_approve' | 'share_community';
    };

    if (!body.parentUnlocked) {
      return NextResponse.json(
        { ok: false, code: 'UNAUTHORIZED', message: 'Validação parental necessária.' },
        { status: 403 }
      );
    }

    if (!body.adaptationId) {
      return NextResponse.json(
        { ok: false, code: 'VALIDATION_ERROR', message: 'adaptationId obrigatório.' },
        { status: 400 }
      );
    }

    if (body.action === 'family_approve') {
      const data = await container.services.votes.approveWithFamily(body.adaptationId);
      return NextResponse.json({ ok: true, data });
    }

    if (body.action === 'share_community') {
      const data = await container.services.votes.shareWithCommunity(body.adaptationId);
      return NextResponse.json({ ok: true, data });
    }

    const value = body.value === -1 ? -1 : 1;
    const data = await container.services.votes.vote(user.id, body.adaptationId, value);
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    if (error instanceof DomainError) {
      return NextResponse.json(
        { ok: false, code: error.code, message: error.message },
        { status: 400 }
      );
    }
    console.error(error);
    return NextResponse.json(
      { ok: false, code: 'VALIDATION_ERROR', message: 'Falha ao registrar voto.' },
      { status: 500 }
    );
  }
}
