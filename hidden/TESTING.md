# Hidden Content Testing Guide

This folder has a repeatable test matrix for visually hidden behavior across four implementations and nine scenarios. Implementations differ in CSS and, for the proposed Drupal variant, in skip-target markup as well.

## Scope

Page under test:

- `tests.html?implementation=drupal`
- `tests.html?implementation=a11yproject`
- `tests.html?implementation=govuk`
- `tests.html?implementation=proposed`

Matrix shape:

- 4 implementations x 9 test scenarios

Each implementation is a combination of a visually-hidden CSS strategy and a
skip-target markup pattern. The proposed Drupal variant differs from current
Drupal in both CSS (`:focus-within` reveal) and skip-target markup (`id` on the
`<main>` landmark rather than an empty `tabindex="-1"` destination anchor), so
"implementation" here means more than CSS alone.

## Test tracks

There are three tracks:

1. `axe` automated checks (deterministic)
2. CSS behavior matrix comparison (deterministic)
3. Guidepup VoiceOver traversal and phrase-difference logging (environment-dependent)

## One-time setup

Run from `hidden/`:

```sh
npm install
npx playwright install
```

For VoiceOver on macOS:

```sh
npx @guidepup/setup setup
npx @guidepup/setup install
```

Then complete the manual steps in:

- https://www.guidepup.dev/docs/guides/manual-voiceover-setup

## Repeatable commands

From `hidden/`:

```sh
npm run test:axe
npm run test:compare
npm run test:validate
npm run test:voiceover:preflight
npm run test:voiceover
npm run test:a11y
```

Notes:

- `test:validate` is the default CI-like gate in this repo.
- `test:voiceover` now runs a preflight first and fails fast with setup guidance if VoiceOver automation is not ready.

## Report artifacts

Generated under `guidepup/logs/`:

- `axe-*.json`: axe output per implementation
- `comparison-report.json`: machine-readable 4x9 implementation matrix report
- `comparison-report.md`: human-readable matrix + ranking + scenario details
- `voiceover-*.json`: VoiceOver phrase log and scenario checkpoint matches
- `voiceover-*.md`: concise per-implementation VoiceOver summary
- `voiceover-differences.md`: side-by-side phrase differences by scenario

## How "better" is demonstrated

Automated determination uses the matrix report:

- Each implementation receives pass/fail/manual statuses per scenario.
- Ranking is based on automated pass count first, automated fail count second.
- Manual-only scenarios are explicitly excluded from automated ranking.

This means the report demonstrates which implementation is better for what is testable in deterministic automation.

## What cannot be fully tested here

The repository cannot fully automate or prove:

- Human perception of spoken boundary quality (pauses, prosody, intelligibility)
- Cross-screen-reader consistency beyond local VoiceOver behavior
- Scenario 9 low-vision outcomes (400% zoom, magnifier context tracking)
- Full clipboard interpretation in external applications (Scenario 8)

These require manual review notes in addition to automated results.

Additional caveat for Scenario 1:

- WebKit/macOS automated Tab behavior for links depends on system/browser keyboard navigation preferences.
- The matrix verifies skip-link reveal on focus in CSS deterministically, but true keyboard-first tab order still needs manual confirmation.

For concise manual instructions for Scenario 4 and Scenario 9, use `MANUAL_SCENARIO_SUMMARY.md`.

## Scenario intent and fixture wording

The labels "Place block", "all content", and "Continue" are test fixtures, not product-copy recommendations.

- "Place block" + hidden suffix stresses visible-to-hidden boundary joining.
- hidden "Search" + "all content" stresses hidden-to-visible boundary joining.
- "Continue" + long hidden context stresses long-label handling and no-wrap behavior.

The controls are intentionally mixed (links, buttons, headings, legends, summaries, table cells) to test hidden text behavior across different semantic contexts.

## Recommended review gate

Use this sequence for repeatable decision-making:

1. Run `npm run test:validate` and require pass.
2. Review `guidepup/logs/comparison-report.md` for matrix and ranking changes.
3. Run `npm run test:voiceover` on a configured macOS machine.
4. Review `guidepup/logs/voiceover-differences.md` for spoken differences.
5. Add manual notes for Scenario 4 and Scenario 9 before final conclusions.
