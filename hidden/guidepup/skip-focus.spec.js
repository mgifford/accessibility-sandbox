import { test, expect } from "@playwright/test";
import path from "node:path";
import { pathToFileURL } from "node:url";

// Differential test for the skip-target claim: after activating the skip link,
// does the NEXT Tab resume inside <main>? This is the behavior the tabindex="-1"
// workaround existed to provide, and the whole question behind removing it.
//
// This is a real keyboard test (activate + Tab), not a markup check. It runs
// without VoiceOver. Probe evidence: guidepup/logs/at-findings.md.
//
// Note on WebKit: pressing Tab from a fresh page does not reliably focus the
// skip link first (a documented WebKit/Playwright keyboard-start quirk). We
// therefore focus the skip link explicitly to isolate the SFNSP behavior from
// that unrelated quirk. What we are testing is focus RESUMPTION after the link
// is activated, not the browser's initial tab-start.

const variantsDir = path.resolve("variants");
const fileUrl = (name) => pathToFileURL(path.join(variantsDir, name)).href;

// Every skip-target variant should resume the next Tab inside <main>.
const targetVariants = [
  "drupal-current.html",
  "proposed-sfnsp-focus.html",
  "proposed-sfnsp-focuswithin.html",
  "proposed-tabindex-focus.html",
  "proposed-tabindex-focuswithin.html",
  "proposed-anchor-focuswithin.html",
];

for (const file of targetVariants) {
  test(`${file}: next Tab after skip link resumes inside main`, async ({ page }) => {
    await page.goto(fileUrl(file));
    await page.waitForLoadState("domcontentloaded");

    // Focus the skip link directly, then activate it.
    await page.locator("a.skip-link").focus();
    expect(
      await page.evaluate(() => document.activeElement?.classList?.contains("skip-link")),
      "skip link should be focused"
    ).toBe(true);

    await page.keyboard.press("Enter");
    // The fragment navigation sets the sequential-focus starting point.
    await expect.poll(() => page.evaluate(() => location.hash)).toBe("#main-content");

    await page.keyboard.press("Tab");

    const resumedInsideMain = await page.evaluate(() => {
      const main = document.querySelector("main");
      const el = document.activeElement;
      return !!(main && el && main.contains(el));
    });

    expect(
      resumedInsideMain,
      "after activating the skip link, the next Tab should land inside <main>"
    ).toBe(true);
  });
}
