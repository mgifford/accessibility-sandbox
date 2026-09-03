const root = document.documentElement;
const settingsStatus = document.querySelector('#settings-status');
const darkPreference = window.matchMedia('(prefers-color-scheme: dark)');

function parseColor(value) {
  const channels = value.match(/[\d.]+/g);
  if (!channels || channels.length < 3) {
    throw new Error(`Unsupported colour value: ${value}`);
  }
  return channels.slice(0, 3).map(Number);
}

function luminance(value) {
  const channels = parseColor(value).map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.04045
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return (0.2126 * channels[0]) + (0.7152 * channels[1]) + (0.0722 * channels[2]);
}

function contrastRatio(first, second) {
  const lighter = Math.max(luminance(first), luminance(second));
  const darker = Math.min(luminance(first), luminance(second));
  return (lighter + 0.05) / (darker + 0.05);
}

function resolvedTheme(theme) {
  if (theme === 'system') {
    return darkPreference.matches ? 'dark' : 'light';
  }
  return theme;
}

function updateMetrics() {
  const page = getComputedStyle(document.body).backgroundColor;
  const enabledInput = getComputedStyle(document.querySelector('#enabled-text'));
  const disabledInput = getComputedStyle(document.querySelector('#disabled-text'));
  const metrics = {
    'input-border': [enabledInput.borderColor, page],
    'disabled-background': [disabledInput.backgroundColor, page],
    'disabled-border': [disabledInput.borderColor, page],
    'disabled-text': [disabledInput.color, disabledInput.backgroundColor],
  };

  Object.entries(metrics).forEach(([name, colors]) => {
    const cell = document.querySelector(`[data-metric="${name}"]`);
    cell.textContent = `${contrastRatio(colors[0], colors[1]).toFixed(2)}:1`;
  });
}

function updateQuery(implementation, theme) {
  const url = new URL(window.location.href);
  url.searchParams.set('implementation', implementation);
  url.searchParams.set('theme', theme);
  window.history.replaceState({}, '', url);
}

function applySettings({ announce = true } = {}) {
  const implementation = document.querySelector('[name="implementation"]:checked').value;
  const theme = document.querySelector('[name="theme"]:checked').value;
  const resolved = resolvedTheme(theme);
  root.dataset.implementation = implementation;
  root.dataset.theme = theme;
  root.dataset.resolvedTheme = resolved;
  updateQuery(implementation, theme);

  window.requestAnimationFrame(() => {
    updateMetrics();
    if (announce) {
      const implementationName = implementation === 'proposal' ? 'merge request !16905' : 'current Drupal';
      const themeName = theme === 'system' ? `system preference, currently ${resolved}` : theme;
      settingsStatus.textContent = `Showing ${implementationName} styles in ${themeName} mode.`;
    }
  });
}

function restoreSettings() {
  const parameters = new URLSearchParams(window.location.search);
  const implementation = parameters.get('implementation');
  const theme = parameters.get('theme');
  const implementationInput = document.querySelector(`[name="implementation"][value="${implementation}"]`);
  const themeInput = document.querySelector(`[name="theme"][value="${theme}"]`);
  if (implementationInput) implementationInput.checked = true;
  if (themeInput) themeInput.checked = true;
}

restoreSettings();
document.querySelectorAll('[name="implementation"], [name="theme"]').forEach((control) => {
  control.addEventListener('change', () => applySettings());
});
darkPreference.addEventListener('change', () => {
  if (document.querySelector('[name="theme"]:checked').value === 'system') {
    applySettings({ announce: false });
  }
});
applySettings({ announce: false });

const ariaDisabledButton = document.querySelector('#aria-disabled-button');
ariaDisabledButton.addEventListener('click', (event) => {
  if (ariaDisabledButton.getAttribute('aria-disabled') === 'true') {
    event.preventDefault();
    document.querySelector('#aria-disabled-status').textContent = 'Publish was not activated. Editorial review is still required.';
    return;
  }
  const count = Number(ariaDisabledButton.dataset.activationCount) + 1;
  ariaDisabledButton.dataset.activationCount = String(count);
});

const validationForm = document.querySelector('#validation-form');
const reviewerEmail = document.querySelector('#reviewer-email');
const errorSummary = document.querySelector('#error-summary');
const errorHeading = document.querySelector('#error-summary-heading');
const reviewerError = document.querySelector('#reviewer-error');
const validationStatus = document.querySelector('#validation-status');

validationForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!reviewerEmail.validity.valid) {
    reviewerEmail.setAttribute('aria-invalid', 'true');
    errorSummary.hidden = false;
    reviewerError.hidden = false;
    validationStatus.textContent = '';
    errorHeading.focus();
    return;
  }
  reviewerEmail.removeAttribute('aria-invalid');
  errorSummary.hidden = true;
  reviewerError.hidden = true;
  validationStatus.textContent = 'Validation passed. This demonstration does not publish anything.';
});

reviewerEmail.addEventListener('input', () => {
  if (reviewerEmail.validity.valid) {
    reviewerEmail.removeAttribute('aria-invalid');
    errorSummary.hidden = true;
    reviewerError.hidden = true;
  }
});

const inertToggle = document.querySelector('#inert-toggle');
const inertRegion = document.querySelector('#inert-region');
const inertWrapper = document.querySelector('#inert-wrapper');
const inertStatus = document.querySelector('#inert-status');

inertToggle.addEventListener('click', () => {
  const makeInactive = !inertRegion.hasAttribute('inert');
  if (makeInactive && inertRegion.contains(document.activeElement)) {
    inertToggle.focus();
  }
  inertRegion.toggleAttribute('inert', makeInactive);
  inertRegion.setAttribute('aria-busy', String(makeInactive));
  inertWrapper.classList.toggle('is-inactive', makeInactive);
  inertToggle.setAttribute('aria-pressed', String(makeInactive));
  inertToggle.textContent = makeInactive ? 'Make preferences active' : 'Make preferences temporarily inactive';
  inertStatus.hidden = !makeInactive;
  inertStatus.textContent = makeInactive
    ? 'Preferences are loading. The controls below are temporarily unavailable.'
    : '';
});
