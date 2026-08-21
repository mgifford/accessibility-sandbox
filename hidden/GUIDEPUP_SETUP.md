# Guidepup Step 1 Playbook

Use this when you need to get VoiceOver automation working reliably in this repo.

This repo is a static HTML/CSS test harness, not a running Drupal site.
The `drupal` implementation name is a behavior variant label for comparison only.

## Goal

Get this command passing:

```sh
npm run test:voiceover:preflight
```

If preflight passes, `npm run test:voiceover` can run the full 4-implementation traversal.

Preflight now opens the test page URL (`tests.html?implementation=proposed` by default) before VoiceOver movement checks.

If preflight does not pass, run:

```sh
npm run test:voiceover:diagnose
```

This prints a JSON diagnosis for AppleScript baseline checks and Guidepup move/phrase checks.

## Run order

From `hidden/`:

```sh
npm install
npx playwright install
npx @guidepup/setup setup
npx @guidepup/setup install
npm run test:voiceover:preflight
```

## Manual macOS steps (required)

Complete every step in the official guide:

- <https://www.guidepup.dev/docs/guides/manual-voiceover-setup>

Do not skip this section. `setup` + `install` are not sufficient by themselves.

## Terminal access setup (iTerm2 specific)

Guidepup runs AppleScript from the app that launched the command.
If you run tests in iTerm2, iTerm2 needs the permissions.
If you run tests in VS Code integrated terminal, VS Code needs the permissions.

Pick one terminal app and run all VoiceOver tests from that app consistently.

### 1) Accessibility permission

Open System Settings -> Privacy & Security -> Accessibility.

Ensure your terminal app is enabled:

- iTerm2 (if using iTerm2)
- Visual Studio Code (if using integrated terminal)

If missing, add it with the plus button, then toggle it on.

### 2) Automation permission (Apple Events)

Open System Settings -> Privacy & Security -> Automation.

Expand your terminal app entry and allow automation for:

- VoiceOver
- System Events

If you do not see these toggles yet, run the quick trigger commands below once; macOS should prompt.

### 3) Quick trigger commands (run in your chosen terminal)

```sh
/usr/bin/osascript -e 'tell application "VoiceOver" to activate'
/usr/bin/osascript -e 'tell application "System Events" to UI elements enabled'
npm run test:voiceover:diagnose
```

Accept every macOS permission prompt.

### 4) If permissions look right but preflight still fails

Reset TCC permissions for your terminal app, then retry and re-approve prompts.

For iTerm2:

```sh
tccutil reset Accessibility com.googlecode.iterm2
tccutil reset AppleEvents com.googlecode.iterm2
```

For VS Code:

```sh
tccutil reset Accessibility com.microsoft.VSCode
tccutil reset AppleEvents com.microsoft.VSCode
```

Then run again:

```sh
npx @guidepup/setup setup
npx @guidepup/setup install
npm run test:voiceover:diagnose
npm run test:voiceover:preflight
```

If preflight still fails with `right doesn\'t understand the "move" message (-1708)`, use the fallback section at the end of this file.

## Current known failure in this workspace

Preflight currently fails with AppleScript automation error `-1708`:

- `VoiceOver unable to move`
- `right doesn’t understand the “move” message`

This indicates VoiceOver is still not fully controllable from this user session.

## Quick recovery checklist

1. Re-run `npx @guidepup/setup setup`.
2. Re-run `npx @guidepup/setup install`.
3. Re-check manual guide settings and permissions (VoiceOver + Automation + Accessibility).
4. Ensure VoiceOver can be controlled in the current login session.
5. Run `npm run test:voiceover:preflight` again.

## Running against the hosted page URL

Use `HIDDEN_TEST_URL` when you want to test the published page instead of local file URLs:

```sh
HIDDEN_TEST_URL="https://mgifford.github.io/accessibility-sandbox/hidden/tests.html" npm run test:voiceover:diagnose
HIDDEN_TEST_URL="https://mgifford.github.io/accessibility-sandbox/hidden/tests.html" npm run test:voiceover:preflight
HIDDEN_TEST_URL="https://mgifford.github.io/accessibility-sandbox/hidden/tests.html" npm run test:voiceover
```

To visibly confirm the browser page is loading, use headed mode:

