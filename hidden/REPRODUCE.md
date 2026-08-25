# Reproducing the tests locally

This is the shortest path to running every automated test in this repository and
regenerating the evidence. For deeper detail see `TESTING.md` (methodology) and
`GUIDEPUP_SETUP.md` (VoiceOver specifics).

Run everything from the `hidden/` directory.

## 1. Install

```sh
npm install
npx playwright install
```

## 2. Deterministic tests (no screen reader needed)

These run under the Playwright test runner in WebKit, and also pass in Chromium
(`--browser=chromium`). No macOS, no VoiceOver, no special permissions.

```sh
npm run test:axe            # axe-core scan of each implementation
npm run test:compare        # CSS/behavior matrix -> logs/comparison-report.{json,md}
npm run test:variants       # skip-target markup is faithful per variant
npm run test:skip-focus     # after the skip link, next Tab resumes inside <main> (SFNSP)
npm run test:focus-within   # :focus-within reveals hidden wrappers; :focus-only does not
npm run test:elements       # element-level hidden-content report -> logs/elements-report.*
```

Build the faithful variant pages (regenerates `variants/*.html` from one source):

```sh
npm run build:variants
```

## 3. VoiceOver tests (macOS only)

These drive real VoiceOver and capture what it speaks. They need setup and
permissions; without them they skip or fail cleanly rather than produce false
results.

Prerequisites (one time):

```sh
npx @guidepup/setup setup
npx @guidepup/setup install
```

Plus, in System Settings, grant the app that launches these commands:

- **Accessibility** (Privacy & Security → Accessibility)
- **Automation** → VoiceOver and System Events
- **Full Disk Access** — required for Guidepup to mount its VoiceOver preferences;
  without it, start fails with an `EPERM` symlink error. Restart the app after
  granting.

Also enable, in VoiceOver Utility → General: **Allow VoiceOver to be controlled
with AppleScript**.

Check the environment is ready:

```sh
npm run test:voiceover:diagnose     # prints a JSON diagnosis; guidepupStart should be true
```

Then:

```sh
npm run test:boundary-speech        # boundary announcement, current vs proposed -> logs/boundary-speech.json
npm run test:margin-order           # negative-margin announcement-order probe -> logs/margin-order.json
```

Note: the VoiceOver captures are standalone Node runners, not Playwright tests,
because the Playwright runner's browser has no frontable window for VoiceOver to
enter. This is expected; see `GUIDEPUP_SETUP.md`.

## 4. Compare against the reference

Committed reference captures are in `evidence/`. Your local `logs/` output should
match them (allowing for timestamps, which the reference has stripped). If a result
differs, that is a finding worth recording, not a test failure to hide.

## Where the results are interpreted

`guidepup/logs/at-findings.md` (committed) holds the narrative: what each result
means, and the cross-screen-reader picture including NVDA. The public-facing summary
for decision-makers is `decision.html`; the full anatomy is `implementations.html`;
what is still untested is `testing-plan.html`.
