// Assistive-technology helpers for the disabled-controls experiment.
//
// Adapted from hidden/guidepup/at-helpers.js. The key lesson carried over: never
// trust a captured phrase unless the screen-reader cursor is actually inside the
// page's web content, and the browser window is fronted. These runners are
// standalone (not @playwright/test) because the test runner's browser has no
// frontable window for a screen reader to enter.

import { pathToFileURL } from "node:url";
import path from "node:path";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export { delay };

export function pageUrl() {
  return pathToFileURL(path.resolve("index.html")).href;
}

// Accepted phrase alternatives: screen-reader terminology varies, so match a set
// rather than one exact transcript.
export const PHRASES = {
  disabled: /disabled|dimmed|unavailable|not available/i,
  readOnly: /read[\s-]?only/i,
  radioSelected: /selected|checked/i,
};

export async function enterWebContent(voiceOver, stepMs = 300) {
  if (typeof voiceOver.navigateToWebContent === "function") {
    await voiceOver.navigateToWebContent();
    await delay(stepMs);
  }
  await voiceOver.interact();
  await delay(stepMs);
}

export async function ensureInWebContent(
  voiceOver,
  page,
  activate,
  expectPhrase,
  { attempts = 4, stepMs = 300 } = {}
) {
  for (let attempt = 0; attempt < attempts; attempt++) {
    await page.bringToFront();
    await page.locator("body").click();
    await activate();
    await delay(stepMs);
    await enterWebContent(voiceOver, stepMs);

    const phrase = ((await voiceOver.lastSpokenPhrase()) || "").trim();
    if (expectPhrase.test(phrase)) {
      return phrase;
    }
    await voiceOver.next().catch(() => {});
    await delay(stepMs);
    const retry = ((await voiceOver.lastSpokenPhrase()) || "").trim();
    if (expectPhrase.test(retry)) {
      return retry;
    }
  }
  throw new Error(
    `Screen-reader cursor is not in the expected web content after ${attempts} attempts ` +
      `(looking for ${expectPhrase}). The browser window was likely not fronted correctly.`
  );
}

// Move forward through elements until the spoken phrase matches, returning the
// phrase. Uses next() (element-by-element) which reaches form controls that
// nextLink()/nextHeading() would skip.
export async function findPhrase(voiceOver, test, { max = 60, stepMs = 250 } = {}) {
  for (let i = 0; i < max; i++) {
    await voiceOver.next().catch(() => {});
    await delay(stepMs);
    const phrase = ((await voiceOver.lastSpokenPhrase()) || "").trim();
    if (test(phrase)) {
      return phrase;
    }
  }
  return null;
}

// Build one evidence record with the full metadata the experiment requires.
export function evidenceRecord({
  scenario,
  browser,
  browserVersion,
  screenReader,
  screenReaderVersion,
  capturedSpeech,
  expected,
  observed,
}) {
  return {
    os: `${process.platform}`,
    browser,
    browserVersion,
    screenReader,
    screenReaderVersion,
    timestamp: new Date().toISOString(),
    scenario,
    capturedSpeech,
    expected,
    observed,
  };
}
