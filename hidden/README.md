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
npm run test:voiceover
```

Generated logs belong in `guidepup/logs/`. Do not treat synthetic logs as evidence.
