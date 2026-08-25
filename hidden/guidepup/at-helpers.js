// Shared helpers for the differential assistive-technology harness.
//
// These encode navigation patterns that were verified to actually work against
// VoiceOver on macOS 26 / WebKit. In particular, voiceOver.next() (VO cursor
// move-right) does not reliably descend into web content; interact() followed by
// nextLink()/nextHeading() does. See guidepup/logs/at-findings.md for the probe
// evidence behind these choices.

import { pathToFileURL } from "node:url";
import path from "node:path";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export { delay };

export function variantUrl(name) {
  return pathToFileURL(path.resolve("variants", name)).href;
}

// Descend into web content so link/heading navigation works, tolerating builds
// where navigateToWebContent is unavailable.
export async function enterWebContent(voiceOver, stepMs = 300) {
  if (typeof voiceOver.navigateToWebContent === "function") {
    await voiceOver.navigateToWebContent();
    await delay(stepMs);
  }
  await voiceOver.interact();
  await delay(stepMs);
}

// VoiceOver and Guidepup do not always front the correct browser window, so the
// VoiceOver cursor can be sitting in the terminal, the Playwright inspector, or
// nowhere useful. Trusting captured phrases in that state produces false results.
// This verifies VoiceOver is actually in the page's web content, retrying the
// browser activation + interact sequence, and throws if it cannot get there so
// the caller can skip rather than assert against a bad capture.
//
// `page` is the Playwright page; `expectPhrase` is a RegExp the page's web area
// is expected to speak once the cursor is inside it (e.g. the page title).
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
    // Not in the right place; move once and re-check before retrying activation.
    await voiceOver.next().catch(() => {});
    await delay(stepMs);
    const retry = ((await voiceOver.lastSpokenPhrase()) || "").trim();
    if (expectPhrase.test(retry)) {
      return retry;
    }
  }
  throw new Error(
    `VoiceOver cursor is not in the expected web content after ${attempts} attempts ` +
      `(looking for ${expectPhrase}). The browser window was likely not fronted correctly.`
  );
}

// Walk links until one whose spoken phrase matches `test`, returning the phrase.
// Returns null if not found within `max` steps.
export async function findLinkPhrase(voiceOver, test, { max = 15, stepMs = 300 } = {}) {
  for (let i = 0; i < max; i++) {
    await voiceOver.nextLink();
    await delay(stepMs);
    const phrase = ((await voiceOver.lastSpokenPhrase()) || "").trim();
    if (test(phrase)) {
      return phrase;
    }
  }
  return null;
}

// Collect the spoken phrase for the first `count` links, in order.
export async function collectLinkPhrases(voiceOver, count, { stepMs = 300 } = {}) {
  const phrases = [];
  for (let i = 0; i < count; i++) {
    await voiceOver.nextLink();
    await delay(stepMs);
    phrases.push(((await voiceOver.lastSpokenPhrase()) || "").trim());
  }
  return phrases;
}
