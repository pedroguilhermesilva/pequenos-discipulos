import { NextResponse } from 'next/server';
import { requireCurrentUser } from '@/lib/auth/get-current-user';
import { issueParentGateToken } from '@/lib/auth/parent-gate';
import { z } from 'zod';

const verifySchema = z.object({
  a: z.number().int().positive(),
  b: z.number().int().positive(),
  answer: z.number().int(),
});

export async function POST(request: Request) {
  try {
    await requireCurrentUser();
    const body = verifySchema.parse(await request.json());

    if (body.answer !== body.a * body.b) {
      return NextResponse.json(
        { ok: false, message: 'Resposta incorreta. Tente novamente.' },
        { status: 403 }
      );
    }

    await issueParentGateToken();
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, message: 'Dados inválidos.' }, { status: 400 });
    }

    console.error(error);
    return NextResponse.json(
      { ok: false, message: 'Não foi possível validar o gate parental.' },
      { status: 500 }
    );
  }
}
