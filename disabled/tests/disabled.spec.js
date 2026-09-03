import path from 'node:path';
import { pathToFileURL } from 'node:url';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const pageUrl = pathToFileURL(path.resolve('index.html')).href;

test.beforeEach(async ({ page }) => {
  await page.goto(pageUrl);
});

// --- Existing comparisons (preserved) --------------------------------------

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

// --- Radio groups (section 1) ----------------------------------------------

test('content radio groups each have at least three choices sharing a name', async ({ page }) => {
  const groups = page.locator('#controls fieldset[data-radio-group]');
  await expect(groups).toHaveCount(3);

  const count = await groups.count();
  for (let i = 0; i < count; i += 1) {
    const group = groups.nth(i);
    const radios = group.locator('input[type="radio"]');
    await expect(radios).toHaveCount(await radios.count());
    expect(await radios.count()).toBeGreaterThanOrEqual(3);

    const names = await radios.evaluateAll((els) => [...new Set(els.map((el) => el.name))]);
    expect(names).toHaveLength(1);

    await expect(group.locator('legend')).toHaveText(/\w/);
  }
});

test('only one radio in a group can be checked', async ({ page }) => {
  await page.locator('#digest-daily').check();
  await expect(page.locator('#digest-daily')).toBeChecked();
  await expect(page.locator('#digest-weekly')).not.toBeChecked();
  await expect(page.locator('#digest-monthly')).not.toBeChecked();
  const checked = page.locator('input[name="digest-frequency"]:checked');
  await expect(checked).toHaveCount(1);
});

test('arrow keys change the selected option in an enabled group', async ({ page }) => {
  await page.locator('#digest-daily').focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('#digest-weekly')).toBeChecked();
  await expect(page.locator('#digest-weekly')).toBeFocused();
});

test('Tab enters and leaves an enabled radio group', async ({ page }) => {
  await page.locator('#digest-weekly').focus();
  await expect(page.locator('#digest-weekly')).toBeFocused();
  await page.keyboard.press('Tab');
  // Focus leaves the group's checked radio to the next group's controls.
  await expect(page.locator('#digest-weekly')).not.toBeFocused();
});

test('an individually disabled radio option cannot be selected', async ({ page }) => {
  const sameDay = page.locator('#delivery-same-day');
  await expect(sameDay).toBeDisabled();
  // A disabled radio does not become checked when clicked (force past pointer-events).
  await sameDay.click({ force: true }).catch(() => {});
  await expect(sameDay).not.toBeChecked();
  await expect(page.locator('#delivery-standard')).toBeChecked();
});

test('records how arrow navigation treats an individually disabled option', async ({ page }, testInfo) => {
  // Browsers differ in whether ArrowKey navigation skips a disabled radio or
  // stops on it. This test records the observed behaviour for the running
  // browser instead of asserting one universal outcome.
  await page.locator('#delivery-express').focus();
  await page.keyboard.press('ArrowDown');
  const landedOn = await page.evaluate(() => document.activeElement?.id ?? '');
  const disabledGotChecked = await page.locator('#delivery-same-day').isChecked();
  testInfo.annotations.push({
    type: 'arrow-nav-observation',
    description: `${testInfo.project.name}: ArrowDown from Express landed on "${landedOn}"; disabled option checked=${disabledGotChecked}`,
  });
  // The one invariant we DO assert everywhere: a disabled option is never selected.
  expect(disabledGotChecked).toBe(false);
});

test('a disabled fieldset makes descendant radios effectively disabled', async ({ page }) => {
  await expect(page.locator('#billing-monthly')).toBeDisabled();
  await expect(page.locator('#billing-quarterly')).toBeDisabled();
  // The pre-checked value stays checked (dot preserved), not reset.
  await expect(page.locator('#billing-monthly')).toBeChecked();
});

test('enabled and disabled radio groups have legends and descriptions', async ({ page }) => {
  await expect(page.locator('fieldset[data-radio-group="enabled"] legend')).toHaveText(/available/i);
  await expect(page.locator('#delivery-partial-note')).toBeVisible();
  await expect(page.locator('#billing-whole-note')).toBeVisible();
});

// --- Native input types (section 2) ----------------------------------------

for (const type of ['file', 'date', 'time', 'datetime-local', 'number', 'range']) {
  test(`native ${type} input has enabled and disabled examples`, async ({ page }) => {
    const enabled = page.locator(`#controls input[type="${type}"]:not([disabled])`).first();
    const disabled = page.locator(`#controls input[type="${type}"][disabled]`).first();
    await expect(enabled).toBeVisible();
    await expect(disabled).toBeDisabled();
  });
}