```sh
HIDDEN_TEST_URL="https://mgifford.github.io/accessibility-sandbox/hidden/tests.html" npm run test:voiceover:preflight:headed
HIDDEN_TEST_URL="https://mgifford.github.io/accessibility-sandbox/hidden/tests.html" npm run test:voiceover:headed
HIDDEN_TEST_URL="https://mgifford.github.io/accessibility-sandbox/hidden/tests.html" npm run test:voiceover:headed:long
HIDDEN_TEST_URL="https://mgifford.github.io/accessibility-sandbox/hidden/tests.html" npm run test:voiceover:single:proposed:capture
HIDDEN_TEST_URL="https://mgifford.github.io/accessibility-sandbox/hidden/tests.html" npm run test:voiceover:single:proposed:scan
HIDDEN_TEST_URL="https://mgifford.github.io/accessibility-sandbox/hidden/tests.html" npm run test:voiceover:single:drupal:headed:long
HIDDEN_TEST_URL="https://mgifford.github.io/accessibility-sandbox/hidden/tests.html" npm run test:voiceover:single:drupal:capture
```

The full VoiceOver traversal can exceed Playwright's default 30s timeout. Use `test:voiceover:headed:long` for slower machines/sessions.
If you want one stable pass before comparing all implementations, use `test:voiceover:single:proposed:capture` first.
If VoiceOver seems to stop early or repeat the same phrase, use `test:voiceover:single:proposed:scan` for phased heading/link navigation with step-by-step progress logs.
Use `single:drupal:*` only when you explicitly want to compare that variant.
After that, use `test:voiceover:strict` for full strict comparison assertions.
You can also tune runtime with env vars:

- `VOICEOVER_TEST_TIMEOUT_MS` (default `180000`)
- `VOICEOVER_TRAVERSAL_STEPS` (default `160`)
- `VOICEOVER_STEP_DELAY_MS` (default `220`)
- `VOICEOVER_STAGNATION_LIMIT` (default `28`)
- `VOICEOVER_REPEAT_PHRASE_LIMIT` (default `10`)
- `VOICEOVER_IMPLEMENTATIONS` (default `drupal,a11yproject,govuk,proposed`; set `proposed` for a single pass)
- `VOICEOVER_MIN_CHECKPOINT_MATCHES` (default `1`)
- `VOICEOVER_REQUIRE_SPOKEN_LOG` (default `0`; set `1` for strict runs)

Important: run these commands from `accessibility-sandbox/hidden`.
If run from `drupal-core`, npm will report `Missing script` for `test:voiceover:*` because those scripts are only defined in this folder's `package.json`.

## Interpreting diagnose output with fallback

If you see this combination:

- `guidepupMoveNext`: failed with `-1708`
- `guidepupMoveNextFallback`: succeeded

then terminal permissions are generally fine, and this environment should use keyboard command fallback for movement.

If `guidepupLastPhrase` is empty in diagnose, treat that as non-blocking unless full traversal tests also fail.
Likewise, preflight may print a warning about empty phrase/item capture; if movement succeeded and no preflight failure is reported, continue to `npm run test:voiceover`.

## Decision tree

1. Run `npm run test:voiceover:diagnose`.
2. If AppleScript baseline checks fail:
   - Focus on macOS permissions and manual setup steps.
3. If AppleScript baseline checks pass, but `guidepupMoveNext` fails with `-1708`:
   - You are likely hitting a Guidepup/VoiceOver command compatibility issue on this macOS version or still have an incomplete VoiceOver manual setup detail.
4. In that state, keep using deterministic validation (`npm run test:validate`) and manual Scenario 4/9 review until VoiceOver automation is unblocked.

## Evidence to keep

- Preflight output (pass/fail)
- `npm run test:voiceover` output
- Any generated logs under `guidepup/logs/`

## Session note file (recommended)

Create a timestamped copy of the manual template before each run:

```sh
ts=$(date +%Y%m%d-%H%M%S)
cp guidepup/logs/manual-scenarios-comparison-template.md guidepup/logs/manual-scenarios-${ts}.md
echo "Created guidepup/logs/manual-scenarios-${ts}.md"
```

Use the new file to capture Scenario 4 and Scenario 9 observations for that specific run.

## After preflight passes

Run:

```sh
npm run test:voiceover
```

Expected outputs:

- `guidepup/logs/voiceover-drupal.json`
- `guidepup/logs/voiceover-a11yproject.json`
- `guidepup/logs/voiceover-govuk.json`
- `guidepup/logs/voiceover-proposed.json`
- `guidepup/logs/voiceover-differences.md`

## Practical fallback when blocked

If preflight remains blocked at `VoiceOver unable to move`:

- Treat `npm run test:validate` as your repeatable gate.
- Use `MANUAL_SCENARIO_SUMMARY.md` for consistent manual VoiceOver and zoom notes.
- Keep the `test:voiceover:diagnose` JSON output as reproducible evidence for future Guidepup/macOS compatibility follow-up.
