import { test, expect } from '@playwright/test';

test('o tutorial abre antes do login e preserva a questão durante a partida', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('link', { name: 'Como jogar' }).click();
  await expect(page.getByRole('heading', { name: 'Como jogar' })).toBeVisible();
  await page.getByRole('link', { name: 'Voltar ao jogo', exact: true }).click();
  await page.getByRole('button', { name: 'Experimentar modo treino' }).click();
  const guideTab = page.getByRole('navigation', { name: 'Principal' }).getByRole('button', { name: 'Como jogar' });
  await page.getByRole('main').getByRole('button', { name: 'Como jogar' }).click();
  await expect(guideTab).toHaveAttribute('aria-current', 'page');
  await expect(page.getByRole('heading', { name: '3. Confira o resultado' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Voltar', exact: true }).click();
  await page.getByRole('button', { name: 'Começar partida' }).click();
  await page.locator('[data-option="1"]').click();
  await page.getByRole('button', { name: 'Confirmar resposta' }).click();
  await expect(page.getByText('QUESTÃO 02', { exact: true })).toBeVisible();
  await page.locator('[data-option="0"]').click();
  await guideTab.click();
  await page.getByRole('button', { name: 'Voltar à pergunta' }).click();
  await expect(page.getByText('QUESTÃO 02', { exact: true })).toBeVisible();
  await expect(page.locator('[data-option="0"]')).toHaveAttribute('aria-pressed', 'true');
});
