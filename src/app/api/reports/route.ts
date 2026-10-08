import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireCurrentUser } from '@/lib/auth/get-current-user';
import { container } from '@/lib/container';
import { AdaptationNotFound, DomainError } from '@/lib/domain/errors';

const reportSchema = z.object({
  adaptationId: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
    const body = reportSchema.parse(await request.json());
    const data = await container.services.moderation.reportCommunityVersion(
      user.id,
      body.adaptationId
    );
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, code: 'VALIDATION_ERROR', message: 'Dados inválidos.' },
        { status: 400 }
      );
    }
    if (error instanceof AdaptationNotFound) {
      return NextResponse.json(
        { ok: false, code: error.code, message: error.message },
        { status: 404 }
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
      { ok: false, code: 'INTERNAL_ERROR', message: 'Não foi possível registrar a denúncia.' },
      { status: 500 }
    );
  }
}
