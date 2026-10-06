import { beforeEach, vi } from 'vitest';

const DEV_USER_ID = process.env.DEV_USER_ID ?? 'dev-user-1';

vi.mock('@/auth', () => ({
  auth: vi.fn(async () => ({
    user: {
      id: DEV_USER_ID,
      email: 'dev@pequenos-discipulos.local',
      name: 'Conta de desenvolvimento',
    },
  })),
  signIn: vi.fn(),
  signOut: vi.fn(),
  handlers: {},
}));

beforeEach(() => {
  process.env.AUTH_SECRET = process.env.AUTH_SECRET ?? 'test-auth-secret-for-vitest-only';
});
