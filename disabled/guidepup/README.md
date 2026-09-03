# Screen-reader scenarios (Guidepup)

Focused Guidepup coverage for the disabled-controls experiment. These runners
drive a real screen reader and capture what it actually speaks. They do **not**
establish usability; they record raw speech so terminology and behaviour can be
compared across screen readers.

Adapted from `../../hidden/guidepup`. Like that harness, the runners are
standalone Node scripts, **not** `@playwright/test` files: a screen reader needs a
frontable browser window, which the Playwright test runner does not provide.
`at-helpers.js` verifies the screen-reader cursor actually reached the page's web
content before trusting any captured phrase.

## Commands

```sh
npm run test:voiceover:diagnose   # check VoiceOver automation is ready (macOS)
npm run test:voiceover            # run the VoiceOver scenarios (macOS)
npm run test:nvda                 # run the NVDA scenarios (Windows only)
```

VoiceOver prerequisites (macOS): Accessibility, Automation (VoiceOver + System
Events), and Full Disk Access granted to the controlling app, plus "Allow
VoiceOver to be controlled with AppleScript" in VoiceOver Utility. See
`../../hidden/GUIDEPUP_SETUP.md` for the full setup and troubleshooting.

These commands are intentionally **not** in the default GitHub Actions workflow,
which stays Linux-deterministic. Run them locally on macOS or Windows.

## Scenarios

Single-control announcements (`lastSpokenPhrase()`):

- native disabled control
- `aria-disabled` announcement and blocked activation
- `readonly`
- enabled radio group legend, selected state, and position
- individually disabled radio option
- entirely disabled radio group
- file input label, hint, and disabled state
- date input label and disabled state

Transitions (`spokenPhraseLog()`, log cleared immediately before the action):

- dynamic unavailable announcement
- dynamic available announcement
- inert content disappearing (unavailable)
- inert content returning (available)

## Terminology

Screen readers describe the same state differently ("disabled", "dimmed",
"unavailable"). Scenarios match a set of accepted phrases (see `PHRASES` in
`at-helpers.js`) rather than one exact transcript.

## Evidence

Each run writes `logs/voiceover-evidence.json` (or `logs/nvda-evidence.json`) with,
per scenario:

- operating system;
- browser and version;
- screen reader and version;
- timestamp;
- scenario;
- raw captured speech;
- expected result;
- observed result (matched / no match / error).

Raw logs under `logs/` are git-ignored because they change every run. Copy a
run you want to keep into a committed location and label it with its full
environment, the way `../../hidden/evidence` does.
