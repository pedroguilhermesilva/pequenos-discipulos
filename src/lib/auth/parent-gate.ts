import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'parent_gate_token';

function getSecret() {
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret) {
    throw new Error('AUTH_SECRET não configurado.');
  }
  return new TextEncoder().encode(secret);
}

export async function issueParentGateToken(): Promise<void> {
  const token = await new SignJWT({ verified: true })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('15m')
    .sign(getSecret());

  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
  });
}

export async function verifyParentGateToken(): Promise<boolean> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return false;

  try {
    await jwtVerify(token, getSecret());
    return true;
  } catch {
    return false;
  }
}

export async function clearParentGateToken(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}
