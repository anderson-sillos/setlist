import { expect, test } from '@playwright/test';

test('abre a tela de autenticação e apresenta os provedores disponíveis', async ({
  page,
}) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Setlist' })).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Continuar com Google' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Continuar com Apple (em breve)' }),
  ).toBeDisabled();
  expect(pageErrors).toEqual([]);
});
