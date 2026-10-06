import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const OUT = '/opt/cursor/artifacts/screenshots-pr1';
const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:3000';
const DEV_EMAIL = 'dev@pequenos-discipulos.local';
const DEV_PASSWORD = 'devpassword123';

mkdirSync(OUT, { recursive: true });

async function shot(page, name) {
  const path = join(OUT, `${name}.png`);
  await page.screenshot({ path, fullPage: true });
  console.log('saved', path);
}

async function login(page) {
  await page.goto(`${BASE}/login`);
  await page.getByLabel('E-mail').fill(DEV_EMAIL);
  await page.getByLabel('Senha').fill(DEV_PASSWORD);
  await page.getByRole('button', { name: /^entrar$/i }).click();
  await page.waitForURL(/\/(perfis|onboarding|home)/, { timeout: 15000 });
  if (page.url().includes('/perfis')) {
    await page.getByRole('button', { name: /^davi$/i }).click();
    await page.waitForURL(/\/home/);
  }
}

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  // Login page
  await page.goto(`${BASE}/login`);
  await page.waitForLoadState('networkidle');
  await shot(page, '01-login');

  // Register form
  await page.getByRole('button', { name: /criar conta/i }).click();
  await page.waitForTimeout(300);
  await shot(page, '02-register');

  // Onboarding step 1 — use signup flow with fresh user or navigate directly
  // Log out first by clearing cookies and going to onboarding as new user path
  await context.clearCookies();
  await page.goto(`${BASE}/onboarding/step-1`);
  // May redirect to login — if so, use register then step-1
  if (page.url().includes('/login')) {
    await page.getByRole('button', { name: /criar conta/i }).click();
    const ts = Date.now();
    await page.getByLabel('Seu nome').fill('Teste Screenshot');
    await page.getByLabel('E-mail').fill(`screenshot-${ts}@example.local`);
    await page.getByLabel('Senha').fill('testpass123');
    await page.getByRole('button', { name: /^criar conta$/i }).click();
    await page.waitForURL(/\/onboarding\/step-1/, { timeout: 15000 }).catch(() => {});
  }
  if (!page.url().includes('/onboarding/step-1')) {
    await login(page);
    await page.goto(`${BASE}/onboarding/step-1?modo=novo`);
  }
  await page.getByText('3 a 5 anos').first().waitFor({ timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(500);
  await shot(page, '03-onboarding-step1-ages');

  // Story flow — loading + viewer + parent gate
  await context.clearCookies();
  await login(page);

  await page.goto(`${BASE}/stories/nova`);
  await page.getByRole('button', { name: /mateus 2:1/i }).click();
  await page.getByRole('button', { name: /continuar/i }).click();
  await page.getByRole('button', { name: /texto/i }).first().click();
  await page.getByRole('button', { name: /gerar história/i }).click();

  // Loading state
  await page.waitForSelector('text=Criando sua história', { timeout: 10000 }).catch(() => {});
  await shot(page, '05-story-generating-loading');

  await page.waitForURL(/pronto=1/, { timeout: 90000 });
  const regenBtn = page.getByRole('button', { name: /gerar novamente/i });
  await regenBtn.waitFor({ timeout: 15000 });
  await regenBtn.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await page.screenshot({
    path: join(OUT, '04-story-viewer-gerar-novamente.png'),
    fullPage: false,
  });
  console.log('saved', join(OUT, '04-story-viewer-gerar-novamente.png'));

  // Parent gate modal
  await page.getByRole('button', { name: /votar nesta versão/i }).click();
  await page.waitForSelector('#parent-gate-title', { timeout: 5000 });
  await shot(page, '06-parent-gate-modal');

  await browser.close();
  console.log('done');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
