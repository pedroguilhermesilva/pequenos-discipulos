import { defineConfig, devices } from '@playwright/test';

const databaseUrl =
  process.env.DATABASE_URL ??
  'postgresql://postgres:postgres@localhost:5432/pequenos_discipulos';

const isCspProduction = process.env.E2E_CSP_PRODUCTION === '1';

const sharedServerEnv = {
  ...process.env,
  DATABASE_URL: databaseUrl,
  DIRECT_URL: process.env.DIRECT_URL ?? databaseUrl,
  AUTH_SECRET: process.env.AUTH_SECRET ?? 'playwright-test-auth-secret',
  AUTH_URL: 'http://127.0.0.1:3000',
  LLM_USE_STUB: 'true',
  TTS_USE_STUB: 'true',
  ...(isCspProduction
    ? {
        E2E_CSP_FIXTURE: '1',
        NODE_ENV: 'production',
      }
    : {}),
};

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  timeout: 60_000,
  globalSetup: './e2e/global-setup.ts',
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
  },
  projects: isCspProduction
    ? [{ name: 'csp-production', use: { ...devices['Desktop Chrome'] } }]
    : [
        {
          name: 'chromium',
          use: { ...devices['Desktop Chrome'] },
          testIgnore: /csp-violations\.spec\.ts/,
        },
      ],
  webServer: {
    command: isCspProduction ? 'npm start' : 'npm run dev',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI && !isCspProduction,
    timeout: 120_000,
    env: sharedServerEnv,
  },
});
