import { test, expect } from "@playwright/test";
import { voiceOver } from "@guidepup/guidepup";
import { moveNextWithFallback } from "./voiceover-utils.js";
import path from "node:path";
import { pathToFileURL } from "node:url";

const defaultBaseURL = `${pathToFileURL(path.resolve("tests.html")).href}`;
const baseURL = process.env.HIDDEN_TEST_URL || defaultBaseURL;
const preflightImplementation = process.env.VOICEOVER_PREFLIGHT_IMPLEMENTATION || "proposed";

test("VoiceOver preflight", async ({ page }) => {
  const failures = [];
  const warnings = [];

  if (process.platform !== "darwin") {
    failures.push("Guidepup VoiceOver automation requires macOS.");
  }

  try {
    await page.goto(`${baseURL}?implementation=${preflightImplementation}`);
    await page.waitForLoadState("domcontentloaded");
    await page.locator("body").click();

    await voiceOver.start();

    // Ensure VoiceOver is interacting with browser content before movement checks when supported.
    if (typeof voiceOver.navigateToWebContent === "function") {
      await voiceOver.navigateToWebContent();
    }

    await moveNextWithFallback(voiceOver);
    const phrase = await voiceOver.lastSpokenPhrase();
    const itemText = await voiceOver.itemText();
    if ((!phrase || !phrase.trim()) && (!itemText || !itemText.trim())) {
      warnings.push("VoiceOver started and moved, but no phrase or item text was captured.");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    failures.push(`VoiceOver automation failed: ${message}`);
  } finally {
    try {
      await voiceOver.stop();
    } catch {
      // If VoiceOver never started, stop can fail; ignore in preflight.
    }
  }

  if (failures.length > 0) {
    throw new Error(
      [
        "Guidepup preflight failed.",
        ...failures.map((item) => `- ${item}`),
        "",
        "Required setup steps:",
        "- npx @guidepup/setup setup",
        "- npx @guidepup/setup install",
        "- Complete every manual step in https://www.guidepup.dev/docs/guides/manual-voiceover-setup",
        "- Confirm VoiceOver can be controlled by AppleScript from this user session"
      ].join("\n")
    );
  }

  if (warnings.length > 0) {
    console.warn(`VoiceOver preflight warnings:\n- ${warnings.join("\n- ")}`);
  }

  expect(failures).toHaveLength(0);
});