import { test, expect } from "@playwright/test";
import path from "node:path";
import { pathToFileURL } from "node:url";

// Differential test for the :focus-within claim: when a focusable descendant
// inside a visually hidden wrapper receives focus, does the wrapper reveal?
//
// This is the keyboard-accessibility case that distinguishes :focus-within from
// bare :focus. A :focus-only reveal cannot react to a focused child, so a
// keyboard user can land focus on a link that stays visually hidden. Measured by
// the wrapper leaving its 1px clipped box. Probe evidence: at-findings.md.

const variantsDir = path.resolve("variants");
const fileUrl = (name) => pathToFileURL(path.join(variantsDir, name)).href;

// Observed behavior on WebKit. `reveals` = wrapper grows past the 1px box when
// its descendant link is focused.
const cases = [
  { file: "proposed-sfnsp-focuswithin.html", reveals: true, rule: ":focus-within" },
  { file: "proposed-tabindex-focuswithin.html", reveals: true, rule: ":focus-within" },
  { file: "drupal-current.html", reveals: true, rule: ":active/:focus-within" },
  { file: "a11yproject.html", reveals: false, rule: ":not(:focus):not(:active)" },
  { file: "govuk.html", reveals: false, rule: ":not(:active):not(:focus)" },
];

// A wrapper is "revealed" when it leaves the clipped/hidden state: clipping is
// released (clip-path becomes none/auto and clip becomes auto) and it rejoins
// normal flow. Bounding-box size alone is unreliable because a wrapper with
// padding/border can measure larger than 1px while still being fully clipped
// (e.g. The A11Y Project's rule leaves it at 36x36 but still clip: rect(0 0 0 0)).
async function isRevealed(page) {
  return page.locator(".focus-wrapper").evaluate((n) => {
    const s = getComputedStyle(n);
    const clipReleased = s.clipPath === "none" || s.clipPath === "auto";
    const legacyClipReleased = s.clip === "auto";
    return clipReleased && legacyClipReleased;
  });
}

for (const { file, reveals, rule } of cases) {
  test(`${file} (${rule}): wrapper ${reveals ? "reveals" : "stays hidden"} on descendant focus`, async ({ page }) => {
    await page.goto(fileUrl(file));
    await page.waitForLoadState("domcontentloaded");

    const before = await isRevealed(page);
    expect(before, "wrapper should start hidden").toBe(false);

    await page.locator(".focus-wrapper a").focus();
    const revealed = await isRevealed(page);

    expect(
      revealed,
      `wrapper revealed=${revealed} after descendant focus; expected reveals=${reveals}`
    ).toBe(reveals);
  });
}

test("focus-within is differential: at least one implementation fails to reveal", () => {
  // Guards the point of the claim: if every implementation revealed, :focus-within
  // would be redundant. The value is that :focus-only implementations do NOT.
  const nonRevealing = cases.filter((c) => !c.reveals);
  expect(nonRevealing.length).toBeGreaterThan(0);
});
