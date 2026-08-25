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

## Deck chairs versus real improvement

The purpose of this repository is to decide whether a proposed change is an actual
accessibility improvement, not merely a tidier stylesheet or simpler markup. Two
of the strongest claims for the proposal are the two that deterministic automation
cannot verify on its own:

1. **Boundary spaces.** The proposal adds generated non-breaking spaces so that a
   screen reader does not concatenate visible and hidden text (for example
   "Place block" and "in the Header region"). The `textContent` and phrase-presence
   checks in `comparison.spec.js` and `elements-report.spec.js` are **structurally
   blind to this**: both words are present in the DOM whether or not the screen
   reader inserts a boundary, so those checks pass regardless of the spoken result.
   A test that passes no matter what the feature does is not evidence for the
   feature.

2. **Skip target without `tabindex="-1"`.** Moving `#main-content` onto `<main>` and
   removing the workaround relies on the browser's sequential focus navigation
   starting point. Whether keyboard focus and the screen-reader reading position
   actually resume in the main region is a runtime behavior. Inspecting the
   generated markup (as `variants.spec.js` does) confirms the shape is correct but
   says nothing about the behavior.

For claims like these, the deterministic layer should assert only what it can
honestly observe (that the CSS or markup *differs* in the expected direction), and
the behavioral conclusion must come from driving a real screen reader. This is the
role of the Guidepup track. Treat a green deterministic run as necessary but not
sufficient; it rules out regressions in structure, not in experience.

A differential framing is more useful here than pass/fail. The question is not
"does the proposed page pass" but "does the proposed page produce an observably
different, better screen-reader result than current Drupal for the same DOM." The
`variants/` pages exist so current and proposed can be compared directly on that
basis.

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

### Reading the VoiceOver result honestly

`npm run test:voiceover` defaults to `VOICEOVER_MIN_CHECKPOINT_MATCHES=1`, so the
test can pass after matching a single checkpoint out of nine. That default proves
VoiceOver *ran and moved*, not that the proposal *helped*. A passing default run is
a smoke test, not evidence of improvement.

For decision-making, do not rely on the default threshold. Instead:

- Raise the bar (`test:voiceover:strict` sets `VOICEOVER_MIN_CHECKPOINT_MATCHES=6`
  and requires a non-empty spoken log), and
- Read `voiceover-differences.md` directly to compare spoken phrases between
  current Drupal and proposed for the boundary scenarios (2, 3, 7). The evidence is
  in the *difference* between implementations, not in whether any single run
  reached a pass count.

The checkpoint needles only test that a phrase appears somewhere in the spoken log.
They do not, on their own, test whether a word boundary was preserved. Judging
boundary quality still requires reading the spoken phrases (or the manual Scenario 4
notes), which is why boundary claims are treated as assistive-technology evidence
rather than automated pass/fail.
