import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth/require-admin';
import { container } from '@/lib/container';
import { AdaptationNotFound, UnauthorizedError } from '@/lib/domain/errors';

const actionSchema = z.object({
  action: z.enum(['approve', 'reject', 'withdraw']),
  reason: z.string().optional(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await context.params;
    const body = actionSchema.parse(await request.json());

    if (body.action === 'approve') {
      await container.services.moderation.adminApprove(id, admin.id, body.reason);
    } else if (body.action === 'reject') {
      const reason = body.reason?.trim() || 'Versão recusada pela moderação.';
      await container.services.moderation.adminReject(id, admin.id, reason);
    } else {
      const reason = body.reason?.trim() || 'Versão retirada da comunidade.';
      await container.services.moderation.adminWithdraw(id, admin.id, reason);
    }

    return NextResponse.json({ ok: true });
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
    if (error instanceof AdaptationNotFound) {
      return NextResponse.json(
        { ok: false, code: error.code, message: error.message },
        { status: 404 }
      );
    }
    console.error(error);
    return NextResponse.json(
      { ok: false, code: 'INTERNAL_ERROR', message: 'Falha na ação de moderação.' },
      { status: 500 }
    );
  }
}
