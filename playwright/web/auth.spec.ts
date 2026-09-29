import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

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

test('não apresenta violações WCAG na tela de autenticação', async ({
  page,
}) => {
  await page.goto('/');

  const accessibility = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();

  expect(accessibility.violations).toEqual([]);
});

test('mantém a tela utilizável em larguras de celular, tablet e computador', async ({
  page,
}) => {
  await page.goto('/');

  for (const viewport of [
    { width: 320, height: 740 },
    { width: 768, height: 1024 },
    { width: 1280, height: 900 },
  ]) {
    await page.setViewportSize(viewport);

    await expect(page.getByRole('heading', { name: 'Setlist' })).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Continuar com Google' }),
    ).toBeVisible();

    const documentWidth = await page.evaluate(
      () => document.documentElement.scrollWidth,
    );
    expect(documentWidth).toBeLessThanOrEqual(viewport.width);
  }
});

test('mantém um indicador visível ao navegar com o teclado', async ({
  page,
}) => {
  await page.goto('/');
  await page.keyboard.press('Tab');

  const focusedElement = page.locator(':focus-visible');
  await expect(focusedElement).toBeVisible();

  await expect
    .poll(() =>
      focusedElement.evaluate(
        (element) => getComputedStyle(element).outlineWidth,
      ),
    )
    .toBe('3px');
});
