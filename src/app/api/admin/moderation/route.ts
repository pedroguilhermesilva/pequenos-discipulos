import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-admin';
import { container } from '@/lib/container';
import { UnauthorizedError } from '@/lib/domain/errors';

export async function GET() {
  try {
    await requireAdmin();
    const data = await container.services.moderation.listPendingManualReview();
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        { ok: false, code: error.code, message: error.message },
        { status: 403 }
      );
    }
    console.error(error);
    return NextResponse.json(
      { ok: false, code: 'INTERNAL_ERROR', message: 'Falha ao listar revisões.' },
      { status: 500 }
    );
  }
}
