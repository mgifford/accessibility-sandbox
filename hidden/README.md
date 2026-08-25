# Visually hidden implementation comparison

This directory compares current Drupal, The A11Y Project, GOV.UK Frontend, and a proposed Drupal adaptation.

**Start here:** `decision.html` is the one-page summary for decision-makers.
**To reproduce the tests:** see `REPRODUCE.md`.
**To see the raw evidence:** see `evidence/` and `guidepup/logs/at-findings.md`.

The implementations differ in visually-hidden CSS and, for the proposed Drupal
variant, in skip-target markup as well (the fragment `id` moves onto the
`<main>` landmark and the empty `tabindex="-1"` destination anchor is removed).
The test page switches the implementation stylesheet and the corresponding
skip-target markup:

- `tests.html?implementation=drupal`
- `tests.html?implementation=a11yproject`
- `tests.html?implementation=govuk`
- `tests.html?implementation=proposed`

## Faithful skip-link variants

For skip-link / `tabindex` testing, `variants/` holds static pages that reproduce
each real and proposed pattern faithfully (no runtime DOM mutation), so
assistive-technology testing observes exactly what each project ships:

- Current Drupal (empty `tabindex="-1"` destination anchor inside `<main>`)
- A11Y Project and GOV.UK (`id` + `tabindex="-1"` on `<main>`)
- Proposed Drupal variants crossing three skip-target patterns (SFNSP `<main id>`,
  `<main id tabindex="-1">`, retained empty anchor) with two reveal-CSS strategies
  (`:focus`/`:active`, `:focus-within`)

The pages are generated from a single source of truth. Regenerate after editing the
manifest or body template:

```sh
npm run build:variants
```

Validate that each page's skip target stays faithful:

```sh
npm run test:variants
```

See `variants/index.html` for the full matrix.

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
