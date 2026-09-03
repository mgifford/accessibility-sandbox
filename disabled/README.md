# Disabled and inactive controls experiment

This directory separates two questions that are often conflated:

1. Can people perceive the difference between available and unavailable controls in light, dark, hover, and forced-colour modes?
2. Is an unavailable control the right interaction pattern for the task?

Open `index.html` directly or visit:

<https://mgifford.github.io/accessibility-sandbox/disabled/>

## What the comparison reproduces

The appearance switch uses the disabled-control values and relevant checkbox and toggle selectors from:

- Drupal `main` on 3 September 2026;
- Drupal merge request !16905 for issue #3617875.

It also demonstrates the description-text concern in issue #3200635. Coordinating a disabled control's label and description is exploratory here and is not presented as part of merge request !16905.

The page is not a complete or pixel-identical copy of Drupal Default Admin. Layout, typography, and unrelated component details are intentionally omitted so the state differences remain visible.

## Interaction patterns

The page provides working examples of:

- native `disabled`;
- focusable `aria-disabled` with activation blocked in JavaScript;
- an active submit action with accessible validation;
- `readonly`;
- an `inert` region with a visible and programmatic loading explanation.

See `TESTING.md` for the test procedure and limits.

## Automated checks

```sh
npm install
npx playwright install chromium
npm test
```

Automated checks cover state switching, keyboard-relevant semantics, activation blocking, validation focus, inert behaviour, and axe-core. They do not establish screen-reader speech output or usability.
