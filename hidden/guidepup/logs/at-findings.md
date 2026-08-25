# Assistive-technology findings

Real observations from driving WebKit and VoiceOver on this machine, used to
design the differential harness. The point of the harness is to tell a genuine
accessibility improvement apart from a change that only tidies markup or CSS
("moving deck chairs"). Each claim below was tested against actual behavior, not
inferred from the stylesheet or the DOM.

Environment: macOS 26 (VoiceOver), WebKit and Chromium via Playwright.

## Cross-engine note (WebKit vs Blink)

The two deterministic verdicts were re-run against Chromium (Blink) as well as
WebKit and **hold on both engines**: skip-target focus resumption
(`skip-focus.spec.js`) and `:focus-within` wrapper reveal
(`focus-within-reveal.spec.js`) each pass identically under `--browser=chromium`.

The VoiceOver *spoken-output* capture could not be run against Chrome in this
environment: driving VoiceOver via AppleScript while Chromium is the frontmost app
returns "Not authorized to send Apple events to VoiceOver" (a macOS Automation
authorization that is scoped differently for Chromium than for WebKit). VoiceOver
reads Chrome fine for a human; only the automation is gated. The boundary-speech
finding below is therefore VoiceOver-on-WebKit only and should be re-confirmed on
Chrome/Blink where that automation gate can be cleared.

## Summary

| Claim | Verdict | Basis |
|---|---|---|
| Generated boundary spaces (`::before`/`::after` `\00a0`) change screen-reader output | Not supported on this platform | VoiceOver speaks a clean boundary with and without the spaces |
| Skip target without `tabindex="-1"` still resumes keyboard focus in `<main>` | Supported | Next Tab after activating the skip link lands inside `<main>` for every target variant |
| `:focus-within` reveals a hidden wrapper when a descendant is focused | Supported and differential | `:focus`-only implementations leave the wrapper hidden |

## 1. Boundary spaces: no VoiceOver-observable effect

The proposed CSS adds `content: "\00a0"` on `::before`/`::after` so visible and
hidden text are not concatenated in screen-reader output (the GOV.UK mitigation).

Observed VoiceOver output for the boundary link, captured by
`npm run test:boundary-speech` (see `boundary-speech.json`):

- current Drupal (no generated spaces): `Place block in the Header region link`
- proposed (generated `\00a0` spaces): `Place block in the Header region link`

Identical. Further, a minimal probe with **no whitespace at all** in the DOM
(`textContent` was literally `Place blockin the Header region`) still produced
`Place block in the Header region` from VoiceOver, with and without the generated
spaces. VoiceOver inserts a word boundary at the element edge on its own here.

Conclusion: on VoiceOver / WebKit / macOS 26 the generated-space mitigation is a
no-op. It may still matter for other screen readers (JAWS, NVDA on Windows),
which is where the mitigation originated, so this is a "verify elsewhere" result,
not "remove it." What it is *not* is a demonstrated VoiceOver improvement.

Why the old `textContent` assertions could not catch this: both the visible and
hidden words are present in the DOM whether or not a boundary is spoken, so a
`textContent`-includes check passes regardless of the actual spoken result.

## 2. Skip target without `tabindex="-1"`: focus resumption works

After focusing the skip link and activating it, the next Tab was observed to land
inside `<main>` for every target variant, including the proposed SFNSP form where
the target is not focusable:

| Variant | activeElement after Enter | Next Tab lands in `<main>`? |
|---|---|---|
| current (empty `tabindex="-1"` anchor) | the empty anchor | yes |
| proposed SFNSP (`main id`, no tabindex) | `body` (target not focusable) | yes |
| proposed (`main id tabindex="-1"`) | `<main>` | yes |

The next-Tab resumption inside `<main>` is provided by the browser's sequential
focus navigation starting point, set when the fragment link is followed. The
`tabindex="-1"` workaround is therefore removable here without regressing
keyboard focus order. Covered by `skip-focus.spec.js` (runs without VoiceOver).

Note: WebKit under Playwright does not reliably focus the skip link on the first
Tab from a fresh page (a documented keyboard-start quirk), so the test focuses the
skip link explicitly and measures resumption after activation, which is the
behavior in question.

## 3. `:focus-within` wrapper reveal: real and differential

When a focusable descendant inside a visually hidden wrapper receives focus, the
wrapper's clipped state was measured before and after:

| Implementation | Reveal rule | Wrapper clipped after descendant focus? |
|---|---|---|
| proposed | `:focus-within` | released (revealed) |
| current Drupal | `:active` / `:focus-within` | released (revealed) |
| A11Y Project | `:not(:focus):not(:active)` | still clipped |
| GOV.UK | `:not(:active):not(:focus)` | still clipped |

`:focus`-only implementations cannot react to a focused child, so a keyboard user
can move focus onto a link that remains visually hidden. `:focus-within` fixes
this. Covered by `focus-within-reveal.spec.js` (runs without VoiceOver), including
a guard asserting the behavior is differential (at least one implementation fails
to reveal).

## Harness architecture note: VoiceOver cannot run under `@playwright/test`

VoiceOver automation needs a frontable browser GUI window. A direct
`webkit.launch()` from a plain Node script surfaces a `Playwright` GUI process
that AppleScript can bring to the front. The `@playwright/test` runner launches
WebKit as a background process that does **not** surface such a window, so
fronting fails, the VoiceOver cursor never enters web content, and captures are
false or empty.

Therefore the VoiceOver capture (`run-boundary-speech.mjs`) is a **standalone
runner**, not a Playwright test. It launches a fresh browser per variant and
verifies, via `ensureInWebContent`, that the VoiceOver cursor actually reached the
page's web content before trusting any phrase. If fronting fails it errors rather
than recording a bad result. The deterministic specs (`skip-focus`,
`focus-within-reveal`) do not use VoiceOver and run normally under the test runner.
