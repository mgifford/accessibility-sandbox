# Visually hidden CSS comparison

This directory compares current Drupal, The A11Y Project, GOV.UK Frontend, and a proposed Drupal adaptation.

The test page uses one DOM and switches only the implementation stylesheet:

- `tests.html?implementation=drupal`
- `tests.html?implementation=a11yproject`
- `tests.html?implementation=govuk`
- `tests.html?implementation=proposed`

## Focus-within

The documentation page now includes a dedicated explanation of `:focus-within`, including nested focusable descendants and why Drupal's current behavior differs from direct `:focus` implementations.

## Guidepup

Run VoiceOver testing on macOS:

```sh
npm install
npx playwright install
npx @guidepup/setup setup
npx @guidepup/setup install
npm run test:voiceover
```

Run axe checks for the same four implementation variants:

```sh
npm run test:axe
```

Run repeatable validation checks (axe + comparison scoring):

```sh
npm run test:validate
```

By default both specs target the local file URL for `tests.html` in this folder.
Override with `HIDDEN_TEST_URL` if needed.

See `TESTING.md` for the full process, decision criteria, and explicit limits of automated testing in this repository.

For VoiceOver setup and troubleshooting, see `GUIDEPUP_SETUP.md`.

For quick manual review criteria for the two non-deterministic scenarios, see `MANUAL_SCENARIO_SUMMARY.md`.

Generated logs belong in `guidepup/logs/`. Do not treat synthetic logs as evidence.
