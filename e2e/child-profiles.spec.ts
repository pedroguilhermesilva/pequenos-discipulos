import { test, expect, type Page } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { DEFAULT_PREFERENCES } from '../src/lib/onboarding/defaults';

const DEV_EMAIL = 'dev@pequenos-discipulos.local';
const DEV_PASSWORD = 'devpassword123';
const DEV_USER_ID = process.env.DEV_USER_ID ?? 'dev-user-1';
const SECOND_CHILD_ID = 'e2e-child-2';

const prisma = new PrismaClient();

async function loginWithCredentials(page: Page) {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill(DEV_EMAIL);
  await page.getByLabel('Senha').fill(DEV_PASSWORD);
  await page.getByRole('button', { name: /^entrar$/i }).click();
  await expect(page).toHaveURL(/\/(perfis|onboarding|home)/, { timeout: 15_000 });
}

async function solveParentGate(page: Page) {
  const mathText = await page.locator('.font-display.font-bold.text-2xl').first().textContent();
  const match = mathText?.match(/(\d+)\s*[×x]\s*(\d+)/i);
  if (!match) {
    throw new Error(`Não foi possível ler o desafio parental: ${mathText}`);
  }
  const answer = Number(match[1]) * Number(match[2]);
  await page.getByPlaceholder('Sua resposta').fill(String(answer));
  await page.getByRole('button', { name: /^confirmar$/i }).click();
}

async function expectDashboardForChild(page: Page, childName: RegExp, ageLabel: string) {
  await expect(page).toHaveURL(/\/home/);
  await expect(page.getByRole('heading', { name: /prontos para mais uma história/i })).toBeVisible();
  await expect(page.locator('header').getByText(ageLabel)).toBeVisible();
  await expect(page.getByText(childName).first()).toBeVisible();
}

test.describe('child profiles', () => {
  test.beforeAll(async () => {
    await prisma.user.update({
      where: { id: DEV_USER_ID },
      data: { subscriptionTier: 'premium' },
    });

    await prisma.childProfile.upsert({
      where: { id: SECOND_CHILD_ID },
      update: {
        name: 'Maria',
        preferences: {
          ...DEFAULT_PREFERENCES,
          childName: 'Maria',
          ageGroup: '9-11',
        },
      },
      create: {
        id: SECOND_CHILD_ID,
        userId: DEV_USER_ID,
        name: 'Maria',
        avatarColor: 'vida',
        preferences: {
          ...DEFAULT_PREFERENCES,
          childName: 'Maria',
          ageGroup: '9-11',
        },
      },
    });
  });

  test.afterAll(async () => {
    await prisma.childProfile.deleteMany({ where: { id: SECOND_CHILD_ID } }).catch(() => undefined);
    await prisma.user.update({
      where: { id: DEV_USER_ID },
      data: { subscriptionTier: 'free' },
    });
    await prisma.$disconnect();
  });

  test('switching between children updates dashboard data each time', async ({ page }) => {
    await loginWithCredentials(page);

    if (page.url().includes('/perfis')) {
      await page.getByRole('button', { name: /^davi$/i }).click();
    }

    await expectDashboardForChild(page, /davi/i, '3 a 5 anos');

    await page.goto('/perfis');
    await page.getByRole('button', { name: /^maria$/i }).click();
    await expectDashboardForChild(page, /maria/i, '9 a 11 anos');
    await expect(page.locator('header').getByText('3 a 5 anos')).not.toBeVisible();

    await page.goto('/perfis');
    await page.getByRole('button', { name: /^davi$/i }).click();
    await expectDashboardForChild(page, /davi/i, '3 a 5 anos');
    await expect(page.locator('header').getByText('9 a 11 anos')).not.toBeVisible();
  });

  test('deleting a child removes it from settings and shows feedback', async ({ page }) => {
    await loginWithCredentials(page);

    if (page.url().includes('/perfis')) {
      await page.getByRole('button', { name: /^maria$/i }).click();
      await expect(page).toHaveURL(/\/home/);
    }

    await page.goto('/configuracoes');
    await expect(page.getByText('Maria', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: /remover perfil de maria/i }).click();
    await expect(page.getByRole('heading', { name: /excluir perfil de maria/i })).toBeVisible();
    await page.getByRole('button', { name: /sim, excluir perfil/i }).click();

    await solveParentGate(page);

    await expect(page.getByText(/perfil de maria excluído com sucesso/i)).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText('Maria', { exact: true })).not.toBeVisible();

    await prisma.childProfile.upsert({
      where: { id: SECOND_CHILD_ID },
      update: {
        name: 'Maria',
        preferences: {
          ...DEFAULT_PREFERENCES,
          childName: 'Maria',
          ageGroup: '9-11',
        },
      },
      create: {
        id: SECOND_CHILD_ID,
        userId: DEV_USER_ID,
        name: 'Maria',
        avatarColor: 'vida',
        preferences: {
          ...DEFAULT_PREFERENCES,
          childName: 'Maria',
          ageGroup: '9-11',
        },
      },
    });
  });
});
