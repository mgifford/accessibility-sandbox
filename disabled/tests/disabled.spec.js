import path from 'node:path';
import { pathToFileURL } from 'node:url';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const pageUrl = pathToFileURL(path.resolve('index.html')).href;

test.beforeEach(async ({ page }) => {
  await page.goto(pageUrl);
});

test('switches visual treatment and theme through shareable parameters', async ({ page }) => {
  await page.getByLabel('Merge request !16905').check();
  await page.getByLabel('Dark', { exact: true }).check();

  await expect(page.locator('html')).toHaveAttribute('data-implementation', 'proposal');
  await expect(page.locator('html')).toHaveAttribute('data-resolved-theme', 'dark');
  await expect(page).toHaveURL(/implementation=proposal/);
  await expect(page).toHaveURL(/theme=dark/);
  await expect(page.locator('[data-metric="disabled-background"]')).toContainText(':1');
});

test('native disabled and aria-disabled buttons have different focus behaviour', async ({ page }) => {
  const nativeDisabled = page.locator('button[disabled][aria-describedby="native-reason"]');
  const ariaDisabled = page.locator('#aria-disabled-button');

  await expect(nativeDisabled).toBeDisabled();
  await ariaDisabled.focus();
  await expect(ariaDisabled).toBeFocused();
  await ariaDisabled.press('Enter');

  await expect(ariaDisabled).toHaveAttribute('data-activation-count', '0');
  await expect(page.locator('#aria-disabled-status')).toContainText('was not activated');
});

test('active validation reports an error and moves focus', async ({ page }) => {
  await page.locator('#validation-form .button-primary').click();

  await expect(page.locator('#error-summary')).toBeVisible();
  await expect(page.locator('#error-summary-heading')).toBeFocused();
  await expect(page.locator('#reviewer-email')).toHaveAttribute('aria-invalid', 'true');
});

test('inert removes the region from interaction until restored', async ({ page }) => {
  const toggle = page.locator('#inert-toggle');
  const region = page.locator('#inert-region');

  await toggle.click();
  await expect(region).toHaveAttribute('inert', '');
  await expect(region).toHaveAttribute('aria-busy', 'true');
  await expect(page.locator('#inert-status')).toBeVisible();

  await toggle.click();
  await expect(region).not.toHaveAttribute('inert', '');
  await expect(region).toHaveAttribute('aria-busy', 'false');
});

test('has no automatically detectable axe violations', async ({ page }) => {
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