test('file input has a label, hint, multiple example, and disabled example', async ({ page }) => {
  await expect(page.locator('label[for="file-enabled"]')).toBeVisible();
  await expect(page.locator('#file-enabled-hint')).toContainText(/MB/);
  await expect(page.locator('#file-multiple')).toHaveAttribute('multiple', '');
  await expect(page.locator('#file-disabled')).toBeDisabled();
});

// Read the resolved colour triple for a control.
async function controlColours(page, selector) {
  return page.locator(selector).evaluate((el) => {
    const s = getComputedStyle(el);
    return { color: s.color, background: s.backgroundColor, border: s.borderTopColor };
  });
}

for (const type of [
  { name: 'file', enabled: '#file-enabled', disabled: '#file-disabled' },
  { name: 'date', enabled: '#date-enabled', disabled: '#date-disabled' },
  { name: 'time', enabled: '#time-enabled', disabled: '#time-disabled' },
  { name: 'datetime', enabled: '#datetime-enabled', disabled: '#datetime-disabled' },
  { name: 'number', enabled: '#number-enabled', disabled: '#number-disabled' },
]) {
  test(`${type.name}: disabled input differs from enabled in colour (both Drupal treatments)`, async ({ page }) => {
    for (const impl of ['Current main', 'Merge request !16905']) {
      await page.getByLabel(impl).check();
      const enabled = await controlColours(page, type.enabled);
      const disabled = await controlColours(page, type.disabled);
      const differs =
        enabled.color !== disabled.color ||
        enabled.background !== disabled.background ||
        enabled.border !== disabled.border;
      expect(differs, `${type.name} disabled must differ from enabled under ${impl}`).toBe(true);
    }
  });
}

test('the file-selector button differs between enabled and disabled', async ({ page }) => {
  const enabledButton = await page.locator('#file-enabled').evaluate(
    (el) => getComputedStyle(el, '::file-selector-button').backgroundColor,
  );
  const disabledButton = await page.locator('#file-disabled').evaluate(
    (el) => getComputedStyle(el, '::file-selector-button').backgroundColor,
  );
  expect(enabledButton).not.toBe(disabledButton);
});

for (const control of [
  { name: 'file', id: 'file-disabled', reason: 'file-disabled-reason', hint: 'file-disabled-hint' },
  { name: 'date', id: 'date-disabled', reason: 'date-disabled-reason' },
  { name: 'time', id: 'time-disabled', reason: 'time-disabled-reason' },
  { name: 'datetime', id: 'datetime-disabled', reason: 'datetime-disabled-reason' },
]) {
  test(`${control.name}: disabled control has an Unavailable badge and a visible reason`, async ({ page }) => {
    const item = page.locator(`#${control.id}`).locator('xpath=ancestor::div[contains(@class,"form-item")]');
    await expect(item.locator('.state-badge')).toHaveText('Unavailable');
    await expect(page.locator(`#${control.reason}`)).toBeVisible();

    // aria-describedby references the reason (and the format hint where present).
    const describedBy = (await page.locator(`#${control.id}`).getAttribute('aria-describedby')) || '';
    expect(describedBy.split(/\s+/)).toContain(control.reason);
    if (control.hint) {
      expect(describedBy.split(/\s+/)).toContain(control.hint);
    }
  });
}

test('the disabled reason stays at full readable contrast, not the muted hint colour', async ({ page }) => {
  const reasonColour = await page.locator('#file-disabled-reason').evaluate((el) => getComputedStyle(el).color);
  const hintColour = await page.locator('#file-disabled-hint').evaluate((el) => getComputedStyle(el).color);
  const bodyText = await page.locator('body').evaluate((el) => getComputedStyle(el).color);
  // The reason matches body text; the hint is muted and therefore different.
  expect(reasonColour).toBe(bodyText);
  expect(reasonColour).not.toBe(hintColour);
});

test('number and range inputs carry meaningful min, max, and step', async ({ page }) => {
  await expect(page.locator('#number-enabled')).toHaveAttribute('min', '0');
  await expect(page.locator('#number-enabled')).toHaveAttribute('max', '20');
  await expect(page.locator('#number-enabled')).toHaveAttribute('step', '1');
  await expect(page.locator('#range-enabled')).toHaveAttribute('max', '100');
  await expect(page.locator('#range-enabled')).toHaveAttribute('step', '5');
});

test('file input and its selector button are styled', async ({ page }) => {
  const buttonBg = await page.locator('#file-enabled').evaluate(
    (el) => getComputedStyle(el, '::file-selector-button').backgroundColor,
  );
  expect(buttonBg).not.toBe('rgba(0, 0, 0, 0)');
  const disabledButtonCursor = await page.locator('#file-disabled').evaluate(
    (el) => getComputedStyle(el, '::file-selector-button').cursor,
  );
  expect(disabledButtonCursor).toBe('not-allowed');
});

