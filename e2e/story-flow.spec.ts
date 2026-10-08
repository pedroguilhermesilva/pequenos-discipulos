import { test, expect, type Page } from '@playwright/test';

const DEV_EMAIL = 'dev@pequenos-discipulos.local';
const DEV_PASSWORD = 'devpassword123';

async function loginWithCredentials(page: Page) {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill(DEV_EMAIL);
  await page.getByLabel('Senha').fill(DEV_PASSWORD);
  await page.getByRole('button', { name: /^entrar$/i }).click();
  await expect(page).toHaveURL(/\/(perfis|onboarding|home)/, { timeout: 15_000 });

  if (page.url().includes('/perfis')) {
    await page.getByRole('button', { name: /^davi$/i }).click();
    await expect(page).toHaveURL(/\/home/);
  }

  await expect(page.getByRole('heading', { name: /prontos para mais uma história/i })).toBeVisible();
}

test.describe('story generation flow', () => {
  test('login continues into the app', async ({ page }) => {
    await loginWithCredentials(page);
  });

  test('choose passage, generate and read story', async ({ page }) => {
    await loginWithCredentials(page);
    await page.goto('/stories/nova');

    await expect(page.getByRole('heading', { name: /escolha a passagem bíblica/i })).toBeVisible();

    await page.getByRole('button', { name: /mateus 2:1/i }).click();
    await page.getByRole('button', { name: /continuar/i }).click();

    await expect(page.getByRole('heading', { name: /como deseja gerar a história/i })).toBeVisible();
    await page.getByRole('button', { name: /texto/i }).first().click();
    await page.getByRole('button', { name: /gerar história/i }).click();

    await expect(page).toHaveURL(/pronto=1/, { timeout: 90_000 });
    await expect(page).toHaveURL(/\/stories\/nova\?.*historia=/, { timeout: 5_000 });
    await expect(page.getByRole('heading', { name: /história: mateus/i })).toBeVisible();
    await expect(page.getByText(/era uma vez, no céu muito azul/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /gerar novamente/i })).toBeVisible();
  });
});
