import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres.'),
  fullName: z.string().min(1).optional(),
});

const GENERIC_REGISTER_FAILURE =
  'Não foi possível criar a conta. Verifique os dados ou faça login.';

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const limit = checkRateLimit(`register:ip:${ip}`, 10, 60 * 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json({ ok: false, message: GENERIC_REGISTER_FAILURE }, { status: 429 });
    }

    const body = registerSchema.parse(await request.json());
    const email = body.email.trim().toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ ok: false, message: GENERIC_REGISTER_FAILURE }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(body.password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        fullName: body.fullName?.trim() || email.split('@')[0],
        passwordHash,
      },
    });

    return NextResponse.json({
      ok: true,
      data: { userId: user.id, email: user.email },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, message: error.errors[0]?.message ?? 'Dados inválidos.' },
        { status: 400 }
      );
    }

    console.error(error);
    return NextResponse.json({ ok: false, message: GENERIC_REGISTER_FAILURE }, { status: 500 });
  }
}
