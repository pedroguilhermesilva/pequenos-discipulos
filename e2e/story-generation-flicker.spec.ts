import { test, expect, type Page } from '@playwright/test';

const DEV_EMAIL = 'dev@pequenos-discipulos.local';
const DEV_PASSWORD = 'devpassword123';

const CONTENT_TYPE_LABELS = {
  text: /texto/i,
  audio: /áudio/i,
} as const;

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
}

async function generateStory(page: Page, contentType: 'text' | 'audio' = 'text') {
  await page.goto('/stories/nova');
  await page.getByRole('button', { name: /mateus 2:1/i }).click();
  await page.getByRole('button', { name: /continuar/i }).click();
  await expect(page.getByRole('heading', { name: /como deseja gerar a história/i })).toBeVisible();
  await page.getByRole('button', { name: CONTENT_TYPE_LABELS[contentType] }).first().click();
  await page.getByRole('button', { name: /gerar história/i }).click();
}

async function waitForStoryViewer(page: Page) {
  await expect(page).toHaveURL(/pronto=1/, { timeout: 90_000 });
  await expect(page).toHaveURL(/\/stories\/nova\?/, { timeout: 5_000 });
  await expect(page).toHaveURL(/historia=/, { timeout: 5_000 });
  await expect(page.getByText(/versão adaptada via ia/i)).toBeVisible({ timeout: 30_000 });
}

test.describe('story generation flicker (mobile production)', () => {
  test('does not show loading spinners after the story viewer appears', async ({ page }) => {
    test.setTimeout(120_000);
    await loginWithCredentials(page);
    await generateStory(page, 'text');
    await waitForStoryViewer(page);

    await page.screenshot({
      path: 'e2e/artifacts/story-viewer-after-fix.png',
      fullPage: true,
    });

    let flickerDetected = false;
    const startedAt = Date.now();
    while (Date.now() - startedAt < 3_000) {
      const pageSpinner = await page.getByTestId('story-page-loading').count();
      const adaptationSpinner = await page.getByTestId('story-adaptation-loading').count();
      if (pageSpinner > 0 || adaptationSpinner > 0) {
        flickerDetected = true;
        await page.screenshot({
          path: 'e2e/artifacts/story-flicker-detected.png',
          fullPage: true,
        });
        break;
      }
      await page.waitForTimeout(150);
    }

    expect(flickerDetected).toBe(false);
    await expect(page.getByText(/versão adaptada via ia/i)).toBeVisible();
  });

  test('captures stable viewer screenshot for audio generation', async ({ page }) => {
    test.setTimeout(120_000);
    await loginWithCredentials(page);
    await generateStory(page, 'audio');
    await waitForStoryViewer(page);

    await page.waitForTimeout(2_000);
    await expect(page.getByTestId('story-page-loading')).toHaveCount(0);
    await expect(page.getByTestId('story-adaptation-loading')).toHaveCount(0);

    await page.screenshot({
      path: 'e2e/artifacts/story-audio-viewer-stable.png',
      fullPage: true,
    });
  });
});
