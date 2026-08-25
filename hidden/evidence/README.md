# Reference evidence

These are curated, committed reference captures from the assistive-technology
tests, so anyone can see the observed results without running anything, and can
compare their own local runs against a known baseline.

They are distinct from `../guidepup/logs/`, which holds the raw per-run output and
is intentionally not committed (it changes on every run). The files here have had
volatile fields (timestamps) removed so the reference stays stable.

## Files

- `boundary-speech.json` — VoiceOver spoken output for the boundary link on current
  Drupal vs. proposed. Captured by `npm run test:boundary-speech`. Records that the
  generated `\00a0` spaces made no difference on VoiceOver/WebKit (see the caveat:
  this is the opposite of NVDA + Chrome, where they matter).
- `comparison-report.md` — the deterministic CSS/behavior matrix across the four
  implementations. Regenerate with `npm run test:compare`.

## Narrative findings

The interpreted, cross-screen-reader findings (including the NVDA 2026.1.1 + Chrome
results contributed in review) live in `../guidepup/logs/at-findings.md`, which is
committed. Start there for what the evidence means; use the files here to see the
raw captures and to diff your own runs.

## How to regenerate

See `../REPRODUCE.md` for the exact commands and prerequisites.
