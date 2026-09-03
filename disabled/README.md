# Disabled and inactive controls experiment

This directory separates two questions that are often conflated:

1. Can people perceive the difference between available and unavailable controls in light, dark, hover, and forced-colour modes?
2. Is an unavailable control the right interaction pattern for the task?

Open `index.html` directly or visit:

<https://mgifford.github.io/accessibility-sandbox/disabled/>

## Scope

The page produces evidence about:

- native disabled form-control behaviour, including radios, file, date, time, datetime-local, number, and range inputs;
- `aria-disabled`, `readonly`, `<fieldset disabled>`, and `inert`;
- whether enabled and unavailable controls are distinguishable without relying only on grey text;
- how dynamic availability changes are communicated to screen-reader users;
- differences between Drupal's current Default Admin styles and merge request !16905.

It is a focused experiment, not a component library. Layout, typography, and
unrelated Drupal component details are intentionally omitted so the state
differences stay visible.

## What the comparison reproduces

The appearance switch uses the disabled-control values and relevant checkbox and toggle selectors from:

- Drupal `main` on 3 September 2026;
- Drupal merge request !16905 for issue #3617875.

It also demonstrates the description-text concern in issue #3200635. Coordinating a disabled control's label and description is exploratory here and is not presented as part of merge request !16905. Experimental visual treatments are kept clearly separate from the Drupal-source-faithful values, and neither the current nor the proposed Drupal values are altered to look better.

## Sections

- **Appearance** — Drupal treatment and colour-scheme switches, with shareable URL parameters, plus contrast diagnostics.
- **Control comparison** — enabled vs disabled for text, select, textarea, checkboxes, radio groups, buttons, file, date/time, number, range, and a placeholder matrix.
- **Visual treatments** — five ways to convey the unavailable state using more than grey text.
- **Interaction patterns** — native `disabled`, focusable `aria-disabled` (activation blocked in script), active validation, `readonly`, a temporarily `inert` region, a dynamically disabled fieldset, and a form-submission consequences demonstration.
- **Decision guide** and **References**.

### Radio groups

Each content radio example is a real multi-option group in a `<fieldset>` with a
meaningful `<legend>`: one fully available, one with a single unavailable option,
and one entirely unavailable via `<fieldset disabled>`. Checked options keep their
dot when disabled.

### Dynamic availability and live regions

The dynamically disabled fieldset and the `inert` region each keep an always-present,
never-hidden `role="status"` container and update only its text content on each
transition. The controller keeps focus; focus is never moved into a newly enabled
region.

### Form-submission consequences

Submitting the consequences form shows the resulting `FormData` as text,
demonstrating that disabled controls are omitted while `readonly` values are
submitted.

## Automated checks

```sh
npm install
npx playwright install chromium firefox webkit
npm run test:cross-browser
```

Deterministic Playwright tests run in Chromium, Firefox, and WebKit. They cover
state switching, radio structure and interaction, the new input types, the
placeholder matrix, file-input styling, dynamic fieldset and inert transitions,
live-region presence and single updates, focus retention, form-data inclusion and
exclusion, light/dark and current/proposed Drupal treatments, forced-colours, and
axe-core with several states activated.

`npm test` runs HTML validation plus the Chromium project (the CI default). A
zero-violation axe result is **not** evidence that a disabled interaction is
understandable.

## Screen-reader scenarios

Focused Guidepup scenarios live in `guidepup/`. They drive a real screen reader
(VoiceOver on macOS, NVDA on Windows) and record raw speech as evidence. They are
run locally, not in the default CI, which stays Linux-deterministic. See
`guidepup/README.md`.

## Evidence limits

See `TESTING.md`. In short: automated checks confirm attributes, focusability,
events, and colour values; they do not decide whether disabling an action is
understandable. That needs task-based testing with disabled people.
