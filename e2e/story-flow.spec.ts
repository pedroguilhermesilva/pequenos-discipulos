import { test, expect, type Page } from '@playwright/test';

async function continueFromLogin(page: Page) {
  await page.goto('/login');
  await page.getByRole('button', { name: /modo de desenvolvimento/i }).click();
  await expect(page).toHaveURL(/\/(perfis|onboarding|home)/);

  if (page.url().includes('/perfis')) {
    await page.getByRole('button', { name: /^davi$/i }).click();
    await expect(page).toHaveURL(/\/home/);
    await expect(page.getByRole('heading', { name: /prontos para mais uma história/i })).toBeVisible();
    return;
  }

  if (page.url().includes('/onboarding')) {
    await expect(page.getByRole('heading', { name: /vamos conhecer seu pequeno/i })).toBeVisible();
    return;
  }

  await expect(page.getByRole('heading', { name: /prontos para mais uma história/i })).toBeVisible();
}

test.describe('story generation flow', () => {
  test('login continues into the app', async ({ page }) => {
    await continueFromLogin(page);
  });

  test('choose passage, generate and read story', async ({ page }) => {
    await page.goto('/stories/nova');

    await expect(page.getByRole('heading', { name: /escolha a passagem bíblica/i })).toBeVisible();

    await page.getByRole('button', { name: /mateus 2:1/i }).click();
    await page.getByRole('button', { name: /continuar/i }).click();

    await expect(page.getByRole('heading', { name: /como deseja gerar a história/i })).toBeVisible();
    await page.getByRole('button', { name: /texto/i }).first().click();
    await page.getByRole('button', { name: /gerar história/i }).click();

    await expect(page).toHaveURL(/pronto=1/, { timeout: 90_000 });
    await expect(page.getByRole('heading', { name: /a estrela de mateus/i })).toBeVisible();
    await expect(page.getByText(/um bebezinho muito especial/i)).toBeVisible();
  });
});