// Focused visual snapshots of the native-control cards, which use
// browser-rendered internals (calendar, clock, file button) that differ between
// engines. Snapshots are per-card, not full-page, and are per-browser baselines.
//
// These baselines are captured on the developer's OS (macOS here). Native control
// rendering is OS-specific, so the baselines will not match a Linux CI runner;
// these tests are skipped on CI and are for local cross-browser visual review.
// Update baselines with: npm run test:cross-browser -- --update-snapshots
test.describe('native control snapshots (local only)', () => {
  test.skip(!!process.env.CI, 'Native-control snapshots are OS-specific; run locally.');

  test('date and time card matches its visual snapshot', async ({ page }, testInfo) => {
    const card = page.locator('#controls .control-set', { hasText: 'Date and time inputs' });
    await expect(card).toHaveScreenshot(`date-time-card-${testInfo.project.name}.png`, {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('file input card matches its visual snapshot', async ({ page }, testInfo) => {
    const card = page.locator('#controls .control-set', { hasText: 'File input' });
    await expect(card).toHaveScreenshot(`file-card-${testInfo.project.name}.png`, {
      maxDiffPixelRatio: 0.02,
    });
  });
});

// --- Placeholder matrix (section 3) ----------------------------------------

test('placeholder matrix compares all six states with real labels', async ({ page }) => {
  const matrix = page.locator('#placeholder-matrix');
  await expect(matrix.locator('input')).toHaveCount(6);
  // Every input has an explicit label.
  const ids = await matrix.locator('input').evaluateAll((els) => els.map((el) => el.id));
  for (const id of ids) {
    await expect(page.locator(`label[for="${id}"]`)).toHaveCount(1);
  }
  await expect(page.locator('#ph-disabled-empty')).toBeDisabled();
  await expect(page.locator('#ph-enabled-filled')).toHaveValue('Public website');
});

// --- Dynamic fieldset (section 4) ------------------------------------------

test('dynamic fieldset toggles availability with one status update each way', async ({ page }) => {
  const toggle = page.locator('#attachments-toggle');
  const fieldset = page.locator('#attachment-fields');
  const status = page.locator('#availability-status');

  // Playwright's toBeDisabled targets input-like controls; a <fieldset disabled>
  // is asserted via its attribute and the effective state of its descendants.
  await expect(fieldset).toHaveAttribute('disabled', '');
  await expect(page.locator('#attachment-file')).toBeDisabled();
  await expect(status).toHaveText('');

  // Drive the checkbox by keyboard so the focus check is meaningful cross-browser.
  await toggle.focus();
  await toggle.press('Space');
  await expect(toggle).toBeChecked();
  await expect(fieldset).not.toHaveAttribute('disabled', /.*/);
  await expect(page.locator('#attachment-file')).not.toBeDisabled();
  await expect(status).toHaveText('Attachment options are now available.');
  await expect(toggle).toBeFocused(); // focus stays on the controller
  expect(await fieldset.evaluate((el) => el.contains(document.activeElement))).toBe(false);

  await toggle.press('Space');
  await expect(toggle).not.toBeChecked();
  await expect(fieldset).toHaveAttribute('disabled', '');
  await expect(page.locator('#attachment-file')).toBeDisabled();
  await expect(status).toHaveText('Attachment options are unavailable.');
  await expect(toggle).toBeFocused();
});

test('the availability status container exists and is empty before any update', async ({ page }) => {
  const status = page.locator('#availability-status');
  await expect(status).toHaveAttribute('role', 'status');
  await expect(status).not.toHaveAttribute('hidden', /.*/);
  await expect(status).toHaveText('');
});

test('the controller stays outside the disabled fieldset', async ({ page }) => {
  const insideFieldset = await page.locator('#attachment-fields #attachments-toggle').count();
  expect(insideFieldset).toBe(0);
});

// --- Inert (section 5) -----------------------------------------------------

// Whether focus stays visibly on a <button> after a pointer click differs by
// platform: WebKit on macOS does not keep focus on a clicked button, while
// Chromium and Firefox do. The requirement we assert is that focus is never
// stolen INTO the region, which holds everywhere. We drive the toggle by
// keyboard so the focus-retention check is meaningful across browsers.
async function activateByKeyboard(locator) {
  await locator.focus();
  await locator.press('Enter');
}

test('inert removes the region from interaction and announces both directions', async ({ page }) => {
  const toggle = page.locator('#inert-toggle');
  const region = page.locator('#inert-region');
  const wrapper = page.locator('#inert-wrapper');
  const status = page.locator('#inert-status');

  await activateByKeyboard(toggle);
  await expect(region).toHaveAttribute('inert', '');
  await expect(wrapper).toHaveAttribute('aria-busy', 'true');
  await expect(status).toHaveText('Preferences are now unavailable.');
  await expect(toggle).toBeFocused();
  // Focus must not have moved into the region.
  const inside1 = await region.evaluate((el) => el.contains(document.activeElement));
  expect(inside1).toBe(false);

  await activateByKeyboard(toggle);
  await expect(region).not.toHaveAttribute('inert', '');
  await expect(wrapper).toHaveAttribute('aria-busy', 'false');
  await expect(status).toHaveText('Preferences are now available again.');
  await expect(toggle).toBeFocused();
  const inside2 = await region.evaluate((el) => el.contains(document.activeElement));
  expect(inside2).toBe(false);
});

test('inert links and controls leave and return to the focus order', async ({ page }) => {
  const link = page.locator('#inert-region a');
  await page.locator('#inert-toggle').click();
  // While inert, the link is not focusable.
  const focusableWhileInert = await link.evaluate((el) => el.matches(':disabled') || el.closest('[inert]') !== null);
  expect(focusableWhileInert).toBe(true);
  await page.locator('#inert-toggle').click();
  const backInTree = await link.evaluate((el) => el.closest('[inert]') === null);
  expect(backInTree).toBe(true);
});

test('the inert status container is never hidden', async ({ page }) => {
  const status = page.locator('#inert-status');
  await expect(status).not.toHaveAttribute('hidden', /.*/);
  await page.locator('#inert-toggle').click();
  await expect(status).not.toHaveAttribute('hidden', /.*/);
});

// --- Form-data consequences (section 6) ------------------------------------

test('form data includes readonly and enabled values but omits disabled ones', async ({ page }) => {
  await page.locator('#consequences-form button[type="submit"]').click();
  const output = await page.locator('#submitted-data-output').textContent();
  const keys = output.split('\n').map((line) => line.split(':')[0].trim());

  // Present:
  expect(keys).toContain('enabled-text');
  expect(keys).toContain('readonly-text');
  expect(keys).toContain('enabled-check');
  expect(keys).toContain('fd-choice');
  // Absent (disabled controls and disabled fieldset descendants):
  expect(keys).not.toContain('disabled-text');
  expect(keys).not.toContain('disabled-check');
  expect(keys).not.toContain('fd-locked');
});

// --- Visual treatments (section 7) -----------------------------------------

test('at least four non-grey-only visual treatments are present', async ({ page }) => {
  const cards = page.locator('#treatments .treatment-card');
  expect(await cards.count()).toBeGreaterThanOrEqual(5);
  // Each treatment other than the token-only baseline carries visible state text.
  await expect(page.locator('.treatment--text .state-badge')).toHaveText('Unavailable');
  await expect(page.locator('.treatment--icon .state-badge')).toHaveText('Unavailable');
  await expect(page.locator('.treatment--group .state-badge')).toHaveText('Unavailable');
  await expect(page.locator('.treatment--pattern .state-badge')).toHaveText('Unavailable');
});

test('disabled checked controls in treatments keep their checkmark or dot', async ({ page }) => {
  // The checked disabled checkbox retains a background-image (the check glyph).
  const image = await page.locator('#treat-text').evaluate((el) => getComputedStyle(el).backgroundImage);
  expect(image).not.toBe('none');
});

// --- No hover treatment on proposed disabled booleans ----------------------

test('proposed disabled checkboxes and toggles have no hover box-shadow', async ({ page }) => {
  await page.getByLabel('Merge request !16905').check();
  await page.locator('#checkbox-checked-disabled').hover();
  const checkboxShadow = await page.locator('#checkbox-checked-disabled').evaluate((el) => getComputedStyle(el).boxShadow);
  expect(checkboxShadow).toBe('none');
  await page.locator('#toggle-disabled').hover();
  const toggleShadow = await page.locator('#toggle-disabled').evaluate((el) => getComputedStyle(el).boxShadow);
  expect(toggleShadow).toBe('none');
});

// --- Themes and Drupal treatments ------------------------------------------

for (const theme of ['light', 'dark']) {
  test(`renders without axe violations in ${theme} mode`, async ({ page }) => {
    await page.getByLabel(theme === 'light' ? 'Light' : 'Dark', { exact: true }).check();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
}

for (const impl of [
  { label: 'Current main', value: 'current' },
  { label: 'Merge request !16905', value: 'proposal' },
]) {
  test(`renders without axe violations for ${impl.value} Drupal treatment`, async ({ page }) => {
    await page.getByLabel(impl.label).check();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
}

// --- Forced colours (where supported) --------------------------------------

test('renders without axe violations in forced-colours mode', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

// --- axe with a dynamic state activated ------------------------------------

test('has no axe violations with the dynamic fieldset enabled', async ({ page }) => {
  await page.locator('#attachments-toggle').check();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test('has no axe violations with the region inert', async ({ page }) => {
  await page.locator('#inert-toggle').click();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
