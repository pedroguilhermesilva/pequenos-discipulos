import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import { syncOAuthUserFullName } from '@/lib/auth/oauth-user';
import { prisma } from '@/lib/db/prisma';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { resolveUserDisplayName } from '@/lib/user/display-name';

const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim();
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

/** Constant-time compare target when the user does not exist. */
const DUMMY_PASSWORD_HASH =
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYH8QqGqK0i';

export const INVALID_CREDENTIALS_MESSAGE = 'Credenciais inválidas.';

export async function authorizeCredentials(
  email: string,
  password: string,
  request?: Request
): Promise<{ id: string; email: string | null; name: string | null; image: string | null } | null> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !password) return null;

  if (request) {
    const ip = getClientIp(request);
    const ipLimit = await checkRateLimit(`login:ip:${ip}`, 20, 15 * 60 * 1000);
    const emailLimit = await checkRateLimit(`login:email:${normalizedEmail}`, 10, 15 * 60 * 1000);
    if (!ipLimit.allowed || !emailLimit.allowed) {
      return null;
    }
  }

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  const hash = user?.passwordHash ?? DUMMY_PASSWORD_HASH;
  const valid = await bcrypt.compare(password, hash);

  if (!user?.passwordHash || !valid) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: resolveUserDisplayName(user),
    image: user.image,
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'E-mail', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toString() ?? '';
        const password = credentials?.password?.toString() ?? '';
        return authorizeCredentials(email, password);
      },
    }),
    ...(googleClientId && googleClientSecret
      ? [
          Google({
            clientId: googleClientId,
            clientSecret: googleClientSecret,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
  ],
  events: {
    async createUser({ user }) {
      await syncOAuthUserFullName(prisma, user.id!, user.name);
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
      }
      if (user?.name) {
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        if (typeof token.name === 'string') {
          session.user.name = token.name;
        }
      }
      return session;
    },
  },
});
