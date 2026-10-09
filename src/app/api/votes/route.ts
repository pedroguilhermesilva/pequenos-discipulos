import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireCurrentUser } from '@/lib/auth/get-current-user';
import { verifyParentGateToken } from '@/lib/auth/parent-gate';
import { container } from '@/lib/container';
import { DomainError, UnauthorizedError } from '@/lib/domain/errors';

const voteSchema = z.object({
  adaptationId: z.string().min(1),
  value: z.number().int().optional(),
  action: z.enum(['vote', 'family_approve', 'share_community']).optional(),
});

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
    const parentVerified = await verifyParentGateToken();
    if (!parentVerified) {
      return NextResponse.json(
        { ok: false, code: 'UNAUTHORIZED', message: 'Validação parental necessária.' },
        { status: 403 }
      );
    }

    const body = voteSchema.parse(await request.json());
    const action = body.action ?? 'vote';

    if (action === 'family_approve') {
      const data = await container.services.votes.approveWithFamily(user.id, body.adaptationId);
      return NextResponse.json({ ok: true, data });
    }

    if (action === 'share_community') {
      const data = await container.services.votes.shareWithCommunity(user.id, body.adaptationId);
      return NextResponse.json({ ok: true, data });
    }

    const value = body.value === -1 ? -1 : 1;
    const { voteCount, voteScore } = await container.services.votes.vote(
      user.id,
      body.adaptationId,
      value
    );
    return NextResponse.json({ ok: true, data: { voteCount, voteScore } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, code: 'VALIDATION_ERROR', message: 'Dados inválidos.' },
        { status: 400 }
      );
    }

    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        { ok: false, code: error.code, message: error.message },
        { status: 403 }
      );
    }

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
