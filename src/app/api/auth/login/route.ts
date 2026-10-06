import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authorizeCredentials, INVALID_CREDENTIALS_MESSAGE, signIn } from '@/auth';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const ipLimit = checkRateLimit(`login:ip:${ip}`, 20, 15 * 60 * 1000);
    if (!ipLimit.allowed) {
      return NextResponse.json({ ok: false, message: INVALID_CREDENTIALS_MESSAGE }, { status: 429 });
    }

    const body = loginSchema.parse(await request.json());
    const normalizedEmail = body.email.trim().toLowerCase();
    const emailLimit = checkRateLimit(`login:email:${normalizedEmail}`, 10, 15 * 60 * 1000);
    if (!emailLimit.allowed) {
      return NextResponse.json({ ok: false, message: INVALID_CREDENTIALS_MESSAGE }, { status: 429 });
    }

    const user = await authorizeCredentials(body.email, body.password);
    if (!user) {
      return NextResponse.json({ ok: false, message: INVALID_CREDENTIALS_MESSAGE }, { status: 401 });
    }

    await signIn('credentials', {
      email: body.email,
      password: body.password,
      redirect: false,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, message: INVALID_CREDENTIALS_MESSAGE }, { status: 400 });
    }

    console.error(error);
    return NextResponse.json({ ok: false, message: INVALID_CREDENTIALS_MESSAGE }, { status: 500 });
  }
}
