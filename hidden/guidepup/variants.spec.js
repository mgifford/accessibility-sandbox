import { test, expect } from "@playwright/test";
import path from "node:path";
import { pathToFileURL } from "node:url";

// Asserts that each generated variant page exposes the skip target faithfully:
// the skip link resolves to a real #main-content, and the tabindex placement
// matches the variant's declared pattern. This guards against the generator or a
// hand-edit silently changing what a variant reproduces.

const variantsDir = path.resolve("variants");

function fileUrl(name) {
  return pathToFileURL(path.join(variantsDir, name)).href;
}

// Expected skip-target shape per variant.
//   mainHasId:        <main> itself carries id="main-content"
//   mainTabindex:     tabindex value on <main> (null = absent)
//   anchorTarget:     an empty <a id="main-content" tabindex="-1"> exists as the target
const expectations = [
  { file: "drupal-current.html", mainHasId: false, mainTabindex: null, anchorTarget: true },
  { file: "a11yproject.html", mainHasId: true, mainTabindex: "-1", anchorTarget: false },
  { file: "govuk.html", mainHasId: true, mainTabindex: "-1", anchorTarget: false },
  { file: "proposed-sfnsp-focus.html", mainHasId: true, mainTabindex: null, anchorTarget: false },
  { file: "proposed-sfnsp-focuswithin.html", mainHasId: true, mainTabindex: null, anchorTarget: false },
  { file: "proposed-tabindex-focus.html", mainHasId: true, mainTabindex: "-1", anchorTarget: false },
  { file: "proposed-tabindex-focuswithin.html", mainHasId: true, mainTabindex: "-1", anchorTarget: false },
  { file: "proposed-anchor-focuswithin.html", mainHasId: false, mainTabindex: null, anchorTarget: true }
];

for (const spec of expectations) {
  test(`${spec.file}: skip target is faithful`, async ({ page }) => {
    await page.goto(fileUrl(spec.file));
    await page.waitForLoadState("domcontentloaded");

    // The skip link must always exist and point at #main-content.
    const skipLink = page.locator('a.skip-link[href="#main-content"]');
    await expect(skipLink).toHaveCount(1);

    // The fragment must resolve to a real element (no dangling skip link).
    const targetCount = await page.locator("#main-content").count();
    expect(targetCount, "#main-content target must exist").toBe(1);

    const targetInfo = await page.locator("#main-content").evaluate((el) => ({
      tag: el.tagName.toLowerCase(),
      tabindex: el.getAttribute("tabindex"),
      isEmptyAnchor: el.tagName.toLowerCase() === "a" && (el.textContent || "").trim() === ""
    }));

    if (spec.anchorTarget) {
      expect(targetInfo.tag, "target should be the empty destination anchor").toBe("a");
      expect(targetInfo.isEmptyAnchor).toBe(true);
      expect(targetInfo.tabindex).toBe("-1");
    } else {
      expect(targetInfo.tag, "target should be the main landmark").toBe("main");
    }

    // Verify tabindex placement on <main> regardless of which element holds the id.
    const mainTabindex = await page.locator("main").first().getAttribute("tabindex");
    expect(mainTabindex, `main tabindex for ${spec.file}`).toBe(spec.mainTabindex);
  });
}
